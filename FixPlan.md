# FixPlan — Tests e2e · PR #3639 (epic/3476, refonte pages avis CSE)

> Statut : diagnostic terminé, décisions prises, fix non encore appliqué.
> Périmètre du fix : tests e2e Playwright **uniquement** (`packages/app/src/e2e/**`). La feature et le schéma ne sont pas en cause (voir §2.5).
> Branche de travail : `epic/3476`. PR finale `epic/3476 → alpha` : #3639.

---

## 0. Brief pour l'instance qui reprend

Tu es un·e expert·e des tests e2e Playwright. Tu reprends ce plan sans le contexte de la conversation qui l'a produit : tout ce qu'il te faut est dans ce document.

### Objectif

Remettre le job CI « Test e2e » au vert sur la PR #3639, en **réalignant le harnais de test sur le nouveau parcours avis CSE** et en **restaurant la couverture e2e de la matrice de types de contenu** (la fonctionnalité même qu'introduit l'epic). Ce n'est **pas** un fix de feature.

### Décisions déjà arbitrées (ne pas les rouvrir)

1. **On part sur P1** (réécriture du helper pour passer par l'UI réelle), pas sur le simple bump de timeout. Raison : le helper actuel injecte les données en base et ne teste plus la matrice. Voir §4 Étape 1.
2. **L'Étape 0 (confirmation via la trace) est obligatoire et se fait en premier**, avant d'écrire la moindre ligne de fix. Elle lève la dernière réserve (lenteur réelle de `finalize` vs simple flake). Voir §4 Étape 0.

### Coordonnées utiles

| Élément | Valeur |
|---|---|
| Repo (local) | `/home/selim/Documents/clients/ministeres-sociaux/egapro` |
| Repo (GitHub) | `SocialGouv/egapro` (public) |
| Branche | `epic/3476` |
| PR | #3639 |
| Run e2e échoué | id `27144209319`, job `80117428788` |
| SIREN de test | `130025265` (record partagé par toute la suite e2e) |
| Compte admin de test | `test@fia1.fr` (référencé par description, jamais le mot de passe) |

### Périmètre & règles

- **Ne modifier que `packages/app/src/e2e/**`.** Si tu te retrouves à devoir toucher `src/modules/**` ou `src/server/**`, c'est que tu as quitté le « fix de test » pour un « fix de régression » : arrête-toi et réévalue §3 point 2.
- **Ne pas commit/push sans demande explicite de l'utilisateur.** (Exception : si tu es invoqué·e via la skill `/implement` ou `/review`, suis leurs règles.)
- Repo **public** : zéro secret/PII/token dans les artefacts GitHub. Pas d'attribution IA dans les commits/PR (voir `CLAUDE.md` et `.claude/rules/git-artefact-hygiene.md`).
- Hooks actifs : `block-bad-patterns` (interdit `as any`/`: any` hors fichiers `*.test.*` ; les helpers e2e ne sont pas des `*.test.*`, donc **type proprement**), `auto-lint` (Biome après chaque edit). Ne pas tenter de contourner un hook.

### Fichiers à lire en premier (source de vérité)

| Fichier | Pourquoi |
|---|---|
| `packages/app/src/e2e/helpers/compliance-flows.ts` | le helper à réécrire (`submitCseStep2`, l'état actuel est en Annexe §7) |
| `packages/app/src/e2e/compliance.e2e.ts` | les 2 appelants (lignes 39 et 354) |
| `packages/app/src/e2e/helpers/db.ts` | helpers d'injection à retirer s'ils deviennent morts |
| `packages/app/src/modules/cseOpinion/Step2Upload.tsx` | logique du parcours (upload deux-temps, gate `submitDisabled`, toggle) |
| `packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx` | rendu des checkbox + libellé accessible (`checkboxLabel`, lignes 22-27) |
| `packages/app/src/modules/cseOpinion/contentTypeColumns.ts` | dérivation des colonnes selon le parcours + libellés |
| `packages/app/src/modules/shared/useFileUploadForm.ts` | mécanique d'upload (S3 + scan ClamAV) |
| `packages/app/src/server/api/routers/cseOpinion.ts` | `finalize`, `setFileContentTypes`, `getFiles` |
| `packages/app/playwright.config.ts` | `workers: 1`, `retries: 2` (CI), `timeout: 60_000` |

---

## 1. Contexte

### 1.1 L'évolution introduite par l'epic

L'epic #3476 refond l'**étape 2 du parcours avis CSE** (`/avis-cse/etape/2`, « Transmettre l'avis ou les avis du CSE »). Avant, l'étape consistait à déposer un PDF puis soumettre. Désormais, chaque fichier déposé doit être **associé à un ou plusieurs types de contenu** via une matrice (fichiers en lignes × types en colonnes), et la soumission est **bloquée tant que toutes les colonnes requises ne sont pas associées**.

Sous-tickets livrés et squash-mergés dans `epic/3476` :

- **#3631 (backend)** : table `app_cse_opinion_file`, mutations `setFileContentTypes` / `deleteFile`, query `getFileContentTypes`, et surtout **un gate de validation dans `cseOpinion.finalize`** qui rejette en `PRECONDITION_FAILED` si un type requis n'est associé à aucun fichier.
- **#3632 (frontend)** : composants `ContentTypeMatrix.tsx`, `contentTypeColumns.ts`, intégration dans `Step2Upload.tsx` (gate `submitDisabled` côté UI).

Colonnes affichées selon le parcours (`computeContentTypeColumns`, `contentTypeColumns.ts:69-92`) :

| Colonne | Condition d'affichage |
|---|---|
| Exactitude 1re déclaration | toujours |
| Justification 1re déclaration | écart ≥ 5 % **et** CSE consulté sur la justification (1re décl.) |
| Exactitude 2e déclaration | une 2e déclaration existe |
| Justification 2e déclaration | 2e déclaration **et** écart **et** CSE consulté (2e décl.) |

Double gate (UI + serveur) :

- UI : `submitDisabled = … || (!hasSelectedFiles && (!hasExistingFiles || !isComplete))` (`Step2Upload.tsx:179-182`), où `isComplete = getMissingColumns(...).length === 0`.
- Serveur : boucle `requiredTypes` dans `finalize` (`cseOpinion.ts`), qui relit les associations en base et rejette si une colonne requise n'est pas couverte.

### 1.2 Pourquoi ça casse les tests e2e

L'ancien helper `submitCseStep2` déposait un PDF et cliquait « Soumettre » : l'étape 2 était franchissable sans aucune association. **Avec le nouveau gate, ce parcours n'est plus valide** : `finalize` rejette désormais une soumission sans associations. L'ancien test ne pouvait donc structurellement plus passer.

Le helper a été réécrit pour tenir compte de l'évolution (état actuel en Annexe §7) : il **injecte le fichier + ses associations directement en base** (`insertCseOpinionFileWithAssociations`, `db.ts`) puis `page.reload()`, avant de soumettre. C'est cette réécriture qui est fragile (voir §2.4).

### 1.3 En quoi c'est normal

Le contrat fonctionnel de l'étape 2 a changé : une nouvelle condition de complétude conditionne la soumission. **Tout test e2e qui exerçait l'ancien contrat devait casser** : c'est le comportement attendu d'une suite e2e face à une évolution de parcours. La casse e2e n'est pas le symptôme d'un bug, mais la conséquence mécanique d'un changement de règle métier. Le travail restant n'est pas de « réparer la feature » mais d'**aligner le harnais de test sur le nouveau parcours**, proprement.

---

## 2. Diagnostic

### 2.1 État CI (run 27144209319)

Seul le job **« Test e2e » est rouge**. Build, typecheck, tests unitaires, lint/format, Lighthouse, Sonar, Socket : tous verts. Le frontend et le backend de la matrice sont couverts par des TU qui passent (`ContentTypeMatrix.test.tsx`, `contentTypeColumns.test.ts`, `schemas.test.ts`).

### 2.2 Détail des échecs Playwright

`127 passed · 1 failed · 3 flaky · 1 did not run`

| Test | Verdict | Point d'échec | Périmètre epic |
|---|---|---|---|
| `compliance.e2e.ts:346` — Path 12 | **failed (dur, 3 tentatives)** | `compliance-flows.ts:41` → `waitForURL("**/avis-cse/confirmation", 10s)` | **Oui** |
| `compliance.e2e.ts:30` — Path 1 | flaky (repasse au retry) | **même ligne**, même helper | **Oui** |
| `auth.setup.ts:4` — ProConnect | flaky | `login.ts:34` `clearCookies` | Non (auth) |
| `public-referents.e2e.ts:144` | flaky | « E2E Référent Paris » introuvable | Non (référents) |

Le « 1 did not run » est mécanique : la suite est en `mode: "serial"`, l'échec dur de Path 12 stoppe le test suivant du fichier.

### 2.3 Preuve : évolution, pas régression

| Branche | Run workflow e2e | Conclusion |
|---|---|---|
| `alpha` (push, 08/06 12:04) | e2e | **success** |
| `ticket/3631` backend (push, 05/06) | e2e | **failure** (déjà) |
| `epic/3476` → PR #3639 (08/06 14:21) | e2e | **failure** |

L'e2e est **vert sur alpha**, rouge sur l'epic, et était **déjà rouge dès le ticket backend #3631** : la casse remonte précisément à l'introduction du gate de complétude. Cohérent avec §1.2.

### 2.4 Cause racine technique

Le helper réécrit est **flaky**, et c'est ce flake qui rend la PR rouge, pas un bug logique. Démonstration interne au run : **Path 1 et Path 12 exécutent un parcours strictement identique** (même `beforeAll`, même `fillCseStep1(page, false)`, même `submitCseStep2()` avec les associations par défaut) et plantent à la **même ligne**, mais l'un repasse et l'autre non. Mêmes entrées, résultats différents = non-déterminisme = timing.

Facteurs de fragilité, par ordre d'impact :

1. **Fenêtre `waitForURL` sous-dimensionnée.** La navigation vers `/avis-cse/confirmation` a un timeout de **10 s** (`compliance-flows.ts:41`), alors qu'elle suit le round-trip le plus lourd du parcours : `finalize` (4 requêtes parallèles + requête `opinions` + state-machine `applyAction` + inserts d'historique + projection) **puis** `router.push`. Le repo budgète déjà **15 s** pour la fin de déclaration (`declaration-flows.ts:166`) et **30 s** pour la nav post-login (`login.ts:30`). La nav la plus coûteuse est la moins dotée.
2. **Suite entièrement sérielle.** `workers: 1` et `retries: 2` (CI). Path 12 s'exécute en toute fin d'une suite de ~14 min : runner chaud/chargé, le franchissement des 10 s devient improbable → échec des 3 tentatives. Path 1 est en début de suite (runner frais) → repasse dans le budget de retry, d'où « flaky ».
3. **Stratégie d'injection en base + `reload()`.** `insertCseOpinionFileWithAssociations` écrit via une connexion SQL séparée puis recharge la page. Au-delà du timing, cette approche **contourne l'UI réelle** : l'upload, l'interaction avec les cases (`onToggle`, l'état `lockedByOther`) et l'activation du bouton « Soumettre » ne sont **plus exercés par l'e2e**. Régression de couverture sur la fonctionnalité même qu'introduit l'epic.
4. **Course `setFileContentTypes` vs `finalize` (à neutraliser dans le fix UI).** `setFileContentTypes` persiste les associations dans une **transaction** (`delete` + `insert`). Côté UI, `submitDisabled` s'appuie sur l'état local `associations` mis à jour de façon **optimiste** dans `handleToggle` (`Step2Upload.tsx:80-92`), avant la résolution de la mutation. Un acteur qui coche puis soumet instantanément peut déclencher `finalize` avant la persistance → `PRECONDITION_FAILED`. Inoffensif pour un humain (la modale de certification laisse le temps), piégeux pour un bot e2e. À neutraliser explicitement (Étape 1, Phase B).

### 2.5 Ce qui n'est PAS en cause

- **Migration de schéma purement additive** : `0038_striped_xavin.sql` ne fait que `CREATE TABLE app_cse_opinion_file` + 2 FK + 1 index. Aucun `ALTER`/`DROP` sur une table existante. Le diff `schema.ts` est additif (nouvelle table + relations). Zéro effet de bord schéma sur les autres features.
- **Blast radius confiné au domaine `cseOpinion`** (+ clés d'audit additives). 127 e2e verts couvrent le reste de l'app.
- **Les 2 flaky hors périmètre** (ProConnect, référents) ne touchent ni l'auth ni les référents côté epic : bruit CI préexistant, absorbé par les retries.
- **Le « REVIEW_REQUIRED » de la PR** n'est pas une régression signalée : l'unique review est celle de `revu-bot` qui a planté (`REVU-AI-ERROR`), aucun commentaire humain ni inline.

---

## 3. Conclusions

1. Le rouge e2e résulte d'une **évolution légitime** (gate de complétude sur l'étape 2) qui a obsolété l'ancien test, **plus une fragilité du helper réécrit** (timeout 10 s sous-dimensionné + injection DB/reload + position en fin de suite sérielle).
2. **Aucune régression fonctionnelle prod n'est visible.** Réserve honnête, non levée par la seule lecture : une vraie lenteur de `finalize` / page confirmation > 10 s resterait compatible avec les faits et serait, elle, une régression de perf. Elle se lève en §4 Étape 0.
3. Le **fix est côté test**, pas côté feature. Objectif : réaligner le harnais sur le nouveau parcours **et** restaurer la couverture e2e de la matrice.
4. Les flaky hors périmètre ne doivent **pas** bloquer cette PR.

---

## 4. Plan de fix (exécution séquentielle)

### Étape 0 — Confirmer la cause via la trace (obligatoire, à faire en premier)

`trace: "retain-on-failure"` est actif et les artefacts sont uploadés (`playwright-report`, `playwright-traces`).

```bash
cd /home/selim/Documents/clients/ministeres-sociaux/egapro
# Lister les artefacts du run échoué
gh run view 27144209319 --repo SocialGouv/egapro
# Télécharger la trace + le rapport HTML
gh run download 27144209319 -n playwright-traces -D /tmp/e2e-traces --repo SocialGouv/egapro
gh run download 27144209319 -n playwright-report -D /tmp/e2e-report --repo SocialGouv/egapro
# Ouvrir la trace de Path 12 (chercher le dossier contenant "Path-12")
ls -R /tmp/e2e-traces
pnpm --filter app exec playwright show-trace /tmp/e2e-traces/<dossier-Path-12>/trace.zip
```

Vérifier dans la trace, au moment du timeout de `waitForURL("**/avis-cse/confirmation")` :

- l'appel réseau `cseOpinion.finalize` a-t-il renvoyé **200** (donc nav simplement lente → le timeout est le seul vrai problème) ou une **erreur 4xx/5xx** (donc gate serveur / course `setFileContentTypes`) ?
- le message `finalizeError` (« Le type de contenu … doit être associé … ») s'est-il affiché à l'écran (capture de la trace) ?

**Branche de décision :**
- `finalize` 200 mais lent → l'Étape 1 (qui passe à 30 s + parcours UI propre) suffit sur le fond. Continuer.
- `finalize` 4xx (`PRECONDITION_FAILED`) → la course §2.4.4 est bien le mécanisme ; l'Étape 1 la neutralise déjà via le `waitForResponse` (Phase B). Continuer, mais le confirmer après fix.
- À défaut d'artefact exploitable : **re-run le job e2e** (`gh run rerun 27144209319 --repo SocialGouv/egapro` ou via l'UI) ; si Path 12 repasse, l'hypothèse « lenteur masquée par flake » est confirmée.

Consigner le verdict de l'Étape 0 ici avant de coder :

> _Résultat Étape 0 (à remplir) :_ …

### Étape 1 — P1 : réécrire `submitCseStep2` pour passer par l'UI réelle (CIBLE)

**Le vrai parcours utilisateur est en deux temps** (vérifié dans `Step2Upload.tsx` + `useFileUploadForm.ts`) :

1. sélectionner un fichier → le bouton passe à **« Importer le ou les fichiers »** ;
2. cliquer dessus → upload (S3 + scan ClamAV + save tRPC) → la matrice apparaît, le bouton repasse à **« Soumettre »** (désactivé tant que les colonnes requises ne sont pas cochées) ;
3. cocher la/les colonne(s) requise(s) → `setFileContentTypes` persiste → « Soumettre » s'active ;
4. « Soumettre » ouvre la modale de certification → cocher la certification → « Valider » → `finalize` → redirection vers `/avis-cse/confirmation`.

**Implémentation cible proposée** (à adapter en lisant les composants ; ne pas copier aveuglément) :

```ts
// En tête de compliance-flows.ts, ajouter :
import { expect, type Page } from "@playwright/test";

// Type des colonnes à cocher (remplace l'ancien paramètre "associations" orienté DB).
type CseColumn = { declarationNumber: 1 | 2; type: "accuracy" | "gap" };

// Miroir de checkboxLabel() / TYPE_LABELS / DECLARATION_LABELS
// (ContentTypeMatrix.tsx:22-27 + contentTypeColumns.ts:19-27) — SOURCE DE VÉRITÉ.
const TYPE_LABELS = { accuracy: "Exactitude", gap: "Justification" } as const;
const DECL_LABELS = { 1: "1re déclaration", 2: "2e déclaration" } as const;

function cseCheckboxName(
  col: CseColumn,
  fileName: string,
  hasSecondDeclaration: boolean,
): string {
  // declarationLabel est null quand il n'y a PAS de 2e déclaration → pas de segment.
  const declPart = hasSecondDeclaration ? ` — ${DECL_LABELS[col.declarationNumber]}` : "";
  return `${TYPE_LABELS[col.type]}${declPart} — ${fileName}`;
}

export async function submitCseStep2(
  page: Page,
  options: { columns?: CseColumn[]; hasSecondDeclaration?: boolean } = {},
) {
  const {
    columns = [{ declarationNumber: 1, type: "accuracy" }],
    hasSecondDeclaration = false,
  } = options;
  const fileName = "dummy.pdf"; // basename de DUMMY_PDF

  await page.waitForURL("**/avis-cse/etape/2");

  // Phase A — upload via l'UI (deux temps : sélection puis "Importer")
  await page.locator("#cse-file-upload").setInputFiles(DUMMY_PDF);
  await page.getByRole("button", { name: "Importer le ou les fichiers" }).click();
  // Upload = S3 + scan antivirus + save : attendre que la ligne fichier apparaisse.
  await expect(page.getByText(fileName)).toBeVisible({ timeout: 30_000 });

  // Phase B — associer les types de contenu via les cases de la matrice.
  // On attend la persistance de chaque toggle AVANT de soumettre (anti-course §2.4.4).
  for (const col of columns) {
    const name = cseCheckboxName(col, fileName, hasSecondDeclaration);
    const persisted = page.waitForResponse(
      (r) => r.url().includes("setFileContentTypes") && r.ok(),
    );
    await page.getByRole("checkbox", { name }).check();
    await persisted;
  }

  // Phase C — soumettre, certifier, valider.
  const submit = page.getByRole("button", { name: "Soumettre" });
  await expect(submit).toBeEnabled(); // si KO ici → isComplete false, message clair
  await submit.click();
  await page
    .getByText(/Je certifie que les avis transmis sont conformes/)
    .click();
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL("**/avis-cse/confirmation", { timeout: 30_000 });
}
```

Points de vigilance :

- **Les 2 appelants** (`compliance.e2e.ts:39` et `:354`) appellent `submitCseStep2(page)` sans argument, tous deux précédés de `fillCseStep1(page, false)` (mono-déclaration, sans écart). Les valeurs par défaut (`columns = [{1, accuracy}]`, `hasSecondDeclaration = false`) couvrent donc les 2 cas sans toucher aux appelants. Vérifie quand même qu'ils compilent après le changement de signature.
- **Sélecteur checkbox** : en mono-déclaration le nom accessible vaut `"Exactitude — dummy.pdf"`. S'il y a ambiguïté (plusieurs fichiers / colonnes), restreindre via la ligne du fichier ou un `name` exact plutôt qu'un regex.
- **`waitForResponse`** : la base tRPC est `/api/trpc` (httpBatchLink), le nom de procédure apparaît dans l'URL → `includes("setFileContentTypes")` est fiable. Fallback si besoin : après `.check()`, attendre `await expect(submit).toBeEnabled()` puis un court filet réseau, mais le `waitForResponse` est le signal le plus net.
- **Nettoyage** : si plus aucun test n'utilise `insertCseOpinionFileWithAssociations` ni `setCseFileAssociationsForCurrentDeclaration` (`db.ts`), les **supprimer** (sinon code de test mort → le `structural-auditor` le relèvera).
- **Typage** : pas de `as any` (hook). Le type `CseColumn` suffit.

### Étape 2 — Compléter la couverture (suivi, non bloquant pour cette PR)

- Scénario dédié à la **règle de complétude** : tenter de soumettre sans cocher une colonne requise → vérifier que « Soumettre » reste désactivé et que le bloc « Un avis CSE est manquant » s'affiche.
- Scénario **multi-déclaration** (`fillCseStep1(page, true)`) : affichage conditionnel des 4 colonnes + libellé d'en-tête « 1re/2e déclaration » (passer `hasSecondDeclaration: true` au helper).
- Règle « une seule case par colonne » (`lockedByOther`) avec 2 fichiers déposés.

### Hors périmètre — ne pas bloquer cette PR

- `auth.setup.ts` (ProConnect) et `public-referents.e2e.ts` : flaky préexistants, absorbés par `retries: 2`, sans lien avec l'epic. Ticket de hardening CI séparé.

### Note process

Depuis le commit `37d7fa21` (« remove e2e tests when tasks merge to epic features »), **l'e2e ne tourne que sur la PR finale `epic → alpha`** (et les push `alpha`), pas sur les PR des sous-tickets. Conséquence : le drift du helper introduit dès #3631 n'a surfacé qu'ici, en fin d'epic. Piste : déclencher l'e2e (au moins `compliance.e2e.ts`) sur les sous-tickets touchant un parcours, ou en cron sur `epic/*`.

---

## 5. Exécuter & valider en local

Séquence reproduisant le CI (commandes lancées **depuis `packages/app/`**, comme en CI) :

```bash
cd /home/selim/Documents/clients/ministeres-sociaux/egapro
git checkout epic/3476 && git pull --ff-only

# 1. Dépendances + navigateur Playwright (réinstaller après un bump de version)
pnpm install --frozen-lockfile
pnpm --filter app exec playwright install chromium

# 2. Services backing (postgres:5438, notifications:5439, minio:9000, clamav:3310, maildev:1025/1080)
cd packages/app
docker compose up -d

# 3. .env.local — doit contenir au minimum (sinon le boot ou l'auth échoue) :
#    DATABASE_URL=postgresql://postgres:postgres@localhost:5438/egapro
#    NOTIFICATIONS_DATABASE_URL=postgresql://postgres:postgres@localhost:5439/egapro_notifications
#    ADMIN_EMAILS=test@fia1.fr
#    EGAPRO_GATEWAY_SHARED_SECRET=dev-gateway-shared-secret-minimum-32-chars
#    S3_ENDPOINT=http://localhost:9000  S3_ACCESS_KEY_ID=minioadmin  S3_SECRET_ACCESS_KEY=minioadmin  S3_BUCKET_NAME=egapro-dev-app
#    CLAMAV_HOST=localhost  CLAMAV_PORT=3310
#    (+ les secrets ProConnect ; l'auth de test ProConnect peut nécessiter le VPN)

# 4. Schéma + app
pnpm db:push

# Option A (fidèle au CI) : build prod puis Playwright lance `pnpm start` tout seul (webServer)
pnpm build
pnpm test:e2e

# Option B (itération rapide) : dev server sur :3000 réutilisé par Playwright (reuseExistingServer hors CI)
#   terminal 1 :  pnpm dev      # depuis packages/app, sert sur :3000
#   terminal 2 :  pnpm test:e2e

# Cibler uniquement les tests concernés pendant la mise au point :
pnpm exec playwright test compliance.e2e.ts -g "Path 12"
pnpm exec playwright test compliance.e2e.ts -g "Path 1:"
# Debug visuel : --headed --debug  ou  --ui
```

Gates à repasser avant de rendre la main (cf. `.claude/rules/automation.md`) : `pnpm typecheck`, `pnpm lint:check && pnpm format:check` (ou `pnpm check:write`). Pas de nouveau `.tsx` UI ici → l'audit RGAA est sans objet.

---

## 6. Critères de validation du fix

- Job « Test e2e » vert sur la PR #3639, et **Path 1 + Path 12 passent dès la 1re tentative** (zéro retry) sur **2 runs consécutifs**.
- La matrice est réellement exercée par l'UI : un scénario casserait si on retirait `ContentTypeMatrix` (preuve que la couverture est restaurée, contrairement à l'injection DB).
- `pnpm test:e2e` vert en local.
- **Aucune** modification de `src/modules/**` ni `src/server/**` : le correctif reste cantonné à `src/e2e/**`. Si un changement applicatif s'avère nécessaire → on est passé du « fix de test » au « fix de régression », réévaluer §3 point 2 et prévenir l'utilisateur.

---

## 7. Annexe — état actuel de `submitCseStep2` (ce que tu remplaces)

`packages/app/src/e2e/helpers/compliance-flows.ts:23-42` (version fragile à réécrire) :

```ts
export async function submitCseStep2(
	page: Page,
	associations: { declarationNumber: number; type: string }[] = [
		{ declarationNumber: 1, type: "accuracy" },
	],
) {
	await page.waitForURL("**/avis-cse/etape/2");
	await insertCseOpinionFileWithAssociations(associations); // injection DB directe
	await page.reload();
	await page.waitForURL("**/avis-cse/etape/2");
	await page.getByRole("button", { name: "Soumettre" }).click();
	await page
		.getByText(/Je certifie que les avis transmis sont conformes/)
		.waitFor({ state: "visible" });
	await page
		.getByText(/Je certifie que les avis transmis sont conformes/)
		.click();
	await page.getByRole("button", { name: "Valider" }).click();
	await page.waitForURL("**/avis-cse/confirmation", { timeout: 10_000 }); // ← timeout du run
}
```

Différences clés de la cible (Étape 1) : upload via l'UI au lieu de l'injection DB ; cochage réel des cases via leur nom accessible ; attente de la persistance `setFileContentTypes` ; timeout final porté à 30 s.
