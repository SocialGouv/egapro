# Journalisation d'audit — inventaire et contrats

> Snapshot de référence de la couche audit : couverture des route handlers, données conservées dans `audit.action_log` et contrat du miroir stdout. La **règle** (quand câbler, comment) vit dans [`.agents/skills/implement/references/conventions/audit-logging.md`](../.agents/skills/implement/references/conventions/audit-logging.md). Les durées de conservation, côté DPO, vivent dans [`journaux-et-conservation.md`](journaux-et-conservation.md).

Toute PR qui ajoute, retire ou ré-câble un route handler, ou change ce que `logAction` / `activityLog.ts` persistent ou émettent, met cette page à jour dans le même diff.

---

## Route Handler coverage map (`src/app/api/**/route.ts`)

Inventory refreshed by issues #3764, #4664 and #4491 — **28 route files**, every one of them
accounted for below. Re-run the inventory with:

```bash
find packages/app/src/app/api -name route.ts | sort
```

If that count changes, this table is stale: a new handler is either audited or
listed as a named exemption. The only third state this table accepts is a route
whose wiring is in flight in a named open PR, and it is listed apart from the
counts — never inside them.

### Instrumented through `withAuditedRoute` (15)

| Route | Action key |
|---|---|
| `cse-opinion-pdf` | `PDF_CSE_OPINION_DOWNLOAD` |
| `declaration-lock/release` | `DECLARATION_LOCK_RELEASED` |
| `declaration-pdf` | `PDF_DECLARATION_DOWNLOAD` |
| `export/download` | `EXPORT_DOWNLOAD` |
| `export/generate` | `EXPORT_GENERATE` |
| `gip-mds/import` | `GIP_MDS_IMPORT` |
| `joint-evaluation-pdf` | `PDF_JOINT_EVALUATION_DOWNLOAD` |
| `prefill-pdf` | `PDF_PREFILL_DOWNLOAD` |
| `public/declarations/export` | `PUBLIC_DECLARATIONS_EXPORT` |
| `public/referents-egalite-professionnelle` | `PUBLIC_REFERENT_SEARCH` |
| `representation-pdf` | `PDF_REPRESENTATION_DOWNLOAD` |
| `v1/export/declarations` | `EXPORT_API_DECLARATIONS` |
| `v1/export/representations` | `EXPORT_API_REPRESENTATIONS` |
| `v1/files` | `EXPORT_API_FILES` |

The two `public/*` rows above emit stdout only. The other routes still write
`audit.action_log` as well as stdout.

The gap on `public/referents-egalite-professionnelle`, whose action key
already existed but was only reachable through tRPC — is closed by #3764.

### Audited through a direct `logAction` call (3)

These are audited, and audited correctly — the wrapper is a convenience, not
the definition of compliance. Each one logs from inside the handler because it
needs something `resolveContext` cannot produce.

| Route | Action key(s) | Why not the wrapper |
|---|---|---|
| `auth/logout` | `AUTH_LOGOUT` | Auth flow — pattern §4 of the audit-logging rule, reads the JWT rather than a session |
| `upload` | `CSE_OPINION_UPLOAD_FILE`, `JOINT_EVALUATION_UPLOAD_FILE` | The action key depends on the parsed multipart body |
| `v1/files/[fileId]` | `ADMIN_FILE_DOWNLOAD`, `USER_FILE_DOWNLOAD`, `EXPORT_API_FILES` | The action key depends on the caller's role, resolved mid-handler |

`resolveContext` runs **before** the handler, so it cannot see a result count,
a parsed body, or the branch the handler took. Converting these three to the
wrapper would flatten one row per call and lose the per-branch audit context.
The wrapper forwards the route context (`{ params }`) to `resolveContext`,
which removes the *type-level* blocker; it does not make the conversion
desirable.

### Deliberate exemptions (10)

| Route | Why no audit row |
|---|---|
| `healthz` | Liveness probe hit by Kubernetes every few seconds. Returns `"OK"`, reads nothing. Explicitly excluded above. |
| `e2e-clock` | Test-only clock override, unreachable in production. Auditing it would flood `action_log` from the E2E suite for zero compliance value. |
| `test-sentry` | Throws on purpose to exercise Sentry capture, for an admin with a fresh second factor only; 404s to anyone else and always in `prod`. No user data. |
| `v1/docs` | Serves the static Swagger UI shell; 404s in `prod`. No data access. |
| `public/openapi.json` | Static OpenAPI document, identical for every caller. |
| `v1/openapi.json` | idem. |
| `gip-mds/mock` | Reads a checked-in fixture CSV (`data/mock-gip-mds.csv`) that stands in for the GIP MDS API until it exists. Fictional data only. |
| `auth/logout/callback` | Bare redirect to `/` after the ProConnect end-session round-trip. The logout itself is audited by `auth/logout`; auditing the callback would double-count. |
| `auth/[...nextauth]` | NextAuth's own catch-all. Successful login is audited in the JWT callback and failures in the `logger` hook (pattern §4 of the audit-logging rule) — wrapping the handler would duplicate every row. |
| `trpc/[trpc]` | tRPC's fetch adapter. Every procedure worth auditing is already covered by `auditMiddleware` + `PROCEDURE_TO_ACTION`; wrapping the adapter would log one opaque row per batched call. |

