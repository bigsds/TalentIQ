import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [indexedRows, totalCandidatures] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM candidature_embeddings`,
    prisma.candidature.count(),
  ])

  return NextResponse.json({
    totalIndexed: Number(indexedRows[0].count),
    totalCandidatures,
    hasApiKey: !!process.env.OPENAI_API_KEY,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { query, secteur, expMin, scoreMin } = body

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Requête vide' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return fallbackSearch({ expMin, scoreMin })
  }

  // Generate query embedding via OpenAI
  let embedding: number[]
  try {
    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: query.trim(), model: 'text-embedding-3-small' }),
      signal: AbortSignal.timeout(15000),
    })
    if (!embRes.ok) throw new Error(`OpenAI ${embRes.status}`)
    const embData = await embRes.json()
    embedding = embData.data[0].embedding as number[]
  } catch (err) {
    console.error('Embedding generation failed:', err)
    return fallbackSearch({ expMin, scoreMin })
  }

  // Build pgvector cosine-similarity query
  // vectorStr comes from OpenAI (array of floats) — safe to interpolate directly
  const vectorStr = '[' + embedding.join(',') + ']'
  const esc = (s: string) => s.replace(/'/g, "''")

  let where = ''
  if (expMin && Number(expMin) > 0) {
    where += ` AND c.annees_experience >= ${Number(expMin)}`
  }
  if (scoreMin && Number(scoreMin) > 0) {
    where += ` AND c.score >= ${Number(scoreMin)}`
  }
  if (secteur && secteur !== 'all') {
    where += ` AND c.secteurs_exp @> '["${esc(String(secteur))}"]'::jsonb`
  }

  const sql = `
    SELECT
      c.id,
      c.nom,
      c.prenom,
      c.dernier_poste        AS "dernierPoste",
      c.annees_experience    AS "anneesExperience",
      c.niveau_formation     AS "niveauFormation",
      c.nationalite,
      c.competences_cles     AS "competencesCles",
      c.secteurs_exp         AS "secteursExp",
      c.score,
      c.recommendation,
      c.cv_url               AS "cvUrl",
      m.ref                  AS "mandatRef",
      m.poste                AS "mandatPoste",
      (1 - (ce.embedding <=> '${vectorStr}'::vector)) AS similarite
    FROM candidatures c
    JOIN candidature_embeddings ce ON ce.candidature_id = c.id
    JOIN mandats m ON m.id = c.mandat_id
    WHERE 1=1${where}
    ORDER BY ce.embedding <=> '${vectorStr}'::vector
    LIMIT 20
  `

  type Row = {
    id: number
    nom: string | null
    prenom: string | null
    dernierPoste: string | null
    anneesExperience: number | null
    niveauFormation: string | null
    nationalite: string | null
    competencesCles: unknown
    secteursExp: unknown
    score: number | null
    recommendation: string
    cvUrl: string | null
    mandatRef: string
    mandatPoste: string
    similarite: number
  }

  const [rows, indexedRows] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(sql),
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM candidature_embeddings`,
  ])

  return NextResponse.json({
    results: rows.map(r => ({
      ...r,
      competencesCles: Array.isArray(r.competencesCles) ? r.competencesCles : [],
      secteursExp: Array.isArray(r.secteursExp) ? r.secteursExp : [],
      similarite: Number(r.similarite),
    })),
    totalIndexed: Number(indexedRows[0].count),
    vectorSearch: true,
  })
}

async function fallbackSearch({ expMin, scoreMin }: { expMin?: number; scoreMin?: number }) {
  const where: Record<string, unknown> = {}
  if (expMin) where.anneesExperience = { gte: Number(expMin) }
  if (scoreMin) where.score = { gte: Number(scoreMin) }

  const results = await prisma.candidature.findMany({
    where,
    take: 20,
    orderBy: { score: 'desc' },
    select: {
      id: true,
      nom: true,
      prenom: true,
      dernierPoste: true,
      anneesExperience: true,
      niveauFormation: true,
      nationalite: true,
      competencesCles: true,
      secteursExp: true,
      score: true,
      recommendation: true,
      cvUrl: true,
      mandat: { select: { ref: true, poste: true } },
    },
  })

  return NextResponse.json({
    results: results.map(r => ({
      ...r,
      mandatRef: r.mandat.ref,
      mandatPoste: r.mandat.poste,
      competencesCles: Array.isArray(r.competencesCles) ? r.competencesCles : [],
      secteursExp: Array.isArray(r.secteursExp) ? r.secteursExp : [],
      similarite: 0,
    })),
    fallback: true,
  })
}
