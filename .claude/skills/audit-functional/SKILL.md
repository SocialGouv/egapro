---
name: audit-functional
description: "Audit fonctionnel top-down de l'app (séparé de /analyse-/implement). Cartographie les chemins de test, les exécute en parallèle réel en local via navigateur, agrège les incohérences par type et crée un ticket bug par cluster confirmé. Usage: /audit-functional [<scope>] [--from-flows <RUN_DIR>]"
---

# /audit-functional

Audit fonctionnel **top-down** : parcourt un périmètre de l'app de bout en bout pour **découvrir** des incohérences (blocages, retour-arrière cassé, données affichées incohérentes, crashes) que les E2E ciblés ne couvrent pas. Séparé de la pipeline `/analyse`→`/implement`.

Lis `.claude/rules/audit-functional.md` — référence canonique des schémas (`flows.json`, `findings`, `clusters`), des oracles, de la convention de labels `bug/type:*` et des garde-fous. **Tout est read-only** : aucun fichier source modifié, aucun commit, aucune création de ticket sans validation utilisateur explicite.

Le skill est l'**orchestrateur synchrone** (pas un background loop — la Phase 4 exige un dialogue). Il enchaîne 4 phases, déléguant le travail lourd à 3 agents + 2 scripts.

| Phase | Délégué à | Sortie |
|---|---|---|
| 1 — cartographie | agent `flow-cartographer` (Opus) | `flows.json` |
| 1.5 — provisioning | `manage_audit_instances.sh clone` + `audit-seed-fixtures.mjs` + `… start` | N paires (DB clone + instance app) + `instances.map.json` |
| 2 — exécution ‖ | `audit_run_parallel.sh` → N × `flow-runner` (Sonnet) | `findings/*.jsonl` |
| 3 — synthèse | agent `finding-synthesizer` (Opus) | `clusters.json` |
| 4 — gate + tickets | **toi (skill)** + utilisateur | issues bug (1/cluster confirmé) |

**Périmètre v1** : `declaration-funnel` uniquement. On-demand.

**Isolation (modèle DB-bis)** : le funnel est lié au **SIREN de session** (le SIRET ProConnect — `getEffectiveSiren`), pas à une company sélectionnable. Donc on **clone la DB** par runner et on démarre **une instance d'app par clone** (port + `DATABASE_URL` propres). Tous les runners utilisent la **même identité** (le SIRET de test) mais écrivent chacun dans leur DB → zéro collision. Clone via `CREATE DATABASE … TEMPLATE` (~1,5 s).

---

## Step 0 — Préflight

**1. Parse les arguments + prépare le `RUN_DIR`** (créé avant tout, car le helper de stack y écrit son PID file) :

```bash
SCOPE="declaration-funnel"
FROM_FLOWS=""
ARGS="$ARGUMENTS"
case "$ARGS" in
  *--from-flows*)
    FROM_FLOWS="$(echo "$ARGS" | sed -E 's#.*--from-flows[[:space:]]+([^[:space:]]+).*#\1#')"
    ;;
esac
FIRST="$(echo "$ARGS" | awk '{print $1}')"
[ -n "$FIRST" ] && [ "$FIRST" != "--from-flows" ] && SCOPE="$FIRST"

REPO_ROOT="$(git rev-parse --show-toplevel)"
DEV_PORT="${AUDIT_DEV_PORT:-3000}"

if [ -n "$FROM_FLOWS" ]; then
  RUN_DIR="$FROM_FLOWS"; RUN_ID="$(basename "$RUN_DIR")"   # rejoue un run existant (saute la Phase 1)
else
  RUN_ID="${SCOPE}-$(date +%Y%m%d-%H%M%S)"
  RUN_DIR="${REPO_ROOT}/.claude/state/audit_run/${RUN_ID}"
fi
mkdir -p "$RUN_DIR/findings"
printf '{"scope":"%s","runId":"%s","devPort":%s}\n' "$SCOPE" "$RUN_ID" "$DEV_PORT" > "$RUN_DIR/run.meta.json"
bash scripts/orchestration/log_event.sh "audit-orchestrator-${RUN_ID}" START "scope=$SCOPE dev_port=$DEV_PORT"
```