---

## Données conservées dans `audit.action_log`

`logAction` est la dernière barrière avant l'insert pour ses appelants
(tRPC, route ou appel direct). Les scripts autonomes et le worker projettent
leurs lignes à leur propre point d'insertion. Il conserve l'action, la catégorie, le statut,
la date générée par la base, `user_id` et `siren` quand le contexte les
fournit sous forme validée (UUID pour `user_id`, 9 chiffres pour `siren`).
`user_email` et `user_agent` sont toujours `null`. `ip_address`
utilise `truncateIp()` (IPv4 /16, IPv6 /48, invalide → `null`). Le champ
`error_message` ne contient qu'un code connu ou `ERROR`, jamais le texte
libre de l'exception. `resource_type` accepte uniquement `declaration`,
`notification` ou `representation_declaration` ; `resource_id` n'accepte
qu'un UUID technique associé à un de ces types. Le verrou de représentation,
porté par le couple SIREN + année, n'a pas d'UUID : son année passe par
`metadata.year`.

Les actions `PUBLIC_REFERENT_SEARCH`, `PUBLIC_REFERENT_VIEW` et
`PUBLIC_DECLARATIONS_EXPORT` s'arrêtent après l'émission stdout de `logAction` :
aucune nouvelle ligne n'est insérée dans `audit.action_log`. Les lignes
historiques restent soumises à la purge ordinaire.

`metadata` est fermé par défaut. `metadata.ts` déclare, **par action**, les
clés utiles et leurs validateurs de valeur (année, compteur, booléen ou
énumération, UUID technique de déclaration ou de fichier). `logAction` reprojette systématiquement les métadonnées avec
cette politique : une nouvelle route ou un appel direct ne peut pas la
contourner. Les objets, tableaux libres, noms de fichiers, champs de recherche,
numéros de téléphone et clés inconnues sont écartés. Ajouter une clé exige
une justification d'audit, une valeur bornée et un test.

Le middleware tRPC lit l'input brut avant Zod. Il ne transmet de métadonnées
à `logAction` que si la procédure réussit, puis utilise la même projection
explicite par action. Un échec garde `metadata: null` afin qu'une valeur
forgée ne soit pas présentée comme validée. Le miroir stdout conserve son
contrat séparé décrit ci-dessous.

Les routes peuvent utiliser `auditQueryMetadata()` pour valider les
paramètres de recherche avant de les transmettre ; seuls les champs autorisés
pour l'action sont persistés par `logAction` et `logActionInTransaction`.

---

## Miroir stdout (#3705)

En complément de `audit.action_log` pour les actions protégées, et comme seule
trace applicative pour les trois actions publiques listées ci-dessus, `logAction`
et `auditMiddleware` (branche « chemin non mappé ») émettent chacun une ligne
JSON sur stdout via `~/server/audit/activityLog::emitActivityLog`, collectée
par la plateforme d'hébergement et affichée dans Grafana. Deux points d'appel
seulement — jamais un troisième call site direct à `emitActivityLog`.

**Contrat de ligne** — toujours les 16 clés, `null` si inconnue :
`timestamp`, `level` (`info`/`warn`), `logType` (constante `"user_activity"`),
`source` (`"trpc"` / `"route"` / `null`), `action`, `category`, `route`,
`operation`, `status`, `errorCode`, `durationMs`, `userId`, `siren`, `ip`,
`input`, `inputKeys`. Le contrat est figé côté consommateur (Grafana) —
n'ajoute ni ne retire une clé sans vérifier l'impact des requêtes `| json`.

**Granularité** : un appel tRPC (mappé ou non, lecture comprise) = une ligne ;
un chemin mappé n'en produit jamais deux (la branche non mappée ne passe pas
par `logAction`). Pas de ligne pour la navigation de pages.

**IP** — `truncateIp()` : IPv4 → `/16` (2 derniers octets à zéro), IPv6 → `/48`
(3 premiers groupes conservés, forme compressée `::`), une IPv4 mappée en IPv6
(`::ffff:a.b.c.d`) est traitée comme IPv4. Toute valeur invalide (y compris un
suffixe de port) → `null` : jamais l'en-tête brut recopié tel quel.

