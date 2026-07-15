# 📘 SoftTalent — Playbook de déploiement client

Guide pas-à-pas pour déployer SoftTalent chez un **nouveau cabinet de recrutement**.
Durée estimée : **2 à 3 heures** pour un déploiement complet (hors propagation DNS).

---

## Vue d'ensemble de l'architecture

```
                        ┌──────────────────────── VPS client ────────────────────────┐
                        │                                                            │
  Candidats ──email──►  │  N8n (existant)          SoftTalent (Next.js)              │
  Recruteurs ──web──►   │   ├─ W01 Création mandat  ├─ Dashboard, mandats, candidats │
                        │   ├─ W02 Ingestion CV     ├─ Recherche vectorielle         │
                        │   └─ W03 Import en masse  └─ Rapports PDF                  │
                        │            │                        │                      │
                        │            └───► PostgreSQL 16 + pgvector ◄────┘           │
                        │                       (softtalent_postgres)                │
                        │                                                            │
                        │  Traefik (existant) ── TLS/routing ── app.<domaine-client> │
                        └────────────────────────────────────────────────────────────┘
   Services externes : OpenAI (extraction + scoring + embeddings), Google Drive (stockage CVs)
```

**Composants déployés par ce playbook** : PostgreSQL+pgvector et SoftTalent (via `docker-compose.yml`).
**Composants supposés déjà en place sur le VPS** : Traefik (reverse proxy TLS) et N8n.

---

## Phase 0 — Prérequis (à collecter AVANT le déploiement)

### Infrastructure
- [ ] VPS Linux (Ubuntu 22.04+ recommandé), 4 Go RAM minimum, Docker + Docker Compose installés
- [ ] Traefik déjà déployé avec un certresolver TLS fonctionnel (notez son nom : souvent `mytlschallenge` ou `letsencrypt`)
- [ ] N8n déjà déployé et accessible (notez le nom du conteneur, souvent `n8n`)
- [ ] Accès SSH root ou sudo au VPS

### Informations client à collecter
| Information | Exemple | Utilisé pour |
|---|---|---|
| Domaine de l'application | `app.cabinet-x.com` | `APP_DOMAIN`, `NEXTAUTH_URL` |
| Nom du cabinet | `Cabinet X Recrutement` | `NEXT_PUBLIC_CABINET_NOM` |
| Couleur principale (hex) | `#1F4E79` | `NEXT_PUBLIC_PRIMARY_COLOR` |
| **Boîte mail de réception des candidatures** | `recrutement@cabinet-x.com` | Trigger IMAP du W02 |
| Accès IMAP + SMTP de cette boîte | serveur, port, login, mot de passe d'application | Credentials N8n |
| Compte Google (Drive) du cabinet | `drive@cabinet-x.com` | Stockage des CVs |
| Email de l'admin de l'app | `directeur@cabinet-x.com` | Compte admin initial |

### Comptes API
- [ ] **Clé API OpenAI** (platform.openai.com) — avec accès à `gpt-4o-mini` et `text-embedding-3-small`. Prévoir ~1-3 $ / 1000 CVs traités.
- [ ] **Projet Google Cloud** avec l'API Drive activée + credentials OAuth2 (pour le nœud Google Drive de N8n)

> ⚠️ **Boîte mail** : la boîte surveillée doit être **dédiée aux candidatures** (ou utiliser un alias dédié). Le W02 traite *tous* les emails entrants de cette boîte ; les emails sans référence `[REF-...]` dans le sujet reçoivent une réponse automatique "référence introuvable".

---

## Phase 1 — Déploiement de l'application (30 min)

### 1.1 Cloner le dépôt sur le VPS

```bash
cd /opt
git clone <URL_DU_REPO> softtalent-<client>
cd softtalent-<client>
```

### 1.2 Configurer l'environnement

```bash
cp .env.example .env
nano .env
```

Remplir **toutes** les valeurs :

```bash
# Base de données — générer un mot de passe fort
POSTGRES_PASSWORD=$(openssl rand -base64 24)   # à coller dans .env
DATABASE_URL=postgresql://hg_user:<MEME_PASSWORD>@postgres:5432/hg_recrutement

# Auth
NEXTAUTH_SECRET=$(openssl rand -base64 32)     # à coller dans .env
NEXTAUTH_URL=https://app.cabinet-x.com

# OpenAI (recherche vectorielle côté app)
OPENAI_API_KEY=sk-...

# Application
APP_DOMAIN=app.cabinet-x.com
NEXT_PUBLIC_APP_NAME=SoftTalent
NEXT_PUBLIC_CABINET_NOM=Cabinet X Recrutement
NEXT_PUBLIC_PRIMARY_COLOR=#1F4E79

# Admin initial
ADMIN_EMAIL=directeur@cabinet-x.com
ADMIN_SEED_PASSWORD=<mot de passe provisoire fort>
ADMIN_NOM=Prénom Nom
```

