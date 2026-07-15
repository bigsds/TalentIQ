# SoftTalent

Plateforme SaaS de gestion de recrutement pour cabinets de chasse, avec **ingestion automatique de CVs par email**, **scoring IA** et **recherche vectorielle** sur toute la CVthèque.

Premier client : HG Recrutement / Forth Investment (Ouagadougou).

## Fonctionnalités

- **Mandats** : création avec référence auto (`REF-YYYY-NNN`) et dossier Google Drive dédié
- **Ingestion automatique** : les candidats envoient leur CV par email avec la REF dans le sujet → extraction des données (gpt-4o-mini), scoring 0-100 avec justification, recommandation (À retenir / À étudier / Non retenu), accusé de réception automatique
- **Import en masse** : vectorisation de la CVthèque existante depuis Google Drive
- **Recherche vectorielle** : requête en langage naturel → embeddings OpenAI + pgvector cosine similarity sur toute la base
- **Shortlists & rapports** : constitution de shortlists par mandat, export PDF
- **Dashboard** : suivi des mandats actifs, candidatures, statistiques

## Architecture

```
Candidats ──email──► N8n (workflows) ──► PostgreSQL 16 + pgvector ◄── SoftTalent (Next.js 14)
                        │                                                   │
                   OpenAI API                                          Recruteurs (web)
                   Google Drive
```

| Composant | Techno |
|---|---|
| Frontend + API | Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, React Query |
| Base de données | PostgreSQL 16 + pgvector, Prisma ORM |
| Auth | NextAuth v5 (credentials, bcrypt) |
| Automatisation | N8n (3 workflows, dossier [`n8n/`](n8n/)) |
| IA | OpenAI `gpt-4o-mini` (extraction + scoring), `text-embedding-3-small` (embeddings 1536d) |
| Déploiement | Docker Compose + Traefik (TLS) |

## Structure du dépôt

```
app/                    Pages (App Router) + routes API
  (auth)/login          Authentification
  (dashboard)/          Dashboard, mandats, candidats, clients, rapports, recherche
  api/                  REST : mandats, candidatures, clients, recherche, shortlists…
components/             UI (shadcn) + composants métier
lib/                    Prisma client, auth, helpers N8n, utils
prisma/                 Schéma, migrations (incl. pgvector), seed
n8n/                    Workflows N8n (voir n8n/README.md)
docker/postgres/        init.sql (extension vector + schéma n8n)
docker-compose.yml      Déploiement production (Postgres + app)
DEPLOYMENT_PLAYBOOK.md  Guide de déploiement chez un nouveau client
```

## Démarrage local

```bash
# 1. Base de données (pgvector requis)
docker run -d --name softtalent-dev-db -p 5432:5432 \
  -e POSTGRES_DB=hg_recrutement -e POSTGRES_USER=hg_user -e POSTGRES_PASSWORD=dev \
  -v $(pwd)/docker/postgres/init.sql:/docker-entrypoint-initdb.d/01_init.sql:ro \
  pgvector/pgvector:pg16

# 2. Environnement
cp .env.example .env
# → DATABASE_URL=postgresql://hg_user:dev@localhost:5432/hg_recrutement
# → NEXTAUTH_SECRET, OPENAI_API_KEY, ADMIN_SEED_PASSWORD…

# 3. Installer + migrer + seed
npm ci
npm run db:setup

# 4. Lancer
npm run dev            # http://localhost:3000
```

Scripts utiles : `npm run build` (build prod), `npm run lint`, `npm run db:studio` (Prisma Studio).

Sans N8n en local, l'app fonctionne : les appels webhook sont ignorés proprement (`lib/n8n.ts`) et la recherche bascule en mode basique si `OPENAI_API_KEY` est absente.

## Déploiement production

Voir **[DEPLOYMENT_PLAYBOOK.md](DEPLOYMENT_PLAYBOOK.md)** — guide complet pas-à-pas : prérequis, `.env`, Docker, credentials N8n, import des workflows, tests bout-en-bout, reprise de la CVthèque existante, dépannage.

## Workflows N8n

Voir **[n8n/README.md](n8n/README.md)** pour le détail de chaque workflow, les credentials requis et les adaptations par client.

| Workflow | Déclencheur | Rôle |
|---|---|---|
| W01 — Création Mandat | Webhook | REF séquentielle + dossier Drive + insert DB |
| W02 — Ingestion CV | IMAP (boîte candidatures) | Extraction → scoring → Drive → DB → embedding → accusé de réception |
| W03 — Import CVs Batch | Webhook | Même pipeline pour des CVs déjà dans Google Drive (lots ≤ 50) |
