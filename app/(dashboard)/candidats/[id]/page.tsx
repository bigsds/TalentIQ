import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getStatutColor, getRecommendationColor } from '@/lib/utils'
import ScoreGauge from '@/components/candidats/ScoreGauge'
import CandidatActions from '@/components/candidats/CandidatActions'
import NoteRecruteur from '@/components/candidats/NoteRecruteur'

const statutLabels: Record<string, string> = {
  recu: 'Reçu', en_etude: 'En étude', preselectionne: 'Présélectionné',
  shortliste: 'Shortlisté', rejete: 'Rejeté', embauche: 'Embauché',
}
const recLabels: Record<string, string> = {
  A_RETENIR: '✅ À retenir', A_ETUDIER: '📋 À étudier', NON_RETENU: '✗ Non retenu',
}

export default async function CandidatPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return notFound()

  const id = Number(params.id)
  if (isNaN(id)) return notFound()

  const c = await prisma.candidature.findUnique({
    where: { id },
    include: { mandat: { include: { client: true } } },
  })
  if (!c) return notFound()

  const pointsForts = (c.pointsForts as string[]) ?? []
  const pointsFaibles = (c.pointsFaibles as string[]) ?? []
  const competencesCles = (c.competencesCles as string[]) ?? []
  const certifications = (c.certifications as string[]) ?? []
  const langues = (c.langues as unknown[]) ?? []

  const serialized = {
    id: c.id,
    mandatId: c.mandatId,
    cvUrl: c.cvUrl,
    statut: c.statut,
    noteRecruteur: c.noteRecruteur,
    nom: `${c.prenom ?? ''} ${c.nom ?? ''}`.trim(),
    mandat: c.mandat ? { id: c.mandat.id, ref: c.mandat.ref, poste: c.mandat.poste } : null,
  }

  return (
    <div>
      {/* Back */}
      {c.mandat && (
        <Link href={`/mandats/${c.mandat.id}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1F4E79] mb-4 transition-colors">
          <ArrowLeft size={16} />
          Retour au mandat {c.mandat.ref}
        </Link>
      )}

      {/* Statut badge + titre */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B] font-jakarta">
          {c.prenom} {c.nom}
        </h1>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatutColor(c.statut)}`}>
          {statutLabels[c.statut]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — Profil (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identité */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-4">Identité</h3>
            <ul className="space-y-2.5 text-sm">
              {c.email && (
                <li className="flex items-center gap-2 text-[#1E293B]">
                  <span className="text-base">📧</span> {c.email}
                </li>
              )}
              {c.telephone && (
                <li className="flex items-center gap-2 text-[#1E293B]">
                  <span className="text-base">📞</span> {c.telephone}
                </li>
              )}
              {(c.nationalite || c.genre !== 'Inconnu') && (
                <li className="flex items-center gap-2 text-[#1E293B]">
                  <span className="text-base">🌍</span>
                  {[c.nationalite, c.genre === 'M' ? 'Homme' : c.genre === 'F' ? 'Femme' : null].filter(Boolean).join(' · ')}
                </li>
              )}
            </ul>
          </div>

          {/* Parcours */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-4">Parcours</h3>
            <ul className="space-y-2.5 text-sm">
              {c.dernierPoste && (
                <li className="flex items-start gap-2 text-[#1E293B]">
                  <span className="text-base mt-0.5">💼</span>
                  <span>{c.dernierPoste}</span>
                </li>
              )}
              {c.anneesExperience != null && (
                <li className="flex items-center gap-2 text-[#1E293B]">
                  <span className="text-base">⏱</span>
                  {c.anneesExperience} an{c.anneesExperience > 1 ? 's' : ''} d&apos;expérience
                </li>
              )}
              {(c.niveauFormation || c.domaineFormation) && (
                <li className="flex items-start gap-2 text-[#1E293B]">
                  <span className="text-base mt-0.5">🎓</span>
                  <span>{[c.niveauFormation, c.domaineFormation].filter(Boolean).join(' — ')}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Compétences */}
          {competencesCles.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {competencesCles.map((comp, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#D6E4F0] text-[#1F4E79] text-xs font-medium rounded-full">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Certifications</h3>
              <ul className="space-y-1.5">
                {certifications.map((cert, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#1E293B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F4E79] flex-shrink-0" />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Langues */}
          {langues.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Langues</h3>
              <div className="flex flex-wrap gap-2">
                {langues.map((lang, i) => (
                  <span key={i} className="px-2.5 py-1 border border-[#E2E8F0] text-[#1E293B] text-xs font-medium rounded-full">
                    {typeof lang === 'string' ? lang : (lang as { langue?: string; niveau?: string }).langue ?? JSON.stringify(lang)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Évaluation IA (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Score */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-5">Évaluation IA</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {c.score !== null ? (
                <ScoreGauge score={c.score} />
              ) : (
                <div className="w-36 h-36 rounded-full border-4 border-[#E2E8F0] flex items-center justify-center">
                  <span className="text-sm text-[#94A3B8]">—</span>
                </div>
              )}
              <div className="flex-1">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold mb-3 ${getRecommendationColor(c.recommendation)}`}>
                  {recLabels[c.recommendation]}
                </span>
                {c.scoreJustification && (
                  <p className="text-sm text-[#64748B] leading-relaxed italic">
                    &quot;{c.scoreJustification}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Points forts */}
          {pointsForts.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3">Points forts</h3>
              <ul className="space-y-2">
                {pointsForts.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="mt-0.5 flex-shrink-0">✅</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Points faibles */}
          {pointsFaibles.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-orange-800 uppercase tracking-wide mb-3">Points à considérer</h3>
              <ul className="space-y-2">
                {pointsFaibles.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-800">
                    <span className="mt-0.5 flex-shrink-0">⚠️</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Note recruteur */}
          <NoteRecruteur
            candidatureId={serialized.id}
            initialNote={serialized.noteRecruteur}
          />

          {/* Actions */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <CandidatActions
              candidatureId={serialized.id}
              mandatId={serialized.mandatId}
              cvUrl={serialized.cvUrl}
              statut={serialized.statut}
              nom={serialized.nom}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
