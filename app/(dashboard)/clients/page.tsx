'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EmptyState from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { SECTEURS } from '@/lib/utils'

interface ClientForm {
  id?: number
  nom: string
  secteur: string
  contactNom: string
  contactEmail: string
  telephone: string
}

const emptyForm: ClientForm = {
  nom: '', secteur: '', contactNom: '', contactEmail: '', telephone: '',
}

export default function ClientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/clients${params}`)
      return res.json()
    },
  })

  function openNew() {
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(client: ClientForm & { id: number }) {
    setForm({
      id: client.id,
      nom: client.nom ?? '',
      secteur: client.secteur ?? '',
      contactNom: client.contactNom ?? '',
      contactEmail: client.contactEmail ?? '',
      telephone: client.telephone ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error('Le nom du client est obligatoire')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nom: form.nom,
        secteur: form.secteur || undefined,
        contactNom: form.contactNom || undefined,
        contactEmail: form.contactEmail || undefined,
        telephone: form.telephone || undefined,
      }
      const url = form.id ? `/api/clients/${form.id}` : '/api/clients'
      const method = form.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(form.id ? 'Client mis à jour' : 'Client créé')
      qc.invalidateQueries({ queryKey: ['clients'] })
      setModalOpen(false)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta">Clients</h2>
          <p className="text-sm text-[#64748B] mt-1">{(clients ?? []).length} client{(clients ?? []).length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew} className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white">
          <Plus size={16} className="mr-2" /> Ajouter un client
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={4} cols={5} /></div>
        ) : (clients ?? []).length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun client"
            description="Ajoutez votre premier client pour commencer."
            action={
              <Button onClick={openNew} className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white">
                <Plus size={16} className="mr-2" /> Ajouter un client
              </Button>
            }
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                {['Nom', 'Secteur', 'Contact', 'Email', 'Mandats', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {(clients ?? []).map((c: ClientForm & { id: number; _count?: { mandats: number } }) => (
                <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{c.nom}</td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{c.secteur || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{c.contactNom || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{c.contactEmail || '—'}</td>
                  <td className="px-4 py-3 text-sm text-center text-[#64748B]">{c._count?.mandats ?? 0}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                      className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1F4E79]"
                    >
                      <Pencil size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-jakarta">
              {form.id ? 'Modifier le client' : 'Ajouter un client'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom du client <span className="text-red-500">*</span></Label>
              <Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Banque Atlantique" />
            </div>
            <div className="space-y-2">
              <Label>Secteur</Label>
              <Select value={form.secteur} onValueChange={v => set('secteur', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom du contact</Label>
              <Input value={form.contactNom} onChange={e => set('contactNom', e.target.value)} placeholder="Ex: Jean Dupont" />
            </div>
            <div className="space-y-2">
              <Label>Email du contact</Label>
              <Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="contact@client.com" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+225 XX XX XX XX" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white">
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
