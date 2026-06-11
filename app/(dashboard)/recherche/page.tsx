'use client'

import { useState } from 'react'
import { Search, Loader2, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import ScoreBadge from '@/components/candidats/ScoreBadge'
import { SECTEURS } from '@/lib/utils'

interface SearchResult {
  id: number
  nom: string
  prenom: string
  dernierPoste: string | null
  anneesExperience: number | null
  niveauFormation: string | null
  nationalite: string | null
  competencesCles: string[]
  score: number | null
  similarite: number
}

export default function RecherchePage() {
  const [query, setQuery] = useState('')
  const [secteur, setSecteur] = useState('')
  const [expMin, setExpMin] = useState('')
  const [scoreMin, setScoreMin] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch('/api/recherche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          secteur: secteur && secteur !== 'all' ? secteur : undefined,
          expMin: expMin ? Number(expMin) : undefined,
          scoreMin: scoreMin ? Number(scoreMin) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E293B] font-jakarta flex items-center gap-2">
          <Brain className="text-[#1F4E79]" size={26} />
          Recherche intelligente de CVs
        </h2>
        <p className="text-sm text-[#64748B] mt-1">
          Interrogez toute votre base de CVs en langage naturel
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Décrivez le profil recherché</Label>
            <Textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Ex: "Analyste crédit avec 5 ans en banque et anglais courant"`}
              rows={3}
              className="resize-none"
              required
            />
          </div>

          {/* Filtres complémentaires */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Expérience min (années)</Label>
              <Input
                type="number"
                min="0"
                value={expMin}
                onChange={e => setExpMin(e.target.value)}
                placeholder="Ex: 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Secteur</Label>
              <Select value={secteur} onValueChange={setSecteur}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les secteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les secteurs</SelectItem>
                  {SECTEURS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Score minimum</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={scoreMin}
                onChange={e => setScoreMin(e.target.value)}
                placeholder="Ex: 60"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#1F4E79] hover:bg-[#2E75B6] text-white gap-2"
              disabled={loading || !query.trim()}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>
        </div>
      </form>

      {/* Results */}
      {!searched && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-[#D6E4F0] flex items-center justify-center mx-auto mb-4">
            <Brain size={40} className="text-[#1F4E79]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E293B] font-jakarta mb-2">
            Recherche vectorielle IA
          </h3>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            Décrivez le profil que vous recherchez en langage naturel.
            L&apos;IA analysera l&apos;ensemble de vos CVs et vous retournera les meilleurs correspondances.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium">
            ⚡ Fonctionnalité en cours d&apos;activation — Requiert la configuration N8n
          </div>
        </div>
      )}

      {searched && loading && (
        <div className="text-center py-12 text-[#64748B]">
          <Loader2 size={32} className="animate-spin mx-auto mb-3 text-[#1F4E79]" />
          <p className="text-sm">Analyse en cours...</p>
        </div>
      )}

      {searched && !loading && results !== null && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#64748B] text-sm">
            Aucun résultat trouvé. Essayez une requête différente.
          </p>
          <p className="text-xs text-[#94A3B8] mt-2">
            Si la recherche IA n&apos;est pas encore configurée, contactez votre administrateur.
          </p>
        </div>
      )}

      {searched && !loading && results !== null && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[#64748B]">{results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}</p>
          {results.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-[#1E293B] font-jakarta">
                      {r.prenom} {r.nom}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-[#D6E4F0] text-[#1F4E79] rounded-full font-semibold">
                      Similarité {Math.round(r.similarite * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B] mb-2">
                    {r.dernierPoste && <span>{r.dernierPoste}</span>}
                    {r.anneesExperience && <span> · {r.anneesExperience} ans</span>}
                    {r.niveauFormation && <span> · {r.niveauFormation}</span>}
                    {r.nationalite && <span> · {r.nationalite}</span>}
                  </p>
                  {r.competencesCles?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.competencesCles.slice(0, 5).map((comp, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs rounded-full">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3 ml-4">
                  <ScoreBadge score={r.score} />
                  <Link href={`/candidats/${r.id}`}>
                    <Button variant="outline" size="sm" className="text-[#1F4E79] border-[#1F4E79]">
                      Voir la fiche
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
