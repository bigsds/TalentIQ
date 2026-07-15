# Workflows N8n — SoftTalent

Trois workflows à importer dans N8n (**Workflows → Import from File**). Pour la procédure complète de déploiement chez un client (credentials, tests), voir [`../DEPLOYMENT_PLAYBOOK.md`](../DEPLOYMENT_PLAYBOOK.md).

| Fichier | Workflow | Déclencheur |
|---|---|---|
| `01_Creation_Mandat_FIXED.json` | W01 — Création Mandat | Webhook `POST /webhook/hg-nouveau-mandat` |
| `02_Ingestion_CV_FIXED.json` | W02 — Ingestion CV par email | IMAP (boîte candidatures) |
| `03_Import_CVs_Batch.json` | W03 — Import CVs en masse | Webhook `POST /webhook/hg-import-cvs-batch` |

## Credentials requis

| Credential N8n | Utilisé par | Notes |
|---|---|---|
| Postgres | W01, W02, W03 | Host `softtalent_postgres`, DB `hg_recrutement` (réseau Docker `softtalent_internal`) |
| IMAP | W02 (trigger) | **C'est ce credential qui détermine la boîte mail surveillée** |
| SMTP | W02 (4 nœuds `Mail - *`) | Même boîte, pour les réponses automatiques |
| OpenAI | W02, W03 | gpt-4o-mini + text-embedding-3-small |
| Google Drive OAuth2 | W01, W02, W03 | Compte Drive du cabinet |

Après import, réassocier chaque credential sur les nœuds marqués ⚠️.

---

## W01 — Création Mandat

Appelé par SoftTalent à la création d'un mandat (`lib/n8n.ts` → `nouveauMandat`).

**Payload attendu** :
```json
{
  "client_id": 1,
  "poste": "Analyste Crédit",
  "date_fin_collecte": "2026-08-31",
  "lieu": "...", "secteur": "...", "mission": "...",
  "description_offre": "...", "profil_requis": "...", "nb_postes": 1
}
```
(`client_id`, `poste`, `date_fin_collecte` obligatoires → sinon réponse 400)

**Pipeline** : validation → génération REF séquentielle (`REF-YYYY-NNN`, requête du max en DB) → création du dossier Google Drive nommé `REF — poste` → `INSERT INTO mandats` → réponse 201 avec `{ id, ref, drive_folder_id }`.

**À adapter par client** : dossier Drive **parent** dans le nœud « Google Drive — Créer dossier mandat » (recommandé : un dossier racine `SoftTalent — Mandats`).

---

## W02 — Ingestion CV par email

**Trigger IMAP** : surveille la boîte candidatures (définie par le credential IMAP). Les candidats envoient leur CV avec la référence du mandat dans le sujet : `Candidature [REF-2026-001]`.

**Pipeline** :
1. Extraction de la REF du sujet (regex `\[REF-...\]`) et de l'email expéditeur
2. `SELECT` du mandat en DB → contrôles : REF trouvée ? mandat actif et date de collecte non dépassée ? pièce jointe CV présente (.pdf/.doc/.docx) ?
   - Chaque échec déclenche un email de réponse dédié (« Référence introuvable », « Offre clôturée », « CV manquant »)
3. Extraction du texte du CV (binaire `attachment_0`)
4. **Information Extractor** (gpt-4o-mini) : nom, prénom, contact, genre, expérience, formation, langues, compétences, secteurs
5. **Scoring** (appel HTTP OpenAI) : score 0-100 + justification + recommandation, par rapport au poste/profil requis du mandat
6. Upload du CV dans le dossier Drive du mandat
7. `INSERT INTO candidatures`
8. **Embedding** : texte de profil → `text-embedding-3-small` → `INSERT INTO candidature_embeddings` (`ON CONFLICT DO UPDATE`)
9. Accusé de réception au candidat

**À adapter par client** : credential IMAP (boîte surveillée), adresse *From* des 4 nœuds `Mail - *`.

---

## W03 — Import CVs en masse (CVthèque existante)

Appelé par le bouton **Importer CVs** de la page mandat (`POST /api/mandats/import-cvs`).

**Payload** :
```json
{ "mandat_id": 12, "file_ids": ["1AbC...", "2DeF..."] }
```
(IDs de fichiers Google Drive, max 50 par appel — limite côté app)

**Pipeline** : réponse 200 immédiate (`onReceived`, traitement asynchrone) → `SELECT` du mandat → un item par fichier → téléchargement Drive (binaire `data`) → même chaîne extraction/scoring/insert/embedding que W02. Pas d'upload Drive (le fichier y est déjà : `cv_url = https://drive.google.com/file/d/<id>/view`) ni d'emails.

---

## Pièges connus (déjà corrigés dans ces fichiers — à connaître si vous modifiez)

1. **Bug N8n Postgres v2 « there is no parameter $1 »** : le nœud Postgres v2 en mode `executeQuery` convertit les expressions `{{ }}` en placeholders `$1, $2…` mais ne transmet pas les valeurs. **Solution appliquée** : chaque requête est pré-construite dans un nœud Code (`Préparer INSERT …`) avec un helper `esc()` (échappement des quotes), puis passée au nœud Postgres via une seule expression `={{ $json.insert_query }}`. Ne jamais remettre d'expressions directement dans le champ Query.
2. **Champs binaires** : les pièces jointes IMAP arrivent dans `attachment_0` (W02) ; les téléchargements Google Drive dans `data` (W03). Les nœuds « Extract from File » sont configurés en conséquence.
3. **Genre** : l'Information Extractor renvoie `M`/`F` (conformément à l'exemple du schéma) ; le formatter accepte aussi `Masculin/Féminin/Male/Female/Homme/Femme`. Ne pas restreindre ce mapping.
4. **URLs de webhook** : utiliser les URLs de **production** (`/webhook/...`) une fois le workflow activé, pas les URLs de test (`/webhook-test/...`).
