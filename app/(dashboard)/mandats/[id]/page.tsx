import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import MandatDetailClient from '@/components/mandats/MandatDetailClient'

async function getMandat(id: number) {
  const mandat = await prisma.mandat.findUnique({
    where: { id },
    include: {
      client: true,
      _count: { select: { candidatures: true, shortlists: true } },
    },
  })
  return mandat
}

export default async function MandatDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return notFound()

  const id = Number(params.id)
  if (isNaN(id)) return notFound()

  const mandat = await getMandat(id)
  if (!mandat) return notFound()

  const scoreAgg = await prisma.candidature.aggregate({
    where: { mandatId: id, score: { not: null } },
    _avg: { score: true },
  })
  const nbARetenir = await prisma.candidature.count({ where: { mandatId: id, recommendation: 'A_RETENIR' } })

  const statutColors: Record<string, string> = {
    actif: 'bg-green-100 text-green-800',
    cloture: 'bg-gray-100 text-gray-800',
    archive: 'bg-orange-100 text-orange-800',
  }
  const statutLabels: Record<string, string> = { actif: 'Actif', cloture: 'Clôturé', archive: 'Archivé' }

  const serialized = {
    ...mandat,
    createdAt: mandat.createdAt.toISOString(),
    updatedAt: mandat.updatedAt.toISOString(),
    datefinCollecte: mandat.datefinCollecte?.toISOString() ?? null,
    client: {
      ...mandat.client,
      createdAt: mandat.client.createdAt.toISOString(),
      updatedAt: mandat.client.updatedAt.toISOString(),
    },
    scoreMoyen: scoreAgg._avg.score ? Math.round(scoreAgg._avg.score * 10) / 10 : null,
    nbARetenir,
  }

  return (
    <div>
      {/* Back link */}
      <Link href="/mandats" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1F4E79] mb-4 transition-colors">
        <ArrowLeft size={16} />
        Mandats
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-[#64748B]">{mandat.ref}</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statutColors[mandat.statut]}`}>
                {statutLabels[mandat.statut]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B] font-jakarta mb-3">{mandat.poste}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
              <span>🏢 {mandat.client.nom}</span>
              {mandat.lieu && <span>📍 {mandat.lieu}</span>}
              {mandat.datefinCollecte && (
                <span className={new Date(mandat.datefinCollecte) < new Date() ? 'text-red-600 font-medium' : ''}>
                  📅 Clôture : {formatDate(mandat.datefinCollecte)}
                </span>
              )}
              {mandat.secteur && <span>🏭 {mandat.secteur}</span>}
            </div>
          </div>
        </div>

        {/* KPI mini-cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E2E8F0]">
          {[
            { label: 'CVs reçus', value: mandat._count.candidatures },
            { label: 'Score moyen', value: serialized.scoreMoyen ? `${serialized.scoreMoyen}/100` : '—' },
            { label: 'À retenir', value: nbARetenir },
            { label: 'Shortlistés', value: mandat._count.shortlists },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[#1F4E79] font-jakarta">{stat.value}</p>
              <p className="text-xs text-[#64748B] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs: Candidatures + Shortlist */}
      <MandatDetailClient mandat={serialized} />
    </div>
  )
}
