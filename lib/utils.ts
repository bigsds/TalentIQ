import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

export function getScoreColor(score: number) {
  if (score >= 75) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
  if (score >= 40) return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' }
  return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
}

export function getRecommendationColor(rec: string) {
  switch (rec) {
    case 'A_RETENIR': return 'bg-green-100 text-green-800'
    case 'A_ETUDIER': return 'bg-orange-100 text-orange-800'
    case 'NON_RETENU': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getStatutColor(statut: string) {
  switch (statut) {
    case 'recu': return 'bg-blue-100 text-blue-800'
    case 'en_etude': return 'bg-yellow-100 text-yellow-800'
    case 'preselectionne': return 'bg-purple-100 text-purple-800'
    case 'shortliste': return 'bg-green-100 text-green-800'
    case 'rejete': return 'bg-red-100 text-red-800'
    case 'embauche': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const SECTEURS = [
  'Banque & Finance',
  'Assurance',
  'Télécommunications',
  'Energie & Mines',
  'Agro-industrie',
  'Commerce & Distribution',
  'Industrie & BTP',
  'Santé & Pharmacie',
  'Transport & Logistique',
  'Technologies & IT',
  'Médias & Communication',
  'Services aux entreprises',
  'ONG & Développement',
  'Éducation & Formation',
  'Immobilier',
  'Tourisme & Hôtellerie',
  'Pétrole & Gaz',
  'Agriculture',
  'Secteur public',
  'Autre',
]
