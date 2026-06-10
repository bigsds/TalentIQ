import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mandatId = searchParams.get('mandatId') ? Number(searchParams.get('mandatId')) : undefined
  const recommendation = searchParams.get('recommendation') || undefined
  const statut = searchParams.get('statut') || undefined
  const search = searchParams.get('search') || undefined
  const sortBy = searchParams.get('sortBy') || 'score'
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (mandatId) where.mandatId = mandatId
  if (recommendation) where.recommendation = recommendation
  if (statut) where.statut = statut
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const orderBy: Record<string, string> =
    sortBy === 'score' ? { score: 'desc' } :
    sortBy === 'date' ? { createdAt: 'desc' } :
    sortBy === 'nom' ? { nom: 'asc' } :
    { score: 'desc' }

  const [candidatures, total] = await Promise.all([
    prisma.candidature.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.candidature.count({ where }),
  ])

  return NextResponse.json({ candidatures, total, page, limit })
}
