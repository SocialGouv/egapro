# Audit Functional — Reference

> **Used by**: skill `/audit-functional`, agents `flow-cartographer`, `flow-runner`, `finding-synthesizer`, script `audit_run_parallel.sh`, seed `audit-seed-fixtures.mjs`. Chargé à la demande (pas de `paths:`, donc non auto-loadé). Référence canonique des schémas JSON, des oracles d'incohérence, de la convention de labels et des garde-fous.

`/audit-functional` est un mode d'audit **top-down** séparé de la pipeline `/analyse`→`/implement`. Il parcourt un périmètre de l'app de bout en bout pour **découvrir** des incohérences fonctionnelles (blocages, retour-arrière cassé, données incohérentes, crashes) que les E2E ciblés ne couvrent pas, puis agrège les trouvailles **par type de problème** et crée un ticket bug par cluster — **après validation explicite de l'utilisateur**.

**Périmètre v1** : funnel de déclaration (`/declaration-remuneration/etape/[1-6]` + parcours conformité). On-demand uniquement.

---

## Pipeline (4 phases)

Le **skill** (`.claude/skills/audit-functional/SKILL.md`) est l'orchestrateur synchrone — pas un background loop (la Phase 4 exige un dialogue interactif).

| Phase | Acteur | Entrée | Sortie |
|---|---|---|---|
| 0 — préflight | skill (bash) | `$ARGUMENTS` | `RUN_DIR`, dev server + DB OK |
| 1 — cartographie | `flow-cartographer` (Opus) | code + navigateur | `flows.json` (covering set) |
| 1.5 — provisioning | `manage_audit_instances.sh clone` + `audit-seed-fixtures.mjs` + `… start` | `flows.json` | N (DB clone + instance app) + `instances.map.json` |
| 2 — exécution || | `audit_run_parallel.sh` → N × `flow-runner` (Sonnet) | `flows.json` + `instances.map.json` | `findings/runner-<i>.jsonl` |
| 3 — synthèse | `finding-synthesizer` (Opus) | `findings/*.jsonl` | `clusters.json` |
| 4 — gate + tickets | skill + utilisateur | `clusters.json` | issues bug (1/cluster confirmé) |

**Isolation du parallélisme (modèle DB-bis)** : le funnel est lié au **SIREN de session** (`getEffectiveSiren` → SIRET ProConnect), pas à une company sélectionnable, et l'impersonation admin est read-only. Donc on **ne peut pas** isoler par SIREN pour des flux d'écriture. À la place, **deux isolations** :

1. **Données** : une DB clonée par runner (`CREATE DATABASE … TEMPLATE egapro`, ~1,5 s) + une instance d'app par clone (port + `DATABASE_URL` propres). Tous les runners partagent la **même identité** (le SIRET de test — cookie host-bound, valable sur tous les ports) mais écrivent chacun dans leur DB → zéro collision.
2. **Navigateur** : sans précaution, les serveurs @playwright/mcp des runners partagent **un seul profil Chrome** (même hash de config = même `~/.cache/ms-playwright/mcp-*`) → ils se sérialisent sur le SingletonLock. Fix : `manage_audit_instances.sh auth` extrait un storageState du profil connecté et écrit un `--mcp-config` qui lance chaque runner avec `--isolated --storage-state` → **un Chrome en mémoire par runner**, authentifié, sans verrou partagé (override non-strict de `playwright`, `next-devtools` préservé).

L'audit reste read-only sur le **code** (pas de worktree) ; seules les DBs clonées (jetables) sont écrites. La DB de dev `egapro` n'est que la **source** du clone.

---

## RUN_DIR layout

```
.claude/state/audit_run/<run-id>/        # run-id = scope + timestamp, ex: declaration-funnel-20260606-141500
  flows.json                             # phase 1
  instances.map.json                     # phase 1.5 : { "<fixtureId>": { db, port, index, pid } }
  instance-<port>.log                    # phase 1.5 : output de chaque instance app
  findings/
    runner-0.jsonl                       # phase 2 (une ligne par path)
    runner-1.jsonl
    ...
  clusters.json                          # phase 3
  run.meta.json                          # scope, run-id, dev port
```

Les screenshots vont dans `/tmp/playwright-mcp/` (config MCP utilisateur) et sont **référencés** par chemin depuis les findings (pas copiés dans `RUN_DIR`).

---

## Schéma `flows.json`

Arbre de chemins de test orienté **découverte de bugs** : l'unité est l'**assertion par étape / par arête**, énumérée **systématiquement** par classe de branche (forward + back à **chaque** étape, validation par champ, cohérence, branches spécifiques). **Pas** de « covering set » minimal ni de fusion d'états « équivalents » — un bug peut vivre à l'étape 4 précisément. Profondeur réglable (`quick`/`standard`/`exhaustive`). Toute famille non couverte est comptée dans `pruned` (jamais de troncature silencieuse).