**2. Monte la stack (turnkey)** — le skill démarre lui-même docker DB + dev server (mode `dev`), ou réutilise un serveur déjà actif sur `:${DEV_PORT}`. Il **ne possède** le serveur que s'il l'a démarré (PID file dans `RUN_DIR`) — un serveur préexistant n'est jamais coupé.

```bash
DEV_STATE="$(bash scripts/orchestration/manage_dev_server.sh ensure "$RUN_DIR" | tail -1)"
# DEV_STATE = "reused" (serveur de l'utilisateur, on n'y touche pas)
#           | "started <pid>" (démarré par le skill → sera coupé en Step final)
case "$DEV_STATE" in
  reused*)  echo "Dev server réutilisé sur :${DEV_PORT} (assure NEXT_PUBLIC_EGAPRO_ENV=dev pour [DEV] Remplir)." ;;
  started*) echo "Dev server démarré par le skill (${DEV_STATE})." ;;
  *) echo "ERREUR: dev server indisponible — voir $RUN_DIR/dev-server.log" >&2; exit 1 ;;
esac
```

> `manage_dev_server.sh ensure` fait : `docker compose up -d` (DB :5438) → réutilise `:${DEV_PORT}` s'il répond → sinon lance `NEXT_PUBLIC_EGAPRO_ENV=dev pnpm dev:app` détaché et poll jusqu'à readiness (≤ `AUDIT_DEV_READY_SECS`, défaut 150s). Si le serveur réutilisé n'est pas en mode `dev`, le bouton `[DEV] Remplir` manquera : prévenir l'utilisateur.

Si `--from-flows`, **sauter la Phase 1** (cartographie) et reprendre au **Step 1.5** (re-provisioning depuis le `flows.json` existant) — le serveur de cartographie n'est alors pas nécessaire.

---

## Step 1 — Cartographie (agent `flow-cartographer`, Opus)

Invoquer l'agent en **foreground synchrone** (comme `/implement` task/bug invoque `code-dev`) — process CLI avec son propre navigateur MCP :

`DEPTH` règle l'ampleur (`quick` ~15-25, `standard` ~60-120, `exhaustive` 150+) :

```bash
DEPTH="${AUDIT_DEPTH:-standard}"   # quick | standard | exhaustive (passé en 2e mot d'argument si fourni)
bash scripts/orchestration/log_event.sh "audit-orchestrator-${RUN_ID}" CARTO_START
env -u CLAUDECODE claude \
  --agent flow-cartographer --model opus \
  --print --output-format stream-json --verbose \
  --dangerously-skip-permissions --max-budget-usd "${AUDIT_BUDGET_CARTO:-20}" \
  "Cartographie le scope '${SCOPE}'. RUN_DIR=${RUN_DIR}. DEV_PORT=${DEV_PORT}. DEPTH=${DEPTH}. Suis .claude/agents/flow-cartographer/AGENT.md : assertion PAR ÉTAPE, back systématique à chaque étape, validation/cohérence, ZÉRO fusion d'états équivalents. Écris ${RUN_DIR}/flows.json."
bash scripts/orchestration/log_event.sh "audit-orchestrator-${RUN_ID}" CARTO_OK
```

**Checkpoint doux** : afficher le résumé de `flows.json` (nodes / fixtures / paths par famille / pruned). Au vu de l'ampleur (`standard` ⇒ 60-120 paths ⇒ autant de checks runner), **c'est le bon moment pour ajuster DEPTH ou élaguer** avant de provisionner. Proposer à l'utilisateur de relire/éditer `flows.json`. Pas un gate bloquant.

---

## Step 1.5 — Provisioning (N paires DB clone + instance app)

Le funnel étant lié au SIREN de session, on isole **par DB** : on clone la DB de dev une fois par fixture, on seede l'état de la classe de branche dans chaque clone, et on démarre une instance d'app dédiée par clone.

