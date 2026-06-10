export type UserRole = 'admin' | 'recruteur'
export type StatutMandat = 'actif' | 'cloture' | 'archive'
export type Genre = 'M' | 'F' | 'Inconnu'
export type Recommendation = 'A_RETENIR' | 'A_ETUDIER' | 'NON_RETENU'
export type StatutCandidature = 'recu' | 'en_etude' | 'preselectionne' | 'shortliste' | 'rejete' | 'embauche'

export interface ClientType {
  id: number
  nom: string
  secteur: string | null
  contactNom: string | null
  contactEmail: string | null
  telephone: string | null
  actif: boolean
  createdAt: Date
  _count?: { mandats: number }
}

export interface MandatType {
  id: number
  ref: string
  clientId: number
  poste: string
  lieu: string | null
  secteur: string | null
  mission: string | null
  descriptionOffre: string | null
  profilRequis: string | null
  datefinCollecte: Date | null
  statut: StatutMandat
  driveFolderId: string | null
  nbPostes: number
  createdAt: Date
  updatedAt: Date
  client?: ClientType
  _count?: { candidatures: number }
  scoreMoyen?: number | null
}

export interface CandidatureType {
  id: number
  mandatId: number
  nom: string | null
  prenom: string | null
  email: string | null
  telephone: string | null
  nationalite: string | null
  genre: Genre
  anneesExperience: number | null
  niveauFormation: string | null
  domaineFormation: string | null
  dernierPoste: string | null
  secteursExp: string[]
  certifications: string[]
  langues: string[]
  competencesCles: string[]
  pointsForts: string[]
  pointsFaibles: string[]
  score: number | null
  scoreJustification: string | null
  recommendation: Recommendation
  cvUrl: string | null
  statut: StatutCandidature
  noteRecruteur: string | null
  createdAt: Date
  updatedAt: Date
  mandat?: MandatType
}

export interface ShortlistType {
  id: number
  mandatId: number
  candidatureId: number
  rang: number | null
  noteHg: string | null
  createdAt: Date
  candidature?: CandidatureType
}

export interface MandatStats {
  totalCandidatures: number
  scoreMoyen: number | null
  scoreMax: number | null
  scoreMin: number | null
  nbARetenir: number
  nbAEtudier: number
  nbNonRetenus: number
  nbShortlistes: number
  repartitionGenre: { M: number; F: number; Inconnu: number }
  topNationalites: { nationalite: string; count: number }[]
  distributionScores: { tranche: string; count: number }[]
  evolutionTemps: { date: string; count: number }[]
}
