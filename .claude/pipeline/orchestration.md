# Pipeline `/analyse` → `/implement`

> **Pipeline only.** Rien ici n'est chargé automatiquement : ce fichier décrit la mécanique d'orchestration, lue à la demande par les skills `/analyse`, `/implement`, `/report`, `/review` et par les scripts `scripts/orchestration/`. Une session de travail directe (édition, hotfix, question) n'en a pas besoin — elle suit `.claude/rules/automation.md` (hooks + les 4 gates) et le socle `.claude/rules/`.

## Vue d'ensemble

### Pipeline principal : conception → exécution

```
/analyse [<issue#>|<description>]    →    /implement <issue#>
──────────────────────────────────         ───────────────────
 Détection mode selon issue type            Détection mode selon issue type
 ou prompt :                                 :
   Feature → product-owner + architect       Feature → epic_loop.sh background
                                            (parallèle, plusieurs sub-tickets)
   Task    → architect mode task            Task → code-dev synchrone foreground
   Bug     → bug-analyst                    Bug  → code-dev synchrone foreground
                                                   (avec bug-fix-workflow)
 Sortie :                                   Sortie :
   epic = epic GitHub + N sub-issues          epic = N PRs squash-mergées dans
   task = ## Analyse architecte sur l'issue          epic/<N>, PR finale → alpha
   bug  = ## Analyse du bug sur l'issue       task = PR sur alpha, ticket reste "In progress"
                                              bug  = PR sur alpha, ticket reste "In progress"
                                              (l'utilisateur passe à "In review" puis "Done" lui-même)
```

### Agents (`.claude/agents/`)

**Pipeline conception** (Opus, invoqués par `/analyse`) :
| Agent | Rôle |
|---|---|
| `product-owner` | Refine le besoin, rédige les scénarios PO sur l'epic (mode epic uniquement) |
| `architect` | 3 modes : `epic-create` / `epic-enrich` (sub-issues d'un epic), `task` (commentaire `## Analyse architecte` sur une task isolée) |
| `bug-analyst` | Reproduit + diagnostique un bug (3 sous-stratégies : local / env / Figma diff). Poste `## Analyse du bug`. |

**Pipeline exécution** (invoqués par `/implement`) :
| Agent | Rôle |
|---|---|
| `code-dev` | Implémente un ticket end-to-end (Sonnet, ou Opus si label `complexe`). Lit le spec dans le body (Feature) ou le commentaire d'analyse (Task / Bug). Pour les tickets UI, **construit** fidèle au Figma (lecture structurelle) ; la **vérification** est faite indépendamment par le gate `design-validator` (step 9a-bis). Écrit **ses** tests vitest (TU + intégration) dans la foulée de l'implémentation, et trie chaque test rouge entre régression et évolution légitime (étape 5b, event `TEST_TRIAGE`) ; **n'écrit aucun test E2E** (c'est `e2e-dev`). |
| `e2e-dev` | Écrit/maintient **tous** les tests E2E Playwright (`src/e2e/**`) en **fin de pipeline** : pour une Feature après que les sous-tickets sont squash-mergés dans `epic/<N>` (via `run_e2e_dev.sh`, **gate bloquante avant** doc-writer + PR finale) ; pour une Task/Bug après le `validated` de `code-dev` (via `/implement`). Toujours Opus. Lance la suite E2E (triage régression vs évolution légitime), puis décide d'**imbriquer** la nouvelle fonctionnalité dans un scénario global existant ou d'en créer un nouveau (et juge la **criticité** pour les bugs). Sur **vraie régression** : handback **bloquant** → routé vers `architect-rework`. Ne touche jamais au code source. |
| `architect-rework` | Transforme un besoin de rework de fin d'epic en **tickets Task de fix** (sous-issues To Do, modèle `architect` epic-enrich) que l'orchestrateur reprocesse — ou, sur **doute fonctionnel**, pose la question. Toujours Opus. Deux sources : (1) **régression E2E** détectée par `e2e-dev` (lit le commentaire `e2e-dev:`, escalade via `dispatch=escalate`) ; (2) **demande de changement utilisateur** à la gate d'acceptation de fin de pipeline (lit le feedback ; sur doute, la question est relayée par `/implement`). N'écrit ni code ni test. |
| `functional-validator` | Rejoue les scénarios PO dans le dev server |
| `design-validator` | **Gate de fidélité visuelle indépendant** (step 9a-bis, tickets UI). Rend l'écran et le compare au node Figma du ticket — mesure DOM (`getBoundingClientRect`/`getComputedStyle` vs `itemSpacing`/`fontSize`/`fontWeight`/`fill`) + overlay onion-skin + vision, sur ≥2 viewports. Verdict `PASS`/`RETRY`/`REFACTO` sur le ticket (max 2 RETRY). Sonnet, read-only. Backing : `packages/app/scripts/visual-fidelity-probe.mjs`. |
| `doc-writer` | Régénère `docs/*.md` from scratch à partir de l'état courant du code. Invoqué par `epic_loop.sh` en fin d'epic (**après** la gate E2E verte, avant `open_epic_final_pr.sh`) ou par le skill `/doc` (humain). Sonnet, sans worktree dédié — opère sur la branche courante. |