```bash
# Le clone CREATE DATABASE … TEMPLATE egapro exige AUCUNE connexion à egapro
# → couper d'abord le serveur de cartographie (:3000).
bash scripts/orchestration/manage_dev_server.sh stop "$RUN_DIR"

# 0) filet de sécurité : balayer les orphelins d'un éventuel run avorté
#    (tue les process sur les ports d'audit + DROP toute DB audit_*).
bash scripts/orchestration/manage_audit_instances.sh sweep

# 1) cloner N DBs (TEMPLATE egapro) + écrire instances.map.json
bash scripts/orchestration/manage_audit_instances.sh clone "$RUN_DIR"
# 2) seeder l'état de chaque classe de branche dans SA DB clonée (SIREN de session)
node packages/app/scripts/audit-seed-fixtures.mjs "$RUN_DIR"
# 3) build une fois (NEXT_PUBLIC_EGAPRO_ENV=dev baké) puis une instance `next start`
#    par clone (port + DATABASE_URL propres), poll readiness.
#    N instances concurrentes DOIVENT être `next start` (lecture seule du .next) —
#    deux `next dev` du même dossier se battent sur les presteps copy-* + .next.
bash scripts/orchestration/manage_audit_instances.sh start "$RUN_DIR"

# 4) isolation navigateur : extraire le storageState du profil MCP connecté +
#    écrire un mcp-config (--isolated --storage-state) → chaque runner aura son
#    PROPRE Chrome en mémoire (pas de verrou Chrome partagé = vrai parallèle).
#    Sans cette étape, les runners se sérialisent sur un seul Chrome.
bash scripts/orchestration/manage_audit_instances.sh auth "$RUN_DIR"

bash scripts/orchestration/log_event.sh "audit-orchestrator-${RUN_ID}" SEED_OK
```

Résultat : `instances.map.json` = `{ "<fixtureId>": { db, port, index, pid } }`. Chaque instance `http://localhost:<port>` sert le funnel sur le **SIREN de session** avec sa propre DB clonée → isolation totale, identité unique. Si le clone échoue (« source database is being accessed ») → s'assurer qu'aucun serveur ne pointe sur `egapro`.

---

## Step 2 — Exécution parallèle (script `audit_run_parallel.sh`)

```bash
AUDIT_MAX_PARALLEL="${AUDIT_MAX_PARALLEL:-5}" \
  bash scripts/orchestration/audit_run_parallel.sh "$RUN_DIR"
```

Le script fan-out **un `flow-runner` (Sonnet) par fixture**, chacun pilotant **son instance dédiée** (`http://localhost:<port>`, sa DB clonée, son navigateur), par vagues de `AUDIT_MAX_PARALLEL`. Chaque runner écrit `findings/runner-<i>.jsonl`.

> **Première exécution** : démarrer avec `AUDIT_MAX_PARALLEL=2` avant de monter à 5 (RAM des instances `next dev`).

Suivre l'avancement via `/report` (les agents loggent `flow-runner-<i>` et `audit-orchestrator-<run>`).

---

## Step 3 — Synthèse (agent `finding-synthesizer`, Opus)

```bash
env -u CLAUDECODE claude \
  --agent finding-synthesizer --model opus \
  --print --output-format stream-json --verbose \
  --dangerously-skip-permissions --max-budget-usd "${AUDIT_BUDGET_SYNTH:-10}" \
  "Synthétise les findings. RUN_DIR=${RUN_DIR}. SCOPE=${SCOPE}. RUN_ID=${RUN_ID}. Suis .claude/agents/finding-synthesizer/AGENT.md : dédup par (category,fingerprint), PUIS root-cause chaque cluster en LISANT le code (fichier:ligne), et écris ${RUN_DIR}/clusters.json — chaque proposedTicket a un corps DEV-GRADE (Contexte, Reproduction en actions concrètes, Attendu vs obtenu, Cause racine fichier:ligne, Correctif proposé, Scénarios affectés). Pas de screenshot."
bash scripts/orchestration/log_event.sh "audit-orchestrator-${RUN_ID}" SYNTH_OK
```

