import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    mandatsActifs,
    mandatsLastMonth,
    cvsThisMonth,
    cvsLastMonth,
    scoreData,
    scoreDataLastMonth,
    nbARetenir,
    totalCandidatures,
    recentMandats,
    recentCandidatures,
    evolutionData,
  ] = await Promise.all([
    prisma.mandat.count({ where: { statut: 'actif' } }),
    prisma.mandat.count({ where: { statut: 'actif', createdAt: { lt: startOfMonth } } }),
    prisma.candidature.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.candidature.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.candidature.aggregate({ _avg: { score: true }, where: { score: { not: null } } }),
    prisma.candidature.aggregate({ _avg: { score: true }, where: { score: { not: null }, createdAt: { lte: endOfLastMonth } } }),
    prisma.candidature.count({ where: { recommendation: 'A_RETENIR' } }),
    prisma.candidature.count(),
    prisma.mandat.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        _count: { select: { candidatures: true } },
      },
    }),
    prisma.candidature.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { mandat: { include: { client: true } } },
    }),
    // Evolution over last 30 days
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at)::text as date, COUNT(*)::bigint as count
      FROM candidatures
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ])

  // Compute score moyen for each recent mandat
  const mandatsWithScore = await Promise.all(
    recentMandats.map(async (m) => {
      const agg = await prisma.candidature.aggregate({
        where: { mandatId: m.id, score: { not: null } },
        _avg: { score: true },
      })
      return { ...m, scoreMoyen: agg._avg.score }
    })
  )

  return NextResponse.json({
    mandatsActifs,
    mandatsActifsVariation: mandatsActifs - mandatsLastMonth,
    cvsThisMonth,
    cvsVariation: cvsLastMonth > 0
      ? Math.round(((cvsThisMonth - cvsLastMonth) / cvsLastMonth) * 100)
      : 0,
    scoreMoyen: scoreData._avg.score ? Math.round(scoreData._avg.score) : null,
    scoreMoyenVariation: scoreData._avg.score && scoreDataLastMonth._avg.score
      ? Math.round(scoreData._avg.score - scoreDataLastMonth._avg.score)
      : 0,
    nbARetenir,
    nbARetenirPct: totalCandidatures > 0 ? Math.round((nbARetenir / totalCandidatures) * 100) : 0,
    recentMandats: mandatsWithScore,
    recentCandidatures,
    evolutionData: evolutionData.map(d => ({ date: d.date, count: Number(d.count) })),
  })
}