```jsonc
{
  "scope": "declaration-funnel",
  "coverageCriterion": "per-step-assertion",     // plus "edge-coverage" : on veut la largeur
  "depth": "standard",                            // quick | standard | exhaustive
  "generatedBy": "flow-cartographer",
  "pruned": [                                      // familles déclinées (avec raison), PAS des collapses
    { "reason": "compliance non applicable à fx-voluntary (workforce<100)", "count": 0 }
  ],
  "fixtures": [                                    // classes de branche → 1 company seedée chacune
    {
      "id": "fx-lt50",                            // référencé par paths[].fixture
      "branchClass": "voluntary",                 // libellé humain
      "workforce": 30,                            // < COMPANY_SIZE_VOLUNTARY_MAX (50)
      "hasCse": false,
      "gipPrefill": false,                        // GIP-MDS pré-rempli ou non
      "gapAbleToTriggerAlert": false              // pourra-t-on atteindre un écart ≥ GAP_ALERT_THRESHOLD
    }
    // ~6-8 fixtures couvrant : <50 / 50-99 / 100-249 / 250+  ×  gap </≥ 5%  ×  CSE  ×  prefill
  ],
  "nodes": [                                       // états atteignables (optionnel mais utile pour le graphe)
    { "id": "step1", "route": "/declaration-remuneration/etape/1", "label": "Effectifs" }
  ],
  "paths": [
    {
      "id": "p1",                                 // unique, référencé par les findings
      "title": "Décl <50 nominal jusqu'au récap",
      "fixture": "fx-lt50",                       // quelle company seedée utiliser
      "branchConditions": ["workforce<50"],       // conditions métier exercées
      "steps": [
        { "node": "step1", "action": "remplir effectifs (femmes=10, hommes=20)", "expect": "étape 2 atteignable" },
        { "node": "step6", "action": "ouvrir le récapitulatif", "expect": "valeurs saisies reflétées" }
      ],
      "oracles": ["no-console-error", "back-available", "recap-matches-input"]   // sous-ensemble du catalogue
    }
  ]
}
```

---

## Schéma `findings/runner-<i>.jsonl`

Une ligne JSON par path exécuté (JSONL — un objet par ligne, pas de tableau englobant).

```jsonc
{
  "pathId": "p7",
  "fixture": "fx-100-gap6",
  "runner": 1,
  "status": "incoherent",                 // ok | incoherent | blocked | error | skipped
  "findings": [                            // [] si status=ok
    {
      "category": "navigation",            // voir enum Catégories
      "fingerprint": "etape/4|back-missing",   // route|symptom-key — clé de dédup (voir convention)
      "severity": "high",                  // high | medium | low
      "oracle": "back-available",          // oracle déterministe déclencheur, ou "llm" si jugement
      "llmJudged": false,                  // true si c'est le fallback LLM qui a tranché
      "evidence": {
        "url": "/declaration-remuneration/etape/4",
        "screenshot": "/tmp/playwright-mcp/p7-step4.png",   // annexe locale (non posté en v1)
        "console": [],                     // lignes console pertinentes (scrubées)
        "network": []                      // requêtes en échec pertinentes (status, url scrubée)
      },
      "reproSteps": [                       // actions CONCRÈTES rejouables (→ section Reproduction du ticket)
        "Aller sur /declaration-remuneration/etape/4 (parcours alerte, 100-249 sal., écart ≥ 5 %)",
        "Observer : aucun bouton Précédent rendu par FormActions"
      ],
      "description": "Bouton Précédent absent à l'étape 4 pour le parcours alerte (≥5%)."
    }
  ]
}
```

`status` :
- `ok` — tous les oracles passent.
- `incoherent` — ≥1 finding (incohérence fonctionnelle).
- `blocked` — le path n'a pas pu être terminé (l'utilisateur simulé est bloqué) → c'est lui-même un finding `blocking`.
- `error` — échec technique du runner (dev server down, élément introuvable) → **pas** un bug applicatif, à diagnostiquer.
- `skipped` — fixture indisponible / path hors périmètre.

---

## Schéma `clusters.json`

Agrégation par **type de problème** (pas par scénario). Produit par `finding-synthesizer` après dédup.