**Pipeline review** (invoqué par `/review`) :
| Agent | Rôle |
|---|---|
| `review-fixer` | Adresse les commentaires de revue (humain + bots) sur une ou plusieurs PRs. Lit les unresolved comments, applique les fixes, push, prépare les replies (gate utilisateur explicite avant de poster). Tourne en worktree dédié, comme `code-dev`. |

**Quality gates** (read-only, appelés par `code-dev` ou hors pipeline) :
| Agent | Rôle |
|---|---|
| `validator` | Typecheck + test + lint + format (parallel) |
| `structural-auditor` | greps mécaniques, fuites de la couche domaine, checks qui demandent de lire le code (forms, schemas, transactions, ownership, commentaires) |
| `rgaa-auditor` | Lance le skill ultra11y `review-a11y` sur le code modifié et rend son verdict (plugin déclaré dans `.claude/settings.json`) |
| `security-auditor` | OWASP Top 10 + RGS security review |

### Skills (`.claude/skills/`)

| Skill | Purpose |
|---|---|
| `/analyse [<issue#>] [<description>]` | **Phase conception**. Détecte le mode (epic / task / bug) selon le type d'issue ou le prompt et invoque les agents appropriés (PO + architect, architect-task, ou bug-analyst). Si ambigu → demande à l'utilisateur. |
| `/implement <issue#>` | **Phase exécution**. Détecte le mode selon le type d'issue : Feature → loop driver background ; Task / Bug → `code-dev` synchrone foreground. Vérifie qu'une analyse a été faite avant de dispatcher (sinon propose `/analyse`). |
| `/report [<N> ...]` | Dashboard live des agents actifs + état des sous-tickets de l'epic. Pure bash, zéro LLM. |
| `/velocity [<sprint>]` | Calcule la vélocité des sprints terminés (Σ points des feuilles livrées : Done ∪ In review) et recommande la capacité du prochain sprint (moyenne glissante 3 sprints). À lancer en fin de sprint. Thin wrapper bash sur `sprint_velocity.sh`. |
| `/plan-sprint [<sprint>]` | Planifie le prochain sprint : capacité (vélocité glissante), report des non-livrés du sprint courant, complétion depuis le backlog par priorité jusqu'à la capacité. Présente le plan → validation explicite → assigne les tickets au sprint. Ne crée pas l'itération (limite API GitHub → clic UI). Backing : `plan_sprint.sh`. |
| `/open <PR>` | Recrée un worktree local pour une PR (typique après auto-cleanup de `/implement`) — utile pour tester la PR avant merge. |
| `/review [<issue#>\|<PR#>]` | Adresse les commentaires de revue (humain + bots). Détecte le mode (epic / task / bug) selon le type d'issue ; en mode epic, traite toutes les sub-task PRs liées à la feature et applique les fixes sur `epic/<N>`. Délègue à l'agent `review-fixer` qui tourne en worktree. |
| `/doc [<issue#>]` | Régénère `docs/features.md` / `architecture.md` / `parcours-utilisateurs.md` à partir de l'état courant du code. Sans arg : commit local sur la branche courante (l'humain push). Avec `<issue#>` (epic ou task) : se positionne sur la branche cible, commit + push. Délègue à l'agent `doc-writer`. Hors pipeline / en complément de l'invocation auto par `epic_loop.sh`. |

