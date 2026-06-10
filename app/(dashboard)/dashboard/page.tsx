import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileText, Users, TrendingUp, Star } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import CandidaturesChart from '@/components/dashboard/CandidaturesChart'
import RecentMandats from '@/components/dashboard/RecentMandats'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getDashboardData() {
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
      include: { client: true, _count: { select: { candidatures: true } } },
    }),
    prisma.candidature.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { mandat: { include: { client: true } } },
    }),
  ])

  const evolution = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE(created_at)::text as date, COUNT(*)::bigint as count
    FROM candidatures
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  const mandatsWithScore = await Promise.all(
    recentMandats.map(async (m) => {
      const agg = await prisma.candidature.aggregate({
        where: { mandatId: m.id, score: { not: null } },
        _avg: { score: true },
      })
      return { ...m, scoreMoyen: agg._avg.score, datefinCollecte: m.datefinCollecte?.toISOString() ?? null }
    })
  )

  return {
    mandatsActifs,
    mandatsVariation: mandatsActifs - mandatsLastMonth,
    cvsThisMonth,
    cvsVariation: cvsLastMonth > 0 ? Math.round(((cvsThisMonth - cvsLastMonth) / cvsLastMonth) * 100) : 0,
    scoreMoyen: scoreData._avg.score ? Math.round(scoreData._avg.score) : null,
    scoreMoyenVariation: scoreData._avg.score && scoreDataLastMonth._avg.score
      ? Math.round(scoreData._avg.score - scoreDataLastMonth._avg.score) : 0,
    nbARetenir,
    nbARetenirPct: totalCandidatures > 0 ? Math.round((nbARetenir / totalCandidatures) * 100) : 0,
    recentMandats: mandatsWithScore,
    recentCandidatures: recentCandidatures.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      mandat: c.mandat ? {
        ...c.mandat,
        createdAt: c.mandat.createdAt.toISOString(),
        updatedAt: c.mandat.updatedAt.toISOString(),
        datefinCollecte: c.mandat.datefinCollecte?.toISOString() ?? null,
        client: {
          ...c.mandat.client,
          createdAt: c.mandat.client.createdAt.toISOString(),
          updatedAt: c.mandat.client.updatedAt.toISOString(),
        },
      } : null,
    })),
    evolutionData: evolution.map(d => ({ date: d.date, count: Number(d.count) })),
  }
}

export default async function DashboardPage() {
  await auth()
  const data = await getDashboardData()

  const recLabels: Record<string, string> = {
    A_RETENIR: 'À retenir',
    A_ETUDIER: 'À étudier',
    NON_RETENU: 'Non retenu',
  }
  const recColors: Record<string, string> = {
    A_RETENIR: 'text-green-700 bg-green-50',
    A_ETUDIER: 'text-orange-700 bg-orange-50',
    NON_RETENU: 'text-red-700 bg-red-50',
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Mandats actifs"
          value={data.mandatsActifs}
          variation={data.mandatsVariation}
          subtitle="vs mois précédent"
          icon={FileText}
        />
        <StatCard
          title="CVs ce mois"
          value={data.cvsThisMonth}
          variation={data.cvsVariation}
          subtitle="% vs mois précédent"
          icon={Users}
        />
        <StatCard
          title="Score moyen"
          value={data.scoreMoyen !== null ? `${data.scoreMoyen}/100` : '—'}
          variation={data.scoreMoyenVariation || undefined}
          subtitle="pts vs mois précédent"
          icon={TrendingUp}
        />
        <StatCard
          title="À retenir"
          value={data.nbARetenir}
          subtitle={`${data.nbARetenirPct}% du total`}
          icon={Star}
        />
      </div>

      {/* Chart */}
      <CandidaturesChart data={data.evolutionData} />

      {/* Recent mandats table */}
      <RecentMandats mandats={data.recentMandats} />

      {/* Recent candidatures */}
      <div className="bg-white rounded-xl border border-[#E2E8F0]">
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="text-base font-semibold text-[#1E293B] font-jakarta">Dernières candidatures</h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {data.recentCandidatures.length === 0 && (
            <div className="py-12 text-center text-sm text-[#94A3B8]">Aucune candidature reçue</div>
          )}
          {data.recentCandidatures.map((c) => (
            <Link
              key={c.id}
              href={`/candidats/${c.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-[#1E293B]">
                  {c.prenom} {c.nom}
                </p>
                <p className="text-xs text-[#64748B]">
                  {c.mandat?.poste} · {c.mandat?.client?.nom}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.score !== null && (
                  <span className="text-sm font-semibold text-[#1F4E79]">
                    {Math.round(c.score)}/100
                  </span>
                )}
                {c.recommendation && (
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${recColors[c.recommendation] || ''}`}>
                    {recLabels[c.recommendation] || c.recommendation}
                  </span>
                )}
                <span className="text-xs text-[#94A3B8]">{formatDate(c.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
