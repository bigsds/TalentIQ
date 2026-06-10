import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { n8n } from '@/lib/n8n'

const mandatSchema = z.object({
  clientId: z.number().int().positive(),
  poste: z.string().min(1),
  lieu: z.string().optional(),
  secteur: z.string().optional(),
  mission: z.string().optional(),
  descriptionOffre: z.string().optional(),
  profilRequis: z.string().min(1),
  datefinCollecte: z.string(),
  nbPostes: z.number().int().positive().default(1),
})

function generateRef(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `REF-${year}-${rand}`
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut') || undefined
  const clientId = searchParams.get('clientId') ? Number(searchParams.get('clientId')) : undefined
  const secteur = searchParams.get('secteur') || undefined
  const search = searchParams.get('search') || undefined
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (statut) where.statut = statut
  if (clientId) where.clientId = clientId
  if (secteur) where.secteur = secteur
  if (search) where.OR = [
    { poste: { contains: search, mode: 'insensitive' } },
    { ref: { contains: search, mode: 'insensitive' } },
  ]

  const [mandats, total] = await Promise.all([
    prisma.mandat.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        _count: { select: { candidatures: true } },
      },
    }),
    prisma.mandat.count({ where }),
  ])

  // Compute score moyen per mandat
  const mandatsWithScore = await Promise.all(
    mandats.map(async (m) => {
      const agg = await prisma.candidature.aggregate({
        where: { mandatId: m.id, score: { not: null } },
        _avg: { score: true },
      })
      return { ...m, scoreMoyen: agg._avg.score }
    })
  )

  return NextResponse.json({ mandats: mandatsWithScore, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = mandatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  let ref = generateRef()

  // Ensure unique ref
  let existing = await prisma.mandat.findUnique({ where: { ref } })
  while (existing) {
    ref = generateRef()
    existing = await prisma.mandat.findUnique({ where: { ref } })
  }

  const mandat = await prisma.mandat.create({
    data: {
      ref,
      clientId: data.clientId,
      poste: data.poste,
      lieu: data.lieu,
      secteur: data.secteur,
      mission: data.mission,
      descriptionOffre: data.descriptionOffre,
      profilRequis: data.profilRequis,
      datefinCollecte: data.datefinCollecte ? new Date(data.datefinCollecte) : null,
      nbPostes: data.nbPostes,
    },
    include: { client: true },
  })

  // Trigger N8n (non-blocking)
  n8n.nouveauMandat({ mandat, ref }).catch(() => {})

  return NextResponse.json(mandat, { status: 201 })
}