Workflow standard : `/analyse <issue>` pour la conception (modes auto-détectés), puis `/implement <issue>` pour l'exécution. Le ticket reste en `In progress` même quand l'IA a fini — c'est l'utilisateur qui le bouge à `In review` puis `Done` à son rythme. `/review` prend le relais quand les humains commentent les PR. `/doc` régénère la doc utilisateur depuis le code (auto en fin d'epic, manuel hors pipeline).

### Orchestration (`scripts/orchestration/`)

Tous les scripts shell portent leur propre header `--help`-friendly. Le mode epic de `/implement` est entièrement bash :

| Script | Rôle |
|---|---|
| `epic_loop.sh` | Loop driver background. Tick = cleanup terminal worktrees → rebase epic branches → plan → spawn N `claude` CLIs en parallèle (budget USD isolé) → aggregate JSON returns → process. Plafond `EPIC_LOOP_MAX_TICKS=30`. Quand tous les sous-tickets d'un epic sont squash-mergés, exécute la **gate E2E bloquante** (`run_e2e_dev.sh`) dans le loop : régression → `run_architect_rework.sh` crée des tickets de fix reprocessés (max `EPIC_E2E_MAX_ROUNDS`=3 rounds avant escalade). Une fois la gate verte, post-loop : `run_doc_writer.sh` puis `open_epic_final_pr.sh`. |
| `ensure_epic_branch.sh` | Idempotent. Crée la branche d'intégration `epic/<N>` depuis `origin/alpha` si absente. Appelé au startup d'`epic_loop.sh` pour chaque epic NEW-mode. |
| `merge_validated_ticket.sh` | Squash-merge la PR d'un ticket validé dans `epic/<N>` via `gh pr merge --squash`. Branche auto-supprimée par les settings repo. Sur conflit : commente la PR + remet le ticket en `In progress` (le pipeline redispatchera pour rebaser). |
| `rebase_epic_branch.sh` | Entre ticks, rebase `epic/<N>` sur `origin/alpha` dans un worktree dédié (`/tmp/egapro-rebase-epic<N>`). Force-with-lease push. Sur conflit : commente l'epic + label `dispatch=escalate` + exit 2 (halt orchestration). |
| `open_epic_final_pr.sh` | Ouvre (ou réutilise) la PR finale `epic/<N> → alpha` avec body listant chaque sub-ticket via `Closes #N`. Appelé en fin de loop pour la review humaine. |
| `run_doc_writer.sh` | Invoque l'agent `doc-writer` sur `epic/<N>` (depuis le main worktree, pas de worktree dédié). Régénère `docs/*.md` from scratch et commit + push. Best-effort : un échec/rate-limit ne bloque pas l'ouverture de la PR finale. Budget Sonnet par défaut $5 (`EPIC_LOOP_BUDGET_DOC`). |
| `run_e2e_dev.sh` | **Gate E2E bloquante**, invoquée dans `epic_loop.sh` quand tous les sous-tickets sont mergés, **avant** `run_doc_writer.sh`. Provisionne un **worktree dédié + stack docker** (détaché sur `origin/epic/<N>`, index `E2E_WORKTREE_INDEX`) car l'E2E exige un dev server + DB ; l'agent `e2e-dev` (Opus) lance la suite E2E, imbrique/crée le scénario, push sur `epic/<N>`, puis teardown. Exit 0 = gate verte ; **exit 3 = régression** → le loop route vers `run_architect_rework.sh` (la PR finale **n'est pas** ouverte). Budget Opus par défaut $15 (`EPIC_LOOP_BUDGET_E2E`). |
| `run_architect_rework.sh` | Invoque l'agent `architect-rework` (Opus) sur `epic/<N>` (main worktree, pas de stack). **Deux modes** : sans 2ᵉ arg = `e2e-regression` (gate E2E rouge, lit le commentaire `e2e-dev:`) ; avec un 2ᵉ arg texte = `user-feedback` (demande de changement de l'utilisateur à la gate d'acceptation). Crée des tickets Task de fix (To Do, reprocessés par le loop) ou retourne `needs_user`. Exit 0 = tickets créés, 2 = needs_user, 3 = rate_limited, 1 = échec. Budget Opus par défaut $10 (`EPIC_LOOP_BUDGET_REWORK`). |
| `cleanup_terminal_worktrees.sh` | Scan les worktrees `egapro-epic<E>-t<N>` ; teardown + remove ceux dont le ticket a été squash-mergé dans `epic/<N>` (signal canonique : la branche `ticket/<N>-*` est gone d'origin). Appelé à chaque tick par `epic_loop.sh` pour libérer les slots dynamiquement. |
| `dispatch_plan.sh` | Calcule la JSON list des tickets dispatchables : parse `## Depends on`, gate les enfants dont le parent n'est pas encore squash-mergé dans `epic/<N>` (= sa branche n'existe plus sur origin), alloue les indices libres dans `[0, EPIC_MAX_PARALLEL[`. Base = `origin/epic/<N>` toujours. |
| `process_tick_result.sh` | Applique les mutations board selon le statut JSON retourné par `code-dev`. Sur `validated` (NEW mode) → invoke `merge_validated_ticket.sh`. Compteur `attempt=N` pour anti-boucle 3 refacto consécutifs → `dispatch=escalate`. |
| `set_ticket_status.sh` | Encapsule les 3 GraphQL calls de `board.md`. **Refuse explicitement la transition `Done`** (user-only). |
| `set_ticket_size.sh` | Écrit la complexité t-shirt (`Size` XS→XL) **et** les points (`Estimate`, Fibonacci) d'un ticket en une commande. Appelé par `architect` / `bug-analyst` en fin d'analyse. Rubrique : `complexity-estimation.md`. |
| `sprint_velocity.sh` | Calcule la vélocité par sprint (Σ `Estimate` des feuilles Done∪In review, epic exclu) + reco glissante 3 sprints. Pure bash + `gh` + `jq`, read-only. Backing du skill `/velocity`. |
| `plan_sprint.sh` | Planifie le prochain sprint : capacité glissante, report des non-livrés, fill backlog par priorité (petits d'abord) sans dépasser la capacité. Mode plan (read-only) par défaut, `--apply` pour assigner. Ne crée pas l'itération (l'API régénère les `iterationId` → exit 4 + instruction UI). Backing du skill `/plan-sprint`. |
| `create_linked_branch.sh` | Crée une branche linkée à l'issue via `createLinkedBranch` GraphQL — la branche apparaît dans la sidebar Development de l'issue. Base = `epic/<N>` en NEW mode. |
| `wait_for_bot_reviews.sh` | Attend que la rafale de commentaires des bots de review soit terminée sur une PR (premier commentaire plafonné à 15 min, puis debounce 2 min sur un compte stable) et rend le nombre de threads postés depuis le dernier push. Appelé par `code-dev` étape 9d.1. |
| `check_review_replies.sh` | Liste les threads de review postés après le dernier push qui n'ont pas reçu de réponse de l'auteur de la PR (exit 2 + `comment_id` par ligne). Appelé par `code-dev` étape 9d.2bis. |
| `force_pr_issue_link.sh` | Appelé par `code-dev` juste après `gh pr create` pour forcer le `closingIssuesReferences` à se peupler (sinon, l'auto-linker GitHub ne fire que quand la PR cible `master`). Workaround : flip la base sur `master`, sleep 3, revenir sur la base d'origine. Idempotent. ~2 CI runs supplémentaires par appel. |
| `open_worktree.sh` | Recrée un worktree pour une PR donnée (skill `/open <PR>`). Utile pour tester localement après auto-cleanup. |
| `cache_gh.sh` | TTL wrapper sur `gh` pour amortir les rate limits (clé `epic_<N>_full` partagée entre `dispatch_plan` et `epic_state`, TTL 300s). |
| `log_event.sh` | Logging append-only par agent, rolling 50 lignes, sous `.claude/state/epic_run/agents/`. |
| `epic_state.sh` | Tableau compact des sous-tickets d'un epic (status board + last log event + retries + PR liée). |
| `render_dashboard.sh` | Dashboard `/report` agents actifs, triés par inactivité, avec alertes >10min. |

**Modèle de branche d'intégration** : chaque epic a sa branche `epic/<N>` créée depuis `alpha` au startup d'`epic_loop.sh`. Toutes les PRs des sous-tickets ciblent `epic/<N>`. Une fois validée par toute la pipeline (CI + Sonar + validators IA + bots), `process_tick_result.sh` squash-merge la PR dans `epic/<N>` (le ticket reste en `In progress` côté board — `In review` est user-only). Les tickets enfants (qui dépendent d'un parent) ne démarrent qu'une fois leur parent squash-mergé (signal canonique : la branche `ticket/<parent>-*` n'existe plus sur origin, le board status est décoratif). Entre ticks, `epic/<N>` est rebasée sur `origin/alpha` pour rester fraîche. Une fois **tous** les sous-tickets squash-mergés, la pipeline passe la **gate E2E bloquante** : l'agent **`e2e-dev`** (`run_e2e_dev.sh`) rejoue la suite E2E sur `epic/<N>` et ajoute la couverture de la feature complète. Sur **régression**, l'agent **`architect-rework`** (`run_architect_rework.sh`) crée des tickets Task de fix (que le loop reprocesse) ou escalade vers l'utilisateur sur un doute fonctionnel — la PR finale **n'est pas** ouverte tant que la gate n'est pas verte (plafond `EPIC_E2E_MAX_ROUNDS` rounds avant escalade humaine). Gate verte → la doc est régénérée (`run_doc_writer.sh`), puis une PR unique `epic/<N> → alpha` est ouverte. À l'ouverture de cette PR, le skill `/implement` (foreground) déclenche la **gate d'acceptation utilisateur** : il invite l'utilisateur à **tester l'implémentation** (review app / `/open <PR>`). Si l'utilisateur **demande des changements**, ils sont routés vers `architect-rework` (mode `user-feedback`, exactement comme un renvoi depuis `e2e-dev`) qui crée des tickets de fix ; l'orchestrateur est relancé (les tickets sont implémentés → la gate E2E re-tourne → doc → PR mise à jour → nouvelle invitation à tester). La boucle se ferme quand l'utilisateur valide — c'est lui qui passe alors le ticket à `In review`/`Done` et merge la PR.

**Note migration** : les epics créés avant l'introduction de ce modèle (mode legacy historique : stacked PRs, base `alpha`, pas d'auto-merge) ne sont **pas** repris par la pipeline actuelle — l'utilisateur les gère à la main jusqu'à clôture.

Les sub-agents `code-dev` retournent un **JSON strict** en dernier message (`validated` / `needs_opus_escalation` / `refacto` / `rate_limited` / `failed`) — voir `.claude/agents/code-dev/AGENT.md`. Le bash loop parse ce JSON via `jq`, aucun LLM n'intervient dans la chaîne de décision post-verdict.

---

## Qui écrit quoi, et quand

`code-dev` écrit ses **tests vitest** (TU + intégration) dans la foulée du code, mais **aucun E2E**. Le cloisonnement qui compte n'est plus « un autre agent écrit les tests » — il est ailleurs, et il tient en deux points : `structural-auditor`, read-only et indépendant, vérifie au diff qu'aucun test n'a été **affaibli** pour passer ; et la décision de triage sur chaque test rouge est **écrite** (`TEST_TRIAGE`) plutôt que dissoute dans un tour de boucle. Un agent qui écrit la source et possède les tests a toujours le chemin facile disponible ; ce qui le ferme, c'est un tiers qui regarde le diff et une trace qu'on peut relire.

| Agent | Écrit | Quand | Sur régression |
|---|---|---|---|
| `code-dev` | le code source, ses tests vitest, la PR | étapes 1–10 du ticket | triage écrit en `TEST_TRIAGE` ; il corrige la source, jamais le test |
| les 4 auditors | rien (read-only) | étape 6, en parallèle | findings → `code-dev` corrige |
| `functional-validator`, `design-validator` | rien (read-only) | étape 9a / 9a-bis, sur le dev server | `RETRY` ×2 → `REFACTO` → ticket en To Do |
| `e2e-dev` (Opus) | les tests Playwright `src/e2e/**` | **fin de pipeline** | commentaire `e2e-dev:` → `architect-rework` |
| `architect-rework` (Opus) | des tickets Task de fix | sur régression E2E, ou sur demande de l'utilisateur à la gate d'acceptation | — |

**La gate E2E est bloquante.** Pour une Feature, `e2e-dev` tourne une fois tous les sous-tickets squash-mergés dans `epic/<N>` (`run_e2e_dev.sh`), **avant** doc-writer et la PR finale. Pour une Task/Bug, après le verdict `validated` de `code-dev`. L'E2E ne tourne pas dans la CI de la PR de sous-ticket : ce run local **est** la gate. Sur vraie régression, `architect-rework` crée des tickets de fix que le loop reprocesse — plafond `EPIC_E2E_MAX_ROUNDS` (3) avant escalade humaine, et la PR finale n'est pas ouverte tant que c'est rouge.

**La gate d'acceptation utilisateur** ferme la boucle : PR finale ouverte → `/implement` invite l'utilisateur à tester → s'il demande des changements, ils passent par `architect-rework` en mode `user-feedback`, exactement comme un renvoi d'`e2e-dev`. La boucle se ferme quand l'utilisateur valide.

**`code-dev` tourne comme agent principal**, jamais via l'outil Agent : il spawn lui-même les 4 gates et les deux validators navigateur, et un sous-agent ne peut pas spawner de sous-agents. D'où le lancement en process CLI — `epic_loop.sh` en mode epic, `claude --agent code-dev` synchrone en mode task/bug.
