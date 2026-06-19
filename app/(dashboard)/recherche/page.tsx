'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, Brain, Database, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import ScoreBadge from '@/components/candidats/ScoreBadge'
import { SECTEURS } from '@/lib/utils'

interface Stats {
  totalIndexed: number
  totalCandidatures: number
  hasApiKey: boolean
}

interface SearchResult {
  id: number
  nom: string | null
  prenom: string | null
  dernierPoste: string | null
  anneesExperience: number | null
  niveauFormation: string | null
  nationalite: string | null
  competencesCles: string[]
  secteursExp: string[]
  score: number | null
  recommendation: string
  cvUrl: string | null
  mandatRef: string
  mandatPoste: string
  similarite: number
}

const RECO_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  A_RETENIR:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'À retenir' },
  A_ETUDIER:  { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'À étudier' },
  NON_RETENU: { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Non retenu' },
}

export default function RecherchePage() {
  const [query, setQuery]       = useState('')
  const [secteur, setSecteur]   = useState('')
  const [expMin, setExpMin]     = useState('')
  const [scoreMin, setScoreMin] = useState('')
  const [results, setResults]   = useState<SearchResult[] | null>(null)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [stats, setStats]       = useState<Stats | null>(null)
  const [vectorSearch, setVectorSearch] = useState(false)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    fetch('/api/recherche')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setVectorSearch(false)
    setFallback(false)

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
      setVectorSearch(!!data.vectorSearch)
      setFallback(!!data.fallback)
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

      {/* Stats banner */}
      {stats && (
        <div className={`mb-5 rounded-xl border p-4 flex items-center gap-3 text-sm ${
          !stats.hasApiKey
            ? 'bg-orange-50 border-orange-200 text-orange-800'
            : stats.totalIndexed === 0
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
        }`}>
          {!stats.hasApiKey ? (
            <>
              <AlertTriangle size={18} className="shrink-0" />
              <span>
                <strong>OPENAI_API_KEY non configurée</strong> — la recherche vectorielle est désactivée.
                Ajoutez la clé dans votre <code className="bg-orange-100 px-1 rounded">.env</code> pour activer l&apos;IA.
              </span>
            </>
          ) : stats.totalIndexed === 0 ? (
            <>
              <Database size={18} className="shrink-0" />
              <span>
                <strong>Aucun CV indexé</strong> — importez des CVs via N8n pour activer la recherche vectorielle.
                {stats.totalCandidatures > 0 && ` (${stats.totalCandidatures} candidature(s) en base, sans embedding)`}
              </span>
            </>
          ) : (
            <>
              <Database size={18} className="shrink-0" />
              <span>
                <strong>{stats.totalIndexed}</strong> CV{stats.totalIndexed > 1 ? 's' : ''} indexé{stats.totalIndexed > 1 ? 's' : ''}
                {stats.totalCandidatures > stats.totalIndexed && (
                  <> · <span className="opacity-75">{stats.totalCandidatures - stats.totalIndexed} sans embedding</span></>
                )}
              </span>
            </>
          )}
        </div>
      )}

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Décrivez le profil recherché</Label>
            <Textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Ex : "Analyste crédit avec 5 ans en banque et anglais courant"`}
              rows={3}
              className="resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Expérience min (années)</Label>
              <Input
                type="number"
                min="0"
                value={expMin}
                onChange={e => setExpMin(e.target.value)}
                placeholder="Ex : 3"
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
                placeholder="Ex : 60"
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

      {/* Empty state — before first search */}
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
            L&apos;IA analysera l&apos;ensemble de vos CVs et retournera les meilleures correspondances.
          </p>
        </div>
      )}

      {/* Loading */}
      {searched && loading && (
        <div className="text-center py-12 text-[#64748B]">
          <Loader2 size={32} className="animate-spin mx-auto mb-3 text-[#1F4E79]" />
          <p className="text-sm">Analyse sémantique en cours…</p>
        </div>
      )}

      {/* No results */}
      {searched && !loading && results !== null && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#64748B] text-sm">Aucun résultat trouvé pour cette requête.</p>
          <p className="text-xs text-[#94A3B8] mt-2">
            Essayez d&apos;élargir les filtres ou de reformuler votre description.
          </p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && results !== null && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#64748B]">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </p>
            {vectorSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-xs font-medium">
                <Brain size={11} />
                Recherche vectorielle
              </span>
            )}
            {fallback && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Mode basique (sans IA)
              </span>
            )}
          </div>

          {results.map((r) => {
            const reco = RECO_STYLES[r.recommendation] ?? RECO_STYLES.A_ETUDIER
            return (
              <div key={r.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-[#1E293B] font-jakarta">
                        {r.prenom} {r.nom}
                      </h3>
                      {vectorSearch && r.similarite > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-[#D6E4F0] text-[#1F4E79] rounded-full font-semibold">
                          {Math.round(r.similarite * 100)}% similaire
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reco.bg} ${reco.text}`}>
                        {reco.label}
                      </span>
                    </div>

                    {/* Mandat */}
                    <p className="text-xs text-[#1F4E79] font-medium mb-1">
                      {r.mandatRef} — {r.mandatPoste}
                    </p>

                    {/* Profile summary */}
                    <p className="text-sm text-[#64748B] mb-2">
                      {[
                        r.dernierPoste,
                        r.anneesExperience != null ? `${r.anneesExperience} ans exp.` : null,
                        r.niveauFormation,
                        r.nationalite,
                      ].filter(Boolean).join(' · ')}
                    </p>

                    {/* Secteurs */}
                    {r.secteursExp?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.secteursExp.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#F0F7FF] border border-[#BFDBFE] text-[#1E40AF] text-xs rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {r.competencesCles?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.competencesCles.slice(0, 5).map((comp, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs rounded-full">
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <ScoreBadge score={r.score} />
                    <Link href={`/candidats/${r.id}`}>
                      <Button variant="outline" size="sm" className="text-[#1F4E79] border-[#1F4E79]">
                        Voir la fiche
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