---

## Step 4 — Gate utilisateur + création des tickets

**C'est toi (le skill) qui tiens ce gate** — `finding-synthesizer` ne fait que *proposer*.

> ⛔ **HARD GATE — dry-run par défaut.** À ce stade **AUCUN `gh issue create` n'a été lancé et n'est lancé tant que l'utilisateur n'a pas approuvé explicitement.** L'issue d'un audit, par défaut, c'est **la liste de tickets proposés** — rien de posté. La création est une action utilisateur **séparée et délibérée**. En cas de doute, de réponse ambiguë, ou d'interruption → **ne rien poster**.

1. Lire `${RUN_DIR}/clusters.json`. **Rendre les clusters en markdown** (tableau : #, catégorie, titre, sévérité, **confiance**, **cause racine** `fichier:ligne`, paths) + le détail de chaque cluster : le **corps de ticket dev-grade** proposé (Contexte · Reproduction en actions · Attendu vs obtenu · Cause racine · Correctif proposé · Scénarios affectés). Pas de screenshot en v1.
2. `log_event … AWAITING_VALIDATION`. **Triage par cluster, puis confirmation finale explicite** :
   - pour chaque cluster, l'utilisateur **confirme** / **rejette** (faux positif) / **fusionne** / **édite** (titre, corps, sévérité) avant post ;
   - puis afficher **exactement la liste des issues qui vont être créées** (titres + labels) et **attendre un OK final explicite** (ex. « oui, crée ces N tickets »). Tant que cet OK n'est pas donné, **ne lancer aucun `gh`**.
   - par défaut, ne pré-cocher que les clusters `confidence: browser` ; les `code` / `à reproduire` sont **opt-in** (l'utilisateur doit les confirmer activement).
3. **Avant création** : s'assurer que les labels `bug/type:*` existent (idempotent) :

```bash
for t in navigation data-consistency blocking crash validation visual; do
  gh label create "bug/type:$t" --color BFD4F2 --description "Audit fonctionnel : $t" 2>/dev/null || true
done
```

4. Pour chaque cluster **confirmé**, créer **un** ticket bug (scrubber le body — hygiène artefacts, repo public) :

```bash
# Scrub check OBLIGATOIRE avant post (cf. git-artefact-hygiene.md)
echo "$BODY" | grep -E '(ghp_|sk-ant-|sk-proj-|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_=-]{20,}\.|postgres://[^@]+:[^@]+@|Bearer\s+[A-Za-z0-9._-]{20,})' \
  && { echo "STOP: secret détecté, je ne poste pas" >&2; exit 1; }

ISSUE_URL=$(gh issue create --title "$TITLE" --body "$BODY" --label "bug" --label "$CLUSTER_LABEL")
ISSUE_N=$(echo "$ISSUE_URL" | sed -E 's#.*/issues/([0-9]+)#\1#')

# Type natif Bug (gh issue edit ne supporte pas --type → GraphQL, cf. github-board.md snippet 7)
NODE_ID=$(gh api graphql -f query='query($n:Int!){repository(owner:"SocialGouv",name:"egapro"){issue(number:$n){id}}}' -F n=$ISSUE_N --jq '.data.repository.issue.id')
gh api graphql -f query='mutation($issueId:ID!,$typeId:ID!){updateIssueIssueType(input:{issueId:$issueId,issueTypeId:$typeId}){issue{number}}}' \
  -f issueId="$NODE_ID" -f typeId="IT_kwDOAh0HH84Aa_K1"   # Bug
```

> **Board** : laisser le ticket en `Backlog` (ou hors board). **Ne jamais** appeler `set_ticket_status.sh` au-delà de Backlog — `In review`/`Done` sont user-only.

5. `log_event … TICKETS_CREATED` puis `COMPLETE`.

---

## Step final — Report

```
## Audit fonctionnel : DONE

Scope: <scope>   RUN_DIR: <RUN_DIR>
Fixtures: <N>   Instances: <N ports>   Paths exécutés: <M>   Findings: <F>
Clusters: <C>  (confirmés: <k>, rejetés: <r>)
Tickets bug créés: #N1 (bug/type:navigation), #N2 (bug/type:data-consistency), …
Coverage gaps (runner errors, sans ticket): <E ou "aucun">

Relancer (re-provision depuis le flows.json existant) : /audit-functional --from-flows <RUN_DIR>
Teardown (instances + DBs clonées) : bash scripts/orchestration/manage_audit_instances.sh teardown <RUN_DIR>
```

**Fermeture de la stack** — arrêter les N instances et **supprimer les DBs clonées** (le cartography server `:3000` a déjà été coupé en Step 1.5) :

```bash
bash scripts/orchestration/manage_audit_instances.sh teardown "$RUN_DIR"
# stoppe chaque instance (par PID) puis DROP chaque DB clonée. Idempotent.
# (AUDIT_KEEP_DEV=1 pour laisser tourner si l'utilisateur veut inspecter une instance avant teardown)
```

Le `DROP DATABASE` des clones efface tout l'état seedé/écrit pendant le run — pas de teardown de fixtures séparé. Proposer ensuite un re-run avec `--from-flows <RUN_DIR>` (re-provisionne depuis le `flows.json` existant, saute la cartographie).

---

## Règles

- **Read-only total** — aucun fichier source modifié, aucun commit, aucune branche, aucun worktree. Les agents `flow-*` n'utilisent pas `git`.
- **Gate avant création de ticket** — un ticket n'est créé qu'après confirmation explicite, **par cluster**. Pas d'auto-création.
- **Agrégation par type, pas par scénario** — un ticket = une nature de problème, avec tous les scénarios affectés listés dedans (évite l'explosion d'A/R et de tickets).
- **Board ≤ Backlog** — jamais `In review`/`Done`.
- **Hygiène artefacts publics** (`.claude/rules/git-artefact-hygiene.md`) — scrub PII/SIREN/secrets avant tout `gh issue create`. L'audit n'utilise que le SIREN de test (clones), jamais de PII réelle.
- **Jamais prod** — audit local uniquement (clones de la DB de dev).
- **Cycle de vie de la stack** — cartographie sur un serveur `:3000`/egapro (read-only, coupé avant le clone) ; exécution sur N instances + N DBs clonées, **toutes détruites au teardown** (`manage_audit_instances.sh teardown`). Le clone TEMPLATE exige qu'aucun serveur ne soit connecté à `egapro`.
- **Récupération si abandon/crash** — le teardown ne tourne que sur le chemin nominal. Si un run est interrompu (les instances/DBs fuient), lancer `bash scripts/orchestration/manage_audit_instances.sh sweep` : il tue les process sur les ports d'audit et DROP toute DB `audit_*` (jamais la source `egapro` ni les autres ports). Ce `sweep` est aussi exécuté **avant** chaque provisioning pour repartir propre.
- **Isolation par DB** — jamais d'écriture concurrente sur la même DB : chaque runner a sa DB clonée. La DB de dev `egapro` n'est que la **source** du clone (jamais écrite par les runners).

---

## Référence

- Rule : `.claude/rules/audit-functional.md` (schémas, oracles, labels, garde-fous)
- Agents : `.claude/agents/{flow-cartographer,flow-runner,finding-synthesizer}/AGENT.md`
- Scripts : `scripts/orchestration/manage_dev_server.sh` (serveur cartographie), `scripts/orchestration/manage_audit_instances.sh` (clone DBs + N instances + teardown + sweep), `scripts/orchestration/audit_run_parallel.sh` (runners par port), `packages/app/scripts/audit-seed-fixtures.mjs` (état par clone)
- Board GraphQL : `.claude/rules/github-board.md` (snippet 7 = type Bug)
- Hygiène : `.claude/rules/git-artefact-hygiene.md`
