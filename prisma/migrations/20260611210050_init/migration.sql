-- Enable pgvector extension (requires pgvector to be installed on PostgreSQL)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'recruteur');

-- CreateEnum
CREATE TYPE "StatutMandat" AS ENUM ('actif', 'cloture', 'archive');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('M', 'F', 'Inconnu');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('A_RETENIR', 'A_ETUDIER', 'NON_RETENU');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('recu', 'en_etude', 'preselectionne', 'shortliste', 'rejete', 'embauche');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'recruteur',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "secteur" TEXT,
    "contact_nom" TEXT,
    "contact_email" TEXT,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandats" (
    "id" SERIAL NOT NULL,
    "ref" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "poste" TEXT NOT NULL,
    "lieu" TEXT,
    "secteur" TEXT,
    "mission" TEXT,
    "description_offre" TEXT,
    "profil_requis" TEXT,
    "date_fin_collecte" DATE,
    "statut" "StatutMandat" NOT NULL DEFAULT 'actif',
    "drive_folder_id" TEXT,
    "nb_postes" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatures" (
    "id" SERIAL NOT NULL,
    "mandat_id" INTEGER NOT NULL,
    "nom" TEXT,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "nationalite" TEXT,
    "genre" "Genre" NOT NULL DEFAULT 'Inconnu',
    "annees_experience" DOUBLE PRECISION,
    "niveau_formation" TEXT,
    "domaine_formation" TEXT,
    "dernier_poste" TEXT,
    "secteurs_exp" JSONB NOT NULL DEFAULT '[]',
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "langues" JSONB NOT NULL DEFAULT '[]',
    "competences_cles" JSONB NOT NULL DEFAULT '[]',
    "points_forts" JSONB NOT NULL DEFAULT '[]',
    "points_faibles" JSONB NOT NULL DEFAULT '[]',
    "score" DOUBLE PRECISION,
    "score_justification" TEXT,
    "recommendation" "Recommendation" NOT NULL DEFAULT 'A_ETUDIER',
    "cv_url" TEXT,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'recu',
    "note_recruteur" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidature_embeddings" (
    "id" SERIAL NOT NULL,
    "candidature_id" INTEGER NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidature_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" SERIAL NOT NULL,
    "mandat_id" INTEGER NOT NULL,
    "candidature_id" INTEGER NOT NULL,
    "rang" INTEGER,
    "note_hg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mandats_ref_key" ON "mandats"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "candidature_embeddings_candidature_id_key" ON "candidature_embeddings"("candidature_id");

-- Vector embedding column (1536 dimensions for text-embedding-3-small)
ALTER TABLE candidature_embeddings ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Index for fast similarity search (IVFFlat cosine)
CREATE INDEX IF NOT EXISTS idx_candidature_embeddings_vector
  ON candidature_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- CreateIndex
CREATE UNIQUE INDEX "shortlists_mandat_id_candidature_id_key" ON "shortlists"("mandat_id", "candidature_id");

-- AddForeignKey
ALTER TABLE "mandats" ADD CONSTRAINT "mandats_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_mandat_id_fkey" FOREIGN KEY ("mandat_id") REFERENCES "mandats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidature_embeddings" ADD CONSTRAINT "candidature_embeddings_candidature_id_fkey" FOREIGN KEY ("candidature_id") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_mandat_id_fkey" FOREIGN KEY ("mandat_id") REFERENCES "mandats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_candidature_id_fkey" FOREIGN KEY ("candidature_id") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
