'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SECTEURS } from '@/lib/utils'

interface MandatFormProps {
  initialData?: {
    id: number
    clientId: number
    poste: string
    lieu?: string
    secteur?: string
    nbPostes: number
    datefinCollecte?: string
    mission?: string
    descriptionOffre?: string
    profilRequis?: string
  }
}

export default function MandatForm({ initialData }: MandatFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [form, setForm] = useState({
    clientId: initialData?.clientId ? String(initialData.clientId) : '',
    poste: initialData?.poste ?? '',
    lieu: initialData?.lieu ?? '',
    secteur: initialData?.secteur ?? '',
    nbPostes: String(initialData?.nbPostes ?? 1),
    datefinCollecte: initialData?.datefinCollecte
      ? new Date(initialData.datefinCollecte).toISOString().slice(0, 10)
      : '',
    mission: initialData?.mission ?? '',
    descriptionOffre: initialData?.descriptionOffre ?? '',
    profilRequis: initialData?.profilRequis ?? '',
  })
  const [loading, setLoading] = useState(false)

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      return res.json()
    },
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId || !form.poste || !form.profilRequis || !form.datefinCollecte) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setLoading(true)
    try {
      const payload = {
        clientId: Number(form.clientId),
        poste: form.poste,
        lieu: form.lieu || undefined,
        secteur: form.secteur || undefined,
        nbPostes: Number(form.nbPostes),
        datefinCollecte: form.datefinCollecte,
        mission: form.mission || undefined,
        descriptionOffre: form.descriptionOffre || undefined,
        profilRequis: form.profilRequis,
      }

      const url = isEdit ? `/api/mandats/${initialData.id}` : '/api/mandats'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erreur')
      }

      const data = await res.json()
      toast.success(isEdit ? 'Mandat mis à jour' : 'Mandat créé avec succès')
      router.push(`/mandats/${data.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Informations générales</h3>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
              <Select value={form.clientId} onValueChange={v => set('clientId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client..." />
                </SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c: { id: number; nom: string }) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Poste */}
            <div className="space-y-2">
              <Label htmlFor="poste">Intitulé du poste <span className="text-red-500">*</span></Label>
              <Input
                id="poste"
                value={form.poste}
                onChange={e => set('poste', e.target.value)}
                placeholder="Ex: Analyste Crédit Senior"
                required
              />
            </div>

            {/* Lieu */}
            <div className="space-y-2">
              <Label htmlFor="lieu">Lieu de travail</Label>
              <Input
                id="lieu"
                value={form.lieu}
                onChange={e => set('lieu', e.target.value)}
                placeholder="Ex: Abidjan, Côte d'Ivoire"
              />
            </div>

            {/* Secteur */}
            <div className="space-y-2">
              <Label htmlFor="secteur">Secteur d&apos;activité</Label>
              <Select value={form.secteur} onValueChange={v => set('secteur', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur..." />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre postes + Date clôture */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nbPostes">Nombre de postes</Label>
                <Input
                  id="nbPostes"
                  type="number"
                  min="1"
                  value={form.nbPostes}
                  onChange={e => set('nbPostes', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="datefinCollecte">Date de clôture <span className="text-red-500">*</span></Label>
                <Input
                  id="datefinCollecte"
                  type="date"
                  min={minDate}
                  value={form.datefinCollecte}
                  onChange={e => set('datefinCollecte', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Description du poste</h3>

          <div className="space-y-2">
            <Label htmlFor="mission">Mission principale</Label>
            <Textarea
              id="mission"
              value={form.mission}
              onChange={e => set('mission', e.target.value)}
              placeholder="Décrivez la mission principale du poste..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionOffre">Description complète du poste</Label>
            <Textarea
              id="descriptionOffre"
              value={form.descriptionOffre}
              onChange={e => set('descriptionOffre', e.target.value)}
              placeholder="Description détaillée des responsabilités, l'environnement de travail..."
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilRequis">Profil recherché <span className="text-red-500">*</span></Label>
            <Textarea
              id="profilRequis"
              value={form.profilRequis}
              onChange={e => set('profilRequis', e.target.value)}
              placeholder="Formation requise, expérience, compétences clés..."
              rows={6}
              className="resize-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white"
          disabled={loading}
        >
          {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
          {isEdit ? 'Enregistrer les modifications' : 'Créer le mandat →'}
        </Button>
      </div>
    </form>
  )
}