```jsonc
{
  "scope": "declaration-funnel",
  "runId": "declaration-funnel-20260606-141500",
  "totalFindings": 23,
  "clusters": [
    {
      "id": "c1",
      "category": "navigation",
      "title": "Bouton Précédent absent (étapes 3-5, parcours alerte)",
      "affectedPaths": ["p2", "p5", "p7"],          // traçabilité
      "occurrences": 3,
      "severity": "high",                           // sévérité max des findings du cluster
      "confidence": "browser",                      // browser | code | à reproduire
      "rootCause": "FormActions.tsx:42",            // fichier:ligne vérifié par le synthesizer
      "fingerprints": ["etape/3|back-missing", "etape/4|back-missing", "etape/5|back-missing"],
      "proposedTicket": {                           // brouillon dev-grade, prêt pour le gate
        "title": "bug(navigation): retour arrière indisponible étapes 3-5 du funnel (parcours alerte)",
        // corps ÉCRIT POUR UN DEV — sections obligatoires :
        // ## Contexte · ## Reproduction (étapes = actions concrètes, depuis reproSteps)
        // ## Comportement attendu vs obtenu · ## Cause racine (fichier:ligne)
        // ## Correctif proposé (2-3 lignes, pas de code complet) · ## Scénarios affectés
        "body": "## Contexte\n…\n## Reproduction (étapes)\n1. …\n2. …\n## Comportement attendu vs obtenu\n…\n## Cause racine\n`FormActions.tsx:42` — …\n## Correctif proposé\n…\n## Scénarios affectés\np2, p5, p7",
        "label": "bug/type:navigation"
      }
    }
  ]
}
```

Le corps du ticket est **écrit pour un développeur** : la reproduction est une suite d'**actions concrètes** (issues du `reproSteps` des findings), suivie de la **cause racine** (`fichier:ligne`, vérifiée dans le code par le synthesizer) et d'un **correctif proposé**. Pas de screenshot en v1 — on s'appuie sur les étapes écrites. Ce corps alimente directement `/analyse #N` → `/implement #N`.

---

## Catalogue d'oracles (déterministe d'abord, LLM ensuite)

Les oracles déterministes tranchent en premier ; le jugement LLM n'intervient **que** sur l'ambigu. Cet ordre réduit les faux positifs et le nombre d'allers-retours avec l'utilisateur.

| Catégorie (`category`) | Oracle (`oracle`) | Test déterministe | Fallback LLM |
|---|---|---|---|
| `blocking` | `forward-blocked` | submit → erreur sans recovery ; état terminal sans action forward attendue | « l'utilisateur est-il réellement bloqué (pas juste une étape optionnelle) ? » |
| `navigation` | `back-available` | bouton Précédent absent/désactivé là où `FormActions` devrait le rendre | « le retour devrait-il exister à cette étape ? » |
| `navigation` | `back-preserves-state` | `browser_navigate_back` puis re-forward perd les données saisies | — |
| `data-consistency` | `recap-matches-input` | valeur saisie à l'étape N ≠ valeur affichée au récap (étape 6) | jugement sémantique |
| `data-consistency` | `gap-matches-inputs` | écart affiché ≠ écart recalculé depuis les inputs | jugement sémantique |
| `data-consistency` | `prefill-not-clobbered` | pré-remplissage GIP écrasé sans action utilisateur | — |
| `crash` | `no-console-error` | `browser_console_messages` contient une erreur non attendue | distinguer déprécation Next.js (attendu) vs `TypeError`/runtime (réel) |
| `crash` | `no-5xx` | `browser_network_requests` contient un 5xx | — |
| `crash` | `no-runtime-error` | `nextjs_call(get_errors)` non vide ; ErrorBoundary affiché ; 404 inattendu | — |
| `validation` | `error-shown-on-invalid` | input invalide soumis sans message DSFR `fr-error-text` visible | — |
| `visual` | (réservé) | écart structurel Figma ↔ app (hors v1, hook pour plus tard) | — |

**Catégories (`category`)** — enum fermé : `blocking`, `navigation`, `data-consistency`, `crash`, `validation`, `visual`.

**Convention `fingerprint`** : `<route-relative-ou-node>|<symptom-key>`, ex. `etape/4|back-missing`, `etape/6|recap-mismatch:totalWomen`. C'est la **clé de déduplication** : deux findings de même `fingerprint` sur des paths différents → **un seul cluster**. Le `symptom-key` doit être stable (pas de valeur volatile : pas de timestamp, pas d'UUID, pas de SIREN).

---

## Matrice de fixtures (état par DB clonée)

Une **DB clonée par classe de branche**, chacune servie par sa propre instance d'app. Dans chaque clone, l'état de la classe de branche est posé sur le **SIREN de session** (`130025265`, le SIRET de test — déjà présent puisque la DB est clonée de `egapro`) : `workforce`, `hasCse`, présence d'une ligne GIP (`gipPrefill`), `status` (défaut `draft`). Pas de SIREN fictif : `audit-seed-fixtures.mjs` lit `flows.json.fixtures` + `instances.map.json` et seede l'état dans la DB de chaque fixture. Les agents/runners ne manipulent jamais un SIREN — ils ciblent un **port** d'instance.

