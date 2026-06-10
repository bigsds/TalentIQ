'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, Star, XCircle, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ScoreBadge from '@/components/candidats/ScoreBadge'
import RecommendationBadge from '@/components/candidats/RecommendationBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import { getStatutColor } from '@/lib/utils'

const statutLabels: Record<string, string> = {
  recu: 'Reçu',
  en_etude: 'En étude',
  preselectionne: 'Présélectionné',
  shortliste: 'Shortlisté',
  rejete: 'Rejeté',
  embauche: 'Embauché',
}

interface MandatDetailClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mandat: Record<string, any>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CandidatureRow = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShortlistRow = Record<string, any>

export default function MandatDetailClient({ mandat }: MandatDetailClientProps) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [recFilter, setRecFilter] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<{ type: 'shortlist' | 'reject'; candidatureId: number; nom: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['candidatures', mandat.id, { search, recFilter, sortBy, page }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('mandatId', String(mandat.id))
      if (search) params.set('search', search)
      if (recFilter) params.set('recommendation', recFilter)
      params.set('sortBy', sortBy)
      params.set('page', String(page))
      params.set('limit', '20')
      const res = await fetch(`/api/candidatures?${params}`)
      return res.json()
    },
  })

  const { data: shortlistData } = useQuery({
    queryKey: ['shortlist', mandat.id],
    queryFn: async () => {
      const res = await fetch(`/api/shortlists?mandatId=${mandat.id}`)
      return res.json()
    },
  })

  const shortlistMutation = useMutation({
    mutationFn: async (candidatureId: number) => {
      const res = await fetch('/api/shortlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandatId: mandat.id, candidatureId }),
      })
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Candidat shortlisté')
      qc.invalidateQueries({ queryKey: ['candidatures', mandat.id] })
      qc.invalidateQueries({ queryKey: ['shortlist', mandat.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors du shortlisting'),
  })

  const rejectMutation = useMutation({
    mutationFn: async (candidatureId: number) => {
      const res = await fetch(`/api/candidatures/${candidatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'rejete' }),
      })
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Candidat rejeté')
      qc.invalidateQueries({ queryKey: ['candidatures', mandat.id] })
      setConfirmAction(null)
    },
    onError: () => toast.error('Erreur lors du rejet'),
  })

  const candidatures: CandidatureRow[] = data?.candidatures ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)
  const shortlists: ShortlistRow[] = shortlistData ?? []

  return (
    <>
      <Tabs defaultValue="candidatures">
        <TabsList className="mb-6 bg-white border border-[#E2E8F0] p-1">
          <TabsTrigger value="candidatures" className="data-[state=active]:bg-[#1F4E79] data-[state=active]:text-white">
            Candidatures ({total})
          </TabsTrigger>
          <TabsTrigger value="shortlist" className="data-[state=active]:bg-[#1F4E79] data-[state=active]:text-white">
            Shortlist ({shortlists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidatures">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                placeholder="Rechercher un candidat..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={recFilter || 'all'} onValueChange={v => { setRecFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Recommandation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="A_RETENIR">À retenir</SelectItem>
                <SelectItem value="A_ETUDIER">À étudier</SelectItem>
                <SelectItem value="NON_RETENU">Non retenu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score ↓</SelectItem>
                <SelectItem value="date">Date ↓</SelectItem>
                <SelectItem value="nom">Nom A→Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {isLoading ? (
              <div className="p-6"><TableSkeleton rows={5} cols={7} /></div>
            ) : candidatures.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucune candidature"
                description="Aucune candidature ne correspond à vos critères."
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    {['#', 'Nom Prénom', 'Score', 'Recommandation', 'Expérience', 'Formation', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {candidatures.map((c: CandidatureRow, i: number) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{(page - 1) * 20 + i + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/candidats/${c.id}`} className="text-sm font-medium text-[#1E293B] hover:text-[#1F4E79]">
                          {c.prenom} {c.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><ScoreBadge score={c.score} /></td>
                      <td className="px-4 py-3"><RecommendationBadge recommendation={c.recommendation} /></td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {c.anneesExperience ? `${c.anneesExperience} ans` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B] max-w-[120px] truncate">
                        {c.niveauFormation || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatutColor(c.statut)}`}>
                          {statutLabels[c.statut] || c.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/candidats/${c.id}`} title="Voir la fiche">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1F4E79]">
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#64748B] hover:text-amber-500"
                            title="Shortlister"
                            onClick={() => setConfirmAction({ type: 'shortlist', candidatureId: c.id, nom: `${c.prenom} ${c.nom}` })}
                            disabled={c.statut === 'shortliste'}
                          >
                            <Star size={14} />
                          </Button>
                          {c.cvUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1F4E79]"
                              title="Voir le CV"
                              onClick={() => window.open(c.cvUrl, '_blank')}
                            >
                              <FileText size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#64748B] hover:text-red-500"
                            title="Rejeter"
                            onClick={() => setConfirmAction({ type: 'reject', candidatureId: c.id, nom: `${c.prenom} ${c.nom}` })}
                            disabled={c.statut === 'rejete'}
                          >
                            <XCircle size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-[#64748B]">Page {page} sur {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Précédent</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Suivant</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shortlist">
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {shortlists.length === 0 ? (
              <EmptyState
                icon={Star}
                title="Shortlist vide"
                description="Shortlistez des candidats depuis l'onglet Candidatures."
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    {['Rang', 'Nom Prénom', 'Score', 'Recommandation', 'Note HG', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {shortlists.map((s: ShortlistRow, i: number) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-sm font-bold text-[#1F4E79]">#{s.rang ?? i + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/candidats/${s.candidature.id}`} className="text-sm font-medium text-[#1E293B] hover:text-[#1F4E79]">
                          {s.candidature.prenom} {s.candidature.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><ScoreBadge score={s.candidature.score} /></td>
                      <td className="px-4 py-3"><RecommendationBadge recommendation={s.candidature.recommendation} /></td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{s.noteHg || '—'}</td>
                      <td className="px-4 py-3">
                        <Link href={`/candidats/${s.candidature.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1F4E79]">
                            <Eye size={14} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction?.type === 'shortlist'}
        onOpenChange={open => !open && setConfirmAction(null)}
        title="Shortlister ce candidat ?"
        description={`Voulez-vous ajouter ${confirmAction?.nom} à la shortlist de ce mandat ?`}
        confirmLabel="Shortlister"
        loading={shortlistMutation.isPending}
        onConfirm={() => confirmAction && shortlistMutation.mutate(confirmAction.candidatureId)}
      />
      <ConfirmDialog
        open={confirmAction?.type === 'reject'}
        onOpenChange={open => !open && setConfirmAction(null)}
        title="Rejeter ce candidat ?"
        description={`Êtes-vous sûr de vouloir rejeter ${confirmAction?.nom} ?`}
        confirmLabel="Rejeter"
        variant="destructive"
        loading={rejectMutation.isPending}
        onConfirm={() => confirmAction && rejectMutation.mutate(confirmAction.candidatureId)}
      />
    </>
  )
}
