'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MandatFiltersProps {
  search: string
  statut: string
  onSearchChange: (v: string) => void
  onStatutChange: (v: string) => void
  onReset: () => void
}

export default function MandatFilters({
  search, statut, onSearchChange, onStatutChange, onReset,
}: MandatFiltersProps) {
  const hasFilters = search || statut

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          placeholder="Rechercher un poste..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statut || 'all'} onValueChange={v => onStatutChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="actif">Actif</SelectItem>
          <SelectItem value="cloture">Clôturé</SelectItem>
          <SelectItem value="archive">Archivé</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-[#64748B]">
          <X size={14} className="mr-1" /> Réinitialiser
        </Button>
      )}
    </div>
  )
}