### 1.3 Vérifier le réseau Traefik

```bash
docker inspect root-traefik-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

Reporter le nom trouvé dans `.env` (`TRAEFIK_NETWORK=...`). Vérifier aussi que le
`certresolver` dans `docker-compose.yml` (label `tls.certresolver=mytlschallenge`)
correspond à celui du Traefik du client.

### 1.4 Configurer le DNS

Créer un enregistrement **A** : `app.cabinet-x.com` → IP du VPS. Attendre la propagation (vérifier avec `dig app.cabinet-x.com`).

### 1.5 Lancer

```bash
docker compose up -d --build
docker compose logs -f softtalent   # attendre "Ready"
```

### 1.6 Migrations + seed (premier démarrage uniquement)

```bash
docker compose exec softtalent node node_modules/prisma/build/index.js migrate deploy
docker compose exec softtalent node prisma/seed.js
```

### 1.7 Connecter N8n à la base SoftTalent

```bash
docker network connect softtalent_internal n8n
```

(remplacer `n8n` par le vrai nom du conteneur N8n si différent)

### ✅ Checkpoint Phase 1
- [ ] `https://app.cabinet-x.com` affiche la page de login (certificat TLS valide)
- [ ] Connexion possible avec `ADMIN_EMAIL` / `ADMIN_SEED_PASSWORD`
- [ ] Le mot de passe admin provisoire a été **changé** après la première connexion
- [ ] `docker compose exec postgres psql -U hg_user -d hg_recrutement -c "SELECT extname FROM pg_extension"` liste `vector`

---

## Phase 2 — Credentials N8n (30 min)

Dans l'interface N8n (`https://n8n.<domaine>`), créer **5 credentials** :

### 2.1 Postgres (`Postgres account`)
| Champ | Valeur |
|---|---|
| Host | `softtalent_postgres` (nom du conteneur, via le réseau `softtalent_internal`) |
| Database | `hg_recrutement` |
| User | `hg_user` |
| Password | `POSTGRES_PASSWORD` du `.env` |
| Port | `5432` |
| SSL | Disable |

**Test** : le bouton "Test connection" doit être vert. S'il échoue : vérifier que le conteneur N8n est bien connecté au réseau (`docker network inspect softtalent_internal`).

### 2.2 IMAP (`IMAP account`) — boîte candidatures
| Champ | Valeur |
|---|---|
| User | `recrutement@cabinet-x.com` |
| Password | mot de passe (ou **mot de passe d'application** pour Gmail/Outlook) |
| Host | ex. `imap.gmail.com` / `outlook.office365.com` |
| Port | `993`, SSL/TLS activé |

> 💡 Gmail : activer la validation en 2 étapes puis créer un « mot de passe d'application ». Outlook 365 : vérifier que IMAP est activé dans le centre d'administration.

### 2.3 SMTP (`SMTP account`) — envoi des accusés de réception
Même boîte que l'IMAP, en envoi : ex. `smtp.gmail.com:465` (SSL) ou `smtp.office365.com:587` (STARTTLS).

### 2.4 OpenAI (`OpenAi account`)
Clé API OpenAI du client (peut être la même que `OPENAI_API_KEY` du `.env`).

### 2.5 Google Drive (`Google Drive account`)
OAuth2 avec le projet Google Cloud du client (API Drive activée). Autoriser avec le compte Drive du cabinet.

---

## Phase 3 — Import et adaptation des workflows N8n (45 min)

Les 3 fichiers à importer sont dans le dossier `n8n/` du dépôt :

| Fichier | Rôle | Déclencheur |
|---|---|---|
| `01_Creation_Mandat_FIXED.json` | Création de mandat (REF + dossier Drive + insert DB) | Webhook `POST /webhook/hg-nouveau-mandat` |
| `02_Ingestion_CV_FIXED.json` | Ingestion des CVs reçus par email (extraction, scoring, embedding) | IMAP (boîte candidatures) |
| `03_Import_CVs_Batch.json` | Import en masse de CVs déjà présents dans Google Drive | Webhook `POST /webhook/hg-import-cvs-batch` |

### 3.1 Importer
N8n → **Workflows → Import from File** → sélectionner chaque JSON.

### 3.2 Réassocier les credentials
Sur chaque nœud marqué d'un ⚠️ (credential manquant), sélectionner le credential créé en Phase 2 :
- Nœuds `Postgres — *` → credential Postgres
- Nœud `Email Trigger (IMAP)` → credential IMAP
- Nœuds `Mail - *` → credential SMTP
- Nœuds `OpenAI Chat Model`, `Analyser & Scorer le CV`, `Générer embedding OpenAI` → credential OpenAI
- Nœuds `Google Drive — *` → credential Google Drive

### 3.3 Adaptations par client (obligatoire)

**W02 — Email Trigger (IMAP)** : c'est ici que se décide **quelle boîte mail est surveillée**. Le credential IMAP choisi (2.2) détermine la boîte. Vérifier le dossier surveillé (par défaut `INBOX`).

**W02 — Nœuds `Mail - *`** : vérifier l'adresse d'expéditeur (champ *From Email*) — mettre la boîte candidatures du client.

**W01 — Google Drive — Créer dossier mandat** : vérifier le **dossier parent** dans lequel les dossiers de mandats sont créés (par défaut la racine du Drive). Recommandé : créer un dossier `SoftTalent — Mandats` chez le client et le sélectionner comme parent.

**W02 — Google Drive — Upload CV** : les CVs sont uploadés dans le dossier Drive du mandat (`drive_folder_id` stocké en DB) — rien à changer.

### 3.4 Activer les workflows
Basculer chaque workflow sur **Active**. Pour W01 et W03, noter l'URL du webhook **de production** (pas l'URL de test) et vérifier qu'elle correspond aux chemins configurés dans le `.env` de SoftTalent :
- `N8N_WEBHOOK_NOUVEAU_MANDAT=/webhook/hg-nouveau-mandat`
- `N8N_WEBHOOK_IMPORT_BATCH=/webhook/hg-import-cvs-batch`

