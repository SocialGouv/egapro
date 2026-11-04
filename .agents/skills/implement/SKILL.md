---
name: implement
description: "Phase exécution. Implémente un ticket analysé de bout en bout : worktree + branche liée, code + tests vitest, pnpm verify, revue gates, E2E, PR draft, CI et bots. Feature → epic ticket par ticket (une session par sous-ticket pour paralléliser). Usage: /implement <issue#>"
argument-hint: "<issue#>"
---

# /implement

Tu implémentes **un** ticket déjà analysé, jusqu'à une PR prête. Suis les étapes **dans l'ordre**, sans en sauter. Chaque **STOP** veut dire : arrête-toi, écris pourquoi, rends la main.

**Permission** : invoquer `/implement` autorise à committer et pousser sur la branche du ticket sans redemander. Toujours signé, jamais `--no-verify` ni `--no-gpg-sign`, aucune attribution IA, aucun secret (`AGENTS.md` § Hygiène git).

## Quand → lis

| Quand | Lis |
|---|---|
| au premier ticket de la session | [`references/workflow.md`](references/workflow.md) — en entier |
| l'issue est une `Feature` | [`references/epic.md`](references/epic.md) — et suis-le à la place de ce fichier |
| l'issue est un `Bug` | [`references/bug-fix.md`](references/bug-fix.md) |
| tu touches un `.ts` / `.tsx` | [`conventions/code-quality.md`](references/conventions/code-quality.md) |
| tu touches un `.tsx` | [`conventions/react-components.md`](references/conventions/react-components.md) |
| tu touches un `.tsx` / `.scss` | [`conventions/styling-dsfr.md`](references/conventions/styling-dsfr.md) |
| le ticket a une `## Référence Figma` | [`conventions/figma.md`](references/conventions/figma.md) |
| `src/server/api/**` | [`conventions/trpc-api.md`](references/conventions/trpc-api.md) |
| `src/server/**` (DB, transactions) | [`conventions/database-drizzle.md`](references/conventions/database-drizzle.md) |
| mutation, query sensible, route handler, auth | [`conventions/audit-logging.md`](references/conventions/audit-logging.md) |
| parcours de déclaration, Mon espace, `src/server/rules/**` | [`conventions/demarche-state-machine.md`](references/conventions/demarche-state-machine.md) |
| tu écris un test vitest | [`conventions/testing.md`](references/conventions/testing.md) |
| étape E2E | [`references/e2e.md`](references/e2e.md) |
| tu bouges le board | [`board.md`](../analyze/references/board.md) |

## Étapes

**0. Lire l'issue.** `$ARGUMENTS` = un numéro (`123`, `#123` ou URL). Vide → demande lequel.
```bash
gh issue view <N> --json number,title,body,state,issueType,labels,comments
gh api graphql -f query='{ repository(owner:"SocialGouv",name:"egapro"){ issue(number:<N>){ parent{ number issueType{name} } } } }'
```
- `state != OPEN` → demande confirmation avant de continuer.
- `issueType = Feature` → **lis [`references/epic.md`](references/epic.md) et suis-le**. Fin de ce fichier pour toi.
- **Base** : parent de type `Feature` → `origin/epic/<parent>` ; sinon → `origin/alpha`.

**1. Vérifier l'analyse.** Le spec doit exister :

| Cas | Spec attendu |
|---|---|
| sous-issue d'un epic | le body, au format [`ticket-spec-format.md`](../analyze/references/ticket-spec-format.md) |
| `Task` | un commentaire qui commence par `## Analyse architecte` |
| `Bug` | un commentaire qui commence par `## Analyse du bug` |

Absent → **STOP** : « Aucune analyse sur #<N>. Lance `/analyze <N>` d'abord. »

**2. Branche + worktree.** Sous-ticket : `bash scripts/orchestration/ensure_epic_branch.sh <parent>` d'abord (idempotent) — sans `epic/<parent>` sur origin, `create_linked_branch.sh` échoue.
```bash
git fetch origin
BRANCH=$(bash scripts/orchestration/create_linked_branch.sh <N> <base>)
git fetch origin "$BRANCH"
git worktree add --track -b "$BRANCH" "../egapro-<N>" "origin/$BRANCH"   # branche déjà locale : git worktree add ../egapro-<N> "$BRANCH"
cd ../egapro-<N>
```
Choisis un **index libre** `i` entre 0 et 9 : le port `3001 + i` ne doit pas écouter (`lsof -iTCP:<port> -sTCP:LISTEN` vide) et aucun autre worktree ne doit l'utiliser. Puis, depuis la racine du worktree :
```bash
bash scripts/setup-worktree.sh <i> [<services de "## Requires services">]   # stack docker + .env.local + pnpm install + migrations
```
Ensuite, **toutes** les commandes se lancent depuis ce worktree.

