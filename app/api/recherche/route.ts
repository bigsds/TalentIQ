import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { query, secteur, expMin, scoreMin } = body

  // Try N8n webhook first
  if (process.env.N8N_BASE_URL) {
    try {
      const webhookRes = await fetch(
        `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_RECHERCHE || '/webhook/hg-recherche'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, secteur, expMin, scoreMin }),
          signal: AbortSignal.timeout(15000),
        }
      )
      if (webhookRes.ok) {
        const data = await webhookRes.json()
        return NextResponse.json(data)
      }
    } catch {
      // Fall through to basic search
    }
  }

  // Fallback: basic DB search (no vector, keyword-based)
  const where: Record<string, unknown> = {}
  if (expMin) where.anneesExperience = { gte: expMin }
  if (scoreMin) where.score = { gte: scoreMin }

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
      score: true,
    },
  })

  return NextResponse.json({
    results: results.map(r => ({ ...r, similarite: 0 })),
    fallback: true,
  })
}