`N8N_BASE_URL` doit pointer vers N8n **depuis le conteneur SoftTalent** : `http://n8n:5678` fonctionne si les deux conteneurs partagent un réseau (sinon connecter N8n au réseau `softtalent_internal` et utiliser le nom du conteneur).

---

## Phase 4 — Tests bout-en-bout (30 min)

Exécuter **dans l'ordre** :

### Test 1 — Création de mandat
1. Dans SoftTalent : créer un client de test, puis un mandat de test (poste : « Test Analyste »).
2. Vérifier : le mandat apparaît avec une REF `REF-<année>-001`, et un dossier du même nom existe dans Google Drive.
3. En cas d'échec : N8n → Executions → W01 → examiner le nœud en erreur.

### Test 2 — Ingestion CV par email
1. Envoyer un email à la boîte candidatures avec :
   - Sujet : `Candidature [REF-2026-001]` (adapter la REF au mandat de test)
   - Pièce jointe : un CV PDF réel
2. Attendre ≤ 2 minutes (polling IMAP), puis vérifier :
   - La candidature apparaît sur la page du mandat avec un score et une recommandation
   - Le CV est bien dans le dossier Drive du mandat
   - L'expéditeur a reçu un accusé de réception
   - L'embedding existe : `SELECT COUNT(*) FROM candidature_embeddings;` doit retourner ≥ 1

### Test 3 — Cas d'erreur email
- Email **sans** `[REF-...]` dans le sujet → réponse « référence introuvable »
- Email avec REF valide mais **sans pièce jointe** → réponse « CV manquant »

### Test 4 — Import en masse
1. Déposer 2-3 CVs PDF dans un dossier Google Drive du compte connecté.
2. Page du mandat → bouton **Importer CVs** → coller les IDs des fichiers Drive.
3. Vérifier que les candidatures apparaissent (traitement asynchrone : ~30 s par CV).

