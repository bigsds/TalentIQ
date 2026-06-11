import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Last 5 candidatures received
  const recent = await prisma.candidature.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nom: true,
      prenom: true,
      createdAt: true,
      score: true,
      mandat: {
        select: { ref: true, poste: true },
      },
    },
  })

  // Count new this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const nbNew = await prisma.candidature.count({
    where: { createdAt: { gte: weekAgo } },
  })

  return NextResponse.json({
    nbNew,
    recent: recent.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  })
}
