'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star, XCircle, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

interface CandidatActionsProps {
  candidatureId: number
  mandatId: number
  cvUrl: string | null
  statut: string
  nom: string
}

const statutLabels: Record<string, string> = {
  recu: 'Reçu',
  en_etude: 'En étude',
  preselectionne: 'Présélectionné',
  shortliste: 'Shortlisté',
  rejete: 'Rejeté',
  embauche: 'Embauché',
}

export default function CandidatActions({ candidatureId, mandatId, cvUrl, statut, nom }: CandidatActionsProps) {
  const qc = useQueryClient()
  const [confirmShortlist, setConfirmShortlist] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)

  const shortlistMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/shortlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandatId, candidatureId }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => {
      toast.success('Candidat ajouté à la shortlist')
      qc.invalidateQueries({ queryKey: ['candidature', candidatureId] })
      setConfirmShortlist(false)
    },
    onError: () => toast.error('Erreur lors du shortlisting'),
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/candidatures/${candidatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'rejete' }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => {
      toast.success('Candidat rejeté')
      qc.invalidateQueries({ queryKey: ['candidature', candidatureId] })
      setConfirmReject(false)
    },
    onError: () => toast.error('Erreur lors du rejet'),
  })

  const statutMutation = useMutation({
    mutationFn: async (newStatut: string) => {
      const res = await fetch(`/api/candidatures/${candidatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => {
      toast.success('Statut mis à jour')
      qc.invalidateQueries({ queryKey: ['candidature', candidatureId] })
    },
    onError: () => toast.error('Erreur'),
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E2E8F0]">
        {cvUrl && (
          <Button variant="outline" onClick={() => window.open(cvUrl, '_blank')} className="gap-2">
            <FileText size={16} /> Voir le CV
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setConfirmShortlist(true)}
          disabled={statut === 'shortliste'}
          className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Star size={16} /> Shortlister
        </Button>
        <Button
          variant="outline"
          onClick={() => setConfirmReject(true)}
          disabled={statut === 'rejete'}
          className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
        >
          <XCircle size={16} /> Rejeter
        </Button>

        {/* Changer statut */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 ml-auto">
              Statut <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(statutLabels).map(([val, label]) => (
              <DropdownMenuItem
                key={val}
                onClick={() => statutMutation.mutate(val)}
                disabled={statut === val}
                className={statut === val ? 'font-semibold text-[#1F4E79]' : ''}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmShortlist}
        onOpenChange={setConfirmShortlist}
        title="Shortlister ce candidat ?"
        description={`Voulez-vous ajouter ${nom} à la shortlist de ce mandat ?`}
        confirmLabel="Shortlister"
        loading={shortlistMutation.isPending}
        onConfirm={() => shortlistMutation.mutate()}
      />
      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        title="Rejeter ce candidat ?"
        description={`Êtes-vous sûr de vouloir rejeter ${nom} ?`}
        confirmLabel="Rejeter"
        variant="destructive"
        loading={rejectMutation.isPending}
        onConfirm={() => rejectMutation.mutate()}
      />
    </>
  )
}