> **Limite connue** : une instance = une déclaration = un état de départ. Si deux paths d'une même fixture exigent des états différents (ex. `draft` vs `submitted`), le runner repart de `/etape/1` (sa DB est à lui seul) ou marque le path `skipped`. Le seed pose l'état par défaut (`draft` + contexte).

Classes de branche couvertes (seuils tirés de `~/modules/domain/shared/constants.ts`) :

| `branchClass` | workforce | hasCse | prefill | exerce |
|---|---|---|---|---|
| `voluntary` | < 50 | false | false | déclaration volontaire, pas de conformité ni CSE |
| `triennial` | 50-99 | false | false | indicateurs sans G, pas de conformité, pas de CSE |
| `annual-nogap` | 100-249 | true | true | déclaration complète, écart < 5% → pas de conformité |
| `annual-alert` | 100-249 | true | true | écart ≥ 5% → propose le parcours conformité + CSE |
| `large-annual` | 250+ | true | false | indicateur G annuel |

> La liste exacte (5-8 entrées) est décidée par `flow-cartographer` selon le graphe réellement atteignable ; le tableau ci-dessus est le minimum de couverture.

---

## Convention de labels GitHub `bug/type:*`

Aucune agrégation par type n'existait avant ce skill. On introduit des labels secondaires (le **type GitHub natif reste `Bug`** — `IT_kwDOAh0HH84Aa_K1`, cf. `github-board.md` snippet 7) :

```
bug/type:navigation
bug/type:data-consistency
bug/type:blocking
bug/type:crash
bug/type:validation
bug/type:visual
```

Créés une fois via `gh label create "bug/type:navigation" --color BFD4F2 --description "..."` (idempotent : `|| true` si déjà présent). Un ticket issu d'un cluster porte : le type natif **Bug** + le label `bug` + le label `bug/type:<category>` du cluster.

---

## Garde-fous (hard rules)

- **Read-only total** : aucun fichier source modifié, aucun commit, aucune branche, aucun worktree, dev server jamais redéployé. Les agents `flow-*` n'utilisent pas `git`.
- **Création de tickets : dry-run par défaut, gate utilisateur explicite.** Un agent ne crée **jamais** d'issue seul (`flow-runner`/`finding-synthesizer` sont read-only et ne lancent **jamais** `gh issue create`). L'issue par défaut d'un audit = **la liste de tickets proposés**, rien de posté. Le skill ne poste qu'après (a) triage par cluster **et** (b) un **OK final explicite** listant exactement les issues à créer. Doute / ambiguïté / interruption → **ne rien poster**. Les clusters `confidence: code|à reproduire` sont **opt-in** (confirmation active requise).
- **Board ≤ Backlog** : un ticket créé reste en `Backlog` (ou hors board). Jamais `In review`/`Done` (user-only ; cf. `set_ticket_status.sh` exit 3). En pratique le skill n'appelle pas le board au-delà de l'ajout optionnel au project en Backlog.
- **Hygiène artefacts publics** (`.claude/rules/git-artefact-hygiene.md`) : scrub PII/SIREN/secrets avant tout `gh issue create` et dans les `evidence`/`description` des findings. Les fixtures utilisent des SIREN fictifs dédiés → pas de PII réelle.
- **Jamais prod** : audit sur dev local uniquement (clones de la DB de dev + instances locales).
- **Pas de modif `.claude/settings*.json`** ni d'auto-mémoire par les agents.
- **Cleanup** : `manage_audit_instances.sh teardown <RUN_DIR>` arrête les N instances et **DROP** les DBs clonées (jetables) — settle + retry. La DB source `egapro` n'est jamais écrite par les runners. Idempotent.
- **Récupération orphelins** : `manage_audit_instances.sh sweep` (sans RUN_DIR) est le filet de sécurité si un run est avorté avant le teardown — tue les process sur la plage de ports d'audit + DROP toute DB `audit_*` (jamais `egapro`). Lancé aussi avant chaque provisioning.

---

## Logging (`log_event.sh`) — observabilité `/report`

Agent-ids : `flow-cartographer`, `flow-runner-<i>`, `finding-synthesizer`, `audit-orchestrator-<run-id>`.

Events conseillés (à logger AVANT de passer à la phase suivante — discipline blocking comme `code-dev`) :

```
audit-orchestrator : START → CARTO_START → CARTO_OK → DB_CLONE×N → INSTANCE_SPAWN×N → INSTANCE_READY×N → SEED_OK → RUN_START → RUN_OK → SYNTH_OK → AWAITING_VALIDATION → TICKETS_CREATED → INSTANCES_TEARDOWN → COMPLETE
flow-cartographer  : START → DOMAIN_READ → BROWSE_START → FLOWS_WRITTEN
flow-runner-<i>    : START → PATH_<id>_OK | PATH_<id>_FAIL → RUN_DONE
finding-synthesizer: START → DEDUP_OK → CLUSTERS_WRITTEN
```
