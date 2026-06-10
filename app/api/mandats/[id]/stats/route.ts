import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const mandatId = Number(params.id)

  const [total, agg, nbARetenir, nbAEtudier, nbNonRetenus, nbShortlistes, genreData, nationaliteData, evolutionData] = await Promise.all([
    prisma.candidature.count({ where: { mandatId } }),
    prisma.candidature.aggregate({
      where: { mandatId, score: { not: null } },
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
    }),
    prisma.candidature.count({ where: { mandatId, recommendation: 'A_RETENIR' } }),
    prisma.candidature.count({ where: { mandatId, recommendation: 'A_ETUDIER' } }),
    prisma.candidature.count({ where: { mandatId, recommendation: 'NON_RETENU' } }),
    prisma.shortlist.count({ where: { mandatId } }),
    prisma.candidature.groupBy({
      by: ['genre'],
      where: { mandatId },
      _count: true,
    }),
    prisma.candidature.groupBy({
      by: ['nationalite'],
      where: { mandatId, nationalite: { not: null } },
      _count: true,
      orderBy: { _count: { nationalite: 'desc' } },
      take: 8,
    }),
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at)::text as date, COUNT(*)::bigint as count
      FROM candidatures
      WHERE mandat_id = ${mandatId}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ])

  // Score distribution
  const allScores = await prisma.candidature.findMany({
    where: { mandatId, score: { not: null } },
    select: { score: true },
  })

  const dist = [
    { tranche: '0-20', count: 0 },
    { tranche: '20-40', count: 0 },
    { tranche: '40-60', count: 0 },
    { tranche: '60-75', count: 0 },
    { tranche: '75-100', count: 0 },
  ]
  for (const { score } of allScores) {
    const s = score!
    if (s < 20) dist[0].count++
    else if (s < 40) dist[1].count++
    else if (s < 60) dist[2].count++
    else if (s < 75) dist[3].count++
    else dist[4].count++
  }

  const genre: Record<string, number> = { M: 0, F: 0, Inconnu: 0 }
  for (const g of genreData) {
    genre[g.genre] = g._count
  }

  return NextResponse.json({
    totalCandidatures: total,
    scoreMoyen: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : null,
    scoreMax: agg._max.score,
    scoreMin: agg._min.score,
    nbARetenir,
    nbAEtudier,
    nbNonRetenus,
    nbShortlistes,
    repartitionGenre: genre,
    topNationalites: nationaliteData.map(n => ({ nationalite: n.nationalite!, count: n._count })),
    distributionScores: dist,
    evolutionTemps: evolutionData.map(d => ({ date: d.date, count: Number(d.count) })),
  })
}