### Test 5 — Recherche vectorielle
1. Page **Recherche** : la bannière doit afficher « N CVs indexés » (pas d'avertissement clé manquante).
2. Rechercher en langage naturel un profil proche d'un CV de test → il doit remonter avec un % de similarité.

### Test 6 — Rapport
Générer un rapport de shortlist sur le mandat de test et exporter le PDF.

### ✅ Checkpoint final
- [ ] Les 6 tests passent
- [ ] Les données de test sont supprimées (mandat, client, candidatures de test)
- [ ] Mot de passe admin définitif en place
- [ ] Le client sait : créer un mandat, communiquer la REF aux candidats, lire les scores, utiliser la recherche

---

## Phase 5 — Reprise de l'existant (base de CVs historique)

Pour vectoriser la CVthèque existante du cabinet :

1. **Organiser** : demander au client de déposer ses CVs dans Google Drive (le compte connecté à N8n doit y avoir accès).
2. **Créer un mandat « CVthèque »** par grande famille de postes (ex. « CVthèque — Finance », « CVthèque — IT ») : le scoring est calculé par rapport au poste du mandat, donc regrouper par famille donne des scores cohérents.
3. **Importer par lots de ≤ 50** via le bouton **Importer CVs** (limite de l'API) — récupérer les IDs des fichiers depuis l'URL Drive (`https://drive.google.com/file/d/<ID>/view`).
4. **Surveiller** N8n → Executions pendant les premiers lots ; compter les embeddings en fin d'import :
   ```sql
   SELECT COUNT(*) FROM candidatures;
   SELECT COUNT(*) FROM candidature_embeddings;
   ```
   Les deux compteurs doivent croître ensemble. Un écart = CVs dont l'extraction a échoué (voir les executions en erreur).

> 💰 **Coût OpenAI estimé** : ~0,001-0,003 $ par CV (extraction gpt-4o-mini + scoring + embedding). 1000 CVs ≈ 1-3 $.

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `there is no parameter $1` dans N8n | Nœud Postgres v2 avec expressions `{{ }}` dans la requête | Utiliser les workflows du dossier `n8n/` (le SQL y est pré-construit dans un nœud Code) |
| Webhook N8n renvoie 404 | Workflow non **activé**, ou URL de test au lieu de production | Activer le workflow ; utiliser `/webhook/...` (pas `/webhook-test/...`) |
| SoftTalent n'atteint pas N8n | Conteneurs sur des réseaux différents | `docker network connect softtalent_internal n8n` puis `N8N_BASE_URL=http://n8n:5678` |
| N8n n'atteint pas Postgres | Idem | Même commande ; host = `softtalent_postgres` |
| Bannière « OPENAI_API_KEY non configurée » | Variable absente du conteneur | L'ajouter au `.env` puis `docker compose up -d softtalent` |
| Recherche : « Aucun CV indexé » | Aucun embedding généré | Vérifier les nœuds embedding dans les executions W02/W03 |
| Emails non traités | Credential IMAP invalide, ou workflow W02 inactif | Tester le credential ; vérifier N8n → Executions |
| Genre toujours « Inconnu » | Ancienne version du W02 | Réimporter `02_Ingestion_CV_FIXED.json` |
| Certificat TLS invalide | DNS pas propagé ou mauvais certresolver | `dig app...` ; comparer le certresolver aux autres services Traefik du VPS |

---

## Récapitulatif des variables `.env`

| Variable | Obligatoire | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | ✅ | Mot de passe DB (généré) |
| `DATABASE_URL` | ✅ | Doit contenir le même mot de passe |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `https://<APP_DOMAIN>` |
| `APP_DOMAIN` | ✅ | Domaine de l'app (routing Traefik) |
| `OPENAI_API_KEY` | ✅ | Recherche vectorielle côté app |
| `TRAEFIK_NETWORK` | ✅ | Nom du réseau Traefik existant |
| `N8N_BASE_URL` | ✅ | `http://n8n:5678` (réseau interne) |
| `N8N_WEBHOOK_*` | — | Défauts corrects, ne changer que si les chemins de webhook diffèrent |
| `ADMIN_EMAIL` / `ADMIN_SEED_PASSWORD` / `ADMIN_NOM` | ✅ (1er déploiement) | Compte admin initial |
| `NEXT_PUBLIC_CABINET_NOM` / `NEXT_PUBLIC_PRIMARY_COLOR` | — | Personnalisation client |

---

## Multi-client : points d'attention

Chaque client = **un déploiement isolé** (sa DB, son domaine, ses credentials, ses workflows N8n). Sur un même VPS mutualisé :

1. Un dossier par client (`/opt/softtalent-<client>`), chacun avec son `.env`.
2. **Renommer** les conteneurs et le réseau interne dans `docker-compose.yml` (`softtalent_postgres` → `softtalent_<client>_postgres`, réseau `softtalent_internal` → `softtalent_<client>_internal`, labels Traefik `softtalent` → `softtalent-<client>`) pour éviter les collisions.
3. Dupliquer les 3 workflows N8n par client (suffixer les noms : « W02 Ingestion CV — Cabinet X ») avec leurs propres credentials IMAP/Drive/Postgres, et des chemins de webhook distincts (ex. `/webhook/cabinetx-nouveau-mandat`) reportés dans le `.env` du client.
4. Chaque client a **sa propre boîte mail candidatures** → son propre credential IMAP → son propre trigger W02. C'est le credential IMAP qui détermine quelle boîte est surveillée.
