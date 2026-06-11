'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Users, TrendingUp, Star, Award } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import ScoreBadge from '@/components/candidats/ScoreBadge'
import RecommendationBadge from '@/components/candidats/RecommendationBadge'
import { formatDate } from '@/lib/utils'
import dynamic from 'next/dynamic'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFDownloadLink),
  { ssr: false }
)

const RapportPDF = dynamic(
  () => import('@/components/rapports/RapportPDF'),
  { ssr: false }
)

const GENRE_COLORS = ['#1F4E79', '#7EC8E3', '#E2E8F0']
const DIST_COLOR = '#1F4E79'

export default function RapportPage() {
  const params = useParams()
  const id = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['rapport', id],
    queryFn: async () => {
      const res = await fetch(`/api/rapports/${id}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-[#E2E8F0] rounded w-64 animate-pulse" />
        <TableSkeleton rows={4} cols={4} />
      </div>
    )
  }

  if (!data) return <div className="text-[#94A3B8]">Rapport introuvable</div>

  const { mandat, stats, shortlists } = data

  const genreChartData = [
    { name: 'Hommes', value: stats.repartitionGenre.M },
    { name: 'Femmes', value: stats.repartitionGenre.F },
    { name: 'N/P', value: stats.repartitionGenre.Inconnu },
  ].filter(d => d.value > 0)

  return (
    <div>
      {/* Back */}
      <Link
        href={`/mandats/${mandat.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1F4E79] mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Retour au mandat
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta">
            Rapport — {mandat.ref}
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            {mandat.poste} · {mandat.client?.nom}
            {mandat.datefinCollecte && ` · Clôture : ${formatDate(mandat.datefinCollecte)}`}
          </p>
        </div>
        {/* PDF Export */}
        <PDFDownloadLink
          document={
            <RapportPDF
              mandat={mandat}
              stats={stats}
              shortlists={shortlists}
              cabinetNom={process.env.NEXT_PUBLIC_CABINET_NOM}
            />
          }
          fileName={`rapport-${mandat.ref}.pdf`}
        >
          {({ loading: pdfLoading }: { loading: boolean }) => (
            <Button
              className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white gap-2"
              disabled={pdfLoading}
            >
              <Download size={16} />
              {pdfLoading ? 'Génération...' : 'Exporter PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Section 1: KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Candidatures reçues', value: stats.totalCandidatures, icon: Users },
          { label: 'Score moyen', value: stats.scoreMoyen ? `${stats.scoreMoyen}/100` : '—', icon: TrendingUp },
          { label: 'Score max', value: stats.scoreMax ? `${Math.round(stats.scoreMax)}/100` : '—', icon: Award },
          { label: 'À retenir', value: stats.nbARetenir, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-[#D6E4F0]">
              <Icon size={20} className="text-[#1F4E79]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1E293B] font-jakarta">{value}</p>
              <p className="text-xs text-[#64748B]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Section 2: Genre */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#1E293B] font-jakarta mb-4">Répartition par genre</h3>
          {genreChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[#94A3B8] text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genreChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {genreChartData.map((_, i) => (
                    <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Candidats']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Section 3: Nationalités */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#1E293B] font-jakarta mb-4">Top nationalités</h3>
          {stats.topNationalites.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[#94A3B8] text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.topNationalites}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="nationalite"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip formatter={(v) => [v, 'Candidats']} />
                <Bar dataKey="count" fill="#1F4E79" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Section 4: Distribution scores */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6">
        <h3 className="text-base font-semibold text-[#1E293B] font-jakarta mb-4">Distribution des scores</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.distributionScores} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="tranche" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => [v, 'Candidats']} />
            <Bar dataKey="count" fill={DIST_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section 5: Shortlist */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="text-base font-semibold text-[#1E293B] font-jakarta">
            Shortlist recommandée ({shortlists.length})
          </h3>
        </div>
        {shortlists.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#94A3B8]">
            Aucun candidat shortlisté pour ce mandat
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                {['Rang', 'Nom Prénom', 'Score', 'Recommandation', 'Points forts clés'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {shortlists.map((s: { id: number; rang: number; candidature: { id: number; prenom: string; nom: string; score: number | null; recommendation: string; pointsForts: string[] } }) => {
                const pts = (s.candidature.pointsForts as string[]) ?? []
                return (
                  <tr key={s.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-sm font-bold text-[#1F4E79]">#{s.rang}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/candidats/${s.candidature.id}`}
                        className="text-sm font-medium text-[#1E293B] hover:text-[#1F4E79]"
                      >
                        {s.candidature.prenom} {s.candidature.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><ScoreBadge score={s.candidature.score} /></td>
                    <td className="px-4 py-3"><RecommendationBadge recommendation={s.candidature.recommendation} /></td>
                    <td className="px-4 py-3 text-sm text-[#64748B]">
                      {pts.slice(0, 2).join(' · ') || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
