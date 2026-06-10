'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MandatFilters from '@/components/mandats/MandatFilters'
import EmptyState from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatDate, getScoreColor } from '@/lib/utils'

const statutLabels: Record<string, string> = { actif: 'Actif', cloture: 'Clôturé', archive: 'Archivé' }
const statutColors: Record<string, string> = {
  actif: 'bg-green-100 text-green-800',
  cloture: 'bg-gray-100 text-gray-800',
  archive: 'bg-orange-100 text-orange-800',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MandatRow = Record<string, any>

export default function MandatsPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['mandats', { search, statut, page }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statut) params.set('statut', statut)
      params.set('page', String(page))
      params.set('limit', '20')
      const res = await fetch(`/api/mandats?${params}`)
      return res.json()
    },
  })

  const handleReset = useCallback(() => {
    setSearch('')
    setStatut('')
    setPage(1)
  }, [])

  const mandats: MandatRow[] = data?.mandats ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta">Mandats</h2>
          <p className="text-sm text-[#64748B] mt-1">{total} mandat{total > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/mandats/new">
          <Button className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white">
            <Plus size={16} className="mr-2" /> Nouveau mandat
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <MandatFilters
          search={search}
          statut={statut}
          onSearchChange={v => { setSearch(v); setPage(1) }}
          onStatutChange={v => { setStatut(v); setPage(1) }}
          onReset={handleReset}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={5} cols={7} /></div>
        ) : mandats.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun mandat"
            description="Créez votre premier mandat pour commencer à recevoir des candidatures."
            action={
              <Link href="/mandats/new">
                <Button className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white">
                  <Plus size={16} className="mr-2" /> Créer un mandat
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  {['Réf', 'Client', 'Poste', 'Lieu', 'Statut', 'CVs', 'Score moy.', 'Clôture', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {mandats.map((m: MandatRow) => {
                  const score = m.scoreMoyen ? Math.round(m.scoreMoyen) : null
                  const scoreStyle = score ? getScoreColor(score) : null
                  const isOverdue = m.datefinCollecte && new Date(m.datefinCollecte) < new Date()
                  return (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/mandats/${m.id}`} className="text-sm font-medium text-[#1F4E79] hover:underline">
                          {m.ref}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1E293B]">{m.client?.nom}</td>
                      <td className="px-4 py-3 text-sm text-[#1E293B] max-w-[160px] truncate">{m.poste}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{m.lieu || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statutColors[m.statut] || ''}`}>
                          {statutLabels[m.statut] || m.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B] text-center">{m._count?.candidatures ?? 0}</td>
                      <td className="px-4 py-3">
                        {score && scoreStyle ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${scoreStyle.bg} ${scoreStyle.text}`}>
                            {score}/100
                          </span>
                        ) : <span className="text-xs text-[#94A3B8]">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-[#64748B]'}`}>
                        {formatDate(m.datefinCollecte)}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/mandats/${m.id}`} className="text-xs text-[#1F4E79] hover:underline font-medium">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-[#64748B]">
                  Page {page} sur {totalPages} ({total} mandats)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