**`errorCode`** — `deriveErrorCode()` dérive un code court, jamais un message :
préfixe `^[A-Z][A-Z0-9_]{0,63}:` (formats tRPC `<CODE>: <message>` et
NextAuth) → ce préfixe ; `^HTTP (\d{3})` → `HTTP_<nnn>` ; sinon `ERROR`.
Pour un chemin tRPC non mappé ou une route, le code est résolu directement
(`error.code`, statut HTTP) sans passer par cette dérivation.

**`input` / `inputKeys` — fermé par défaut.** `inputKeys` liste les noms des
clés de premier niveau de l'input (objet non vide uniquement), triés, au plus
20, filtrés par `^[A-Za-z0-9_]{1,64}$` — *les noms seulement, jamais les
valeurs*.

**Ligne `source: "trpc"` → `input` toujours `null`**, chemin mappé comme non
mappé. L'input brut d'une procédure est lu par `auditMiddleware` **avant** la
validation Zod : ses valeurs sont celles que l'appelant a choisi d'envoyer, et
une valeur forgée sous une clé de la liste blanche (`siren`, `declarationId`…)
apparaîtrait dans sa propre ligne comme si elle était attestée (OWASP A09).
Seuls les noms de clés (`inputKeys`) sont donc écrits. La règle est portée par
`emitActivityLog` sur le champ `source`, pas par ses appelants : un nouveau
chemin tRPC en hérite sans rien câbler. Pour attribuer une ligne, lire
`userId`, `siren` et `ip` de premier niveau (session, en-têtes) — jamais
`input.*`.

Sur une ligne `source: "route"` ou un appel direct à `logAction`
(`source: null`) — métadonnées construites côté serveur —, `input` ne garde que
les clés d'une liste blanche fixe
(`~/server/audit/activityLog::INPUT_ALLOWED_KEYS` — clés techniques : `year`,
`siren`, `id`, `declarationId`, `fileId`, `step`, `currentStep`, `kind`,
`type`, `slice`, `declarationNumber`, `page`, `pageSize`, `limit`, `offset`,
`sortBy`, `sortOrder`, `sizeRange`, `region`, `county`, `hasCse`) **et** dont
la valeur est un nombre fini, un booléen, ou une chaîne courte
`^[A-Za-z0-9_.:-]{1,64}$` — jamais un objet, un tableau ou une Date, même sous
une clé autorisée. N'étends cette liste que pour une clé dont les valeurs ne
peuvent **jamais** être une donnée personnelle ni du texte libre ; en cas de
doute, laisse la clé hors liste — elle apparaîtra quand même dans `inputKeys`.
Étendre la liste ne rouvre **pas** les valeurs d'input sur les lignes tRPC.

**Origine (`source` / `route` / `operation`)** — jamais persistée en base,
portée par `LogActionOrigin` sur `LogActionInput.origin` :
`auditMiddleware` la renseigne avec le chemin de procédure + le type
(`query`/`mutation`/`subscription`) ; `withAuditedRoute` avec la méthode HTTP
+ le pathname (sans query string, tronqué à 200 caractères). Un appel direct
à `logAction` (auth, upload, cron) ne la renseigne pas — son `action` suffit
à l'identifier, et la ligne sort avec ces trois champs à `null`.

**Sémantique `ok: false` des middlewares tRPC** — en tRPC v11, `next()` ne
lève **jamais** pour un échec en aval (garde d'authentification, validation,
resolver) : `callRecursive` a déjà capturé le throw et résout
`{ ok: false, error }`. `auditMiddleware` doit détecter cette forme
(`isFailedMiddlewareResult()`, quel que soit le type de l'erreur portée) dans
les deux branches — chemin mappé (ligne en base **et** stdout) et non mappé
(stdout seul) — sous peine d'enregistrer tout échec tRPC comme un succès. Code
et message sont dérivés par `describeFailure()`, le même helper que pour un
`next()` qui lève. Le résultat de `next()` est toujours retourné tel
quel, `ok: false` inclus : l'audit ne doit jamais changer ce que voit le
client.

**Désactivation en test** — `emitActivityLog` ne fait rien quand
`env.NODE_ENV === "test"` (lu via `~/env`, jamais `process.env`). Le serveur
de dev et toute image déployée (`NODE_ENV` absent ou `production`) émettent
normalement. Aucune nouvelle variable d'environnement.

**Fail-safe** — `emitActivityLog` ne lève jamais (try/catch interne) ;
`logAction` l'appelle dans son propre try/catch, avant la décision de
persistance : un échec de la ligne stdout ne change pas la décision. Pour une
action protégée, un échec d'insert n'empêche jamais la ligne stdout déjà émise.

**`error_message` en base** — `logAction` réduit le message libre à un
code court de la liste contrôlée ou à `ERROR`. Le miroir stdout continue
d'utiliser `deriveErrorCode` sur le message original ; son contrat est
inchangé.