**3. Board** : `bash scripts/orchestration/set_ticket_status.sh <N> "In progress"`.

**4. Coder + tests vitest.** Relis le spec (body + tous les commentaires). Ouvre les conventions de la table ci-dessus **avant** d'écrire. Les tests TU (+ intégration si DB-layer) s'écrivent **pendant**, pas après — règles et triage d'un test rouge : [`workflow.md`](references/workflow.md) § Tests. Bug : exécute la vérification one-shot et le revert-verify ([`bug-fix.md`](references/bug-fix.md)).

**5. `pnpm verify`** (racine du worktree) — `scripts/quality/check-patterns.sh` sur le diff depuis `VERIFY_BASE` (défaut `origin/alpha`), audit statique ultra11y de tout `src`, lint, format, typecheck, tests. Pour un sous-ticket : `VERIFY_BASE=origin/epic/<parent> pnpm verify`.
- Rouge → corrige **la cause**, relance. Boucle jusqu'au vert. `format` / `lint` rouges : `pnpm check:write` (dans `packages/app`) corrige d'un coup.
- Interdit : `--no-verify`, `biome-ignore`, `@ts-ignore`, `.skip`, assertion supprimée ou relâchée.

**6. Revue `gates`.** Exécute le skill review en mode gates ([`../review/SKILL.md`](../review/SKILL.md)) sur ton diff. Chaque checklist en `NEEDS WORK` → corrige → repasse `pnpm verify` → relance la revue. Continue jusqu'à **PASS sur toutes les checklists applicables**. Si ton outil sait lancer des tâches en parallèle, les checklists peuvent tourner en parallèle.

**7. Commit + push.** Messages conventionnels : `feat(<scope>): … (#<N>)`, `fix(<scope>): … (#<N>)`, `test(<scope>): …`. Puis `git push -u origin HEAD`.

**8. E2E.** Suis [`references/e2e.md`](references/e2e.md) avec la même base : décider `nested` / `new` / `none`, `grille_scope.sh`, jouer ce qui doit l'être, trier, couvrir. Une **régression** → retour à l'étape 4 (corrige la source, jamais le test).

**9. PR draft.**
```bash
gh pr create --draft --base <alpha|epic/<parent>> --title "<type>(<scope>): #<N> — <résumé>" --body-file /tmp/pr-<N>.md
bash scripts/orchestration/force_pr_issue_link.sh <PR>
```
Body : `Closes #<N>` en **première ligne**, puis résumé, « Hypothèses à valider » (toute hypothèse métier faite en route, sinon « aucune »), plan de test, « Tests » (triage), « E2E » (mode + justification), « Vérification » (bug : avant / après), screenshots desktop + mobile si UI (donnée seedée uniquement).

**10. CI, Sonar, bots** — [`workflow.md`](references/workflow.md) § CI : tous les checks conclus et verts (critère jq), Sonar Quality Gate passé, **un** cycle `wait_for_bot_reviews.sh` → chaque thread corrigé ou répondu → `check_review_replies.sh` en exit 0. Même axe rouge 3 fois → **STOP** (§ Bloqué).

**11. Prête.** `gh pr ready <PR>`, puis revérifie que tous les checks sont verts. Le ticket **reste en `In progress`** : `In review` et `Done` sont à l'humain.

Sous-ticket d'epic : enchaîne sur l'étape 5 de [`epic.md`](references/epic.md) (squash-merge dans `epic/<parent>`).

## Rapport final

```
## Implement: PASS | BLOQUÉ | STOP

Ticket : #<N> (<Task|Bug|sous-ticket de #<P>>)
Branche : <branch> → base <alpha|epic/<P>>
PR : #<PR> (ready | draft)
Verify : vert | <ce qui reste rouge>
Revue gates : PASS | <checklists en NEEDS WORK>
E2E : <nested|new|none> — grille <played|skipped>
CI / Sonar / bots : vert | <détail>
Worktree : ../egapro-<N> (index <i>) — à nettoyer après merge : bash scripts/teardown-worktree.sh puis git worktree remove

Next : relecture humaine de la PR ; commentaires → /review <PR>
```

## Interdits

- Improviser un spec absent, ou sortir du sujet du ticket.
- Trancher seul une question métier que le spec ne règle pas (seuil, calcul, obligation, parcours, libellé juridique) : **STOP**, commente l'issue avec la question et les options (`AGENTS.md` § Décisions métier).
- Merger vers `alpha`, passer un ticket en `In review` / `Done`.
- Contourner un garde-fou (hook git, `check-patterns.sh`, ultra11y, CI) : s'il bloque, c'est le code qui change.
- Affaiblir un test pour le faire passer.
