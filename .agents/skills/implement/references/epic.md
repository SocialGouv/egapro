# Implémenter un epic (Feature)

> Lu par [`../SKILL.md`](../SKILL.md) quand l'issue est de type `Feature`. Il n'y a **plus de démon** : un epic s'implémente ticket par ticket, chaque ticket avec le flux standard du SKILL. Le parallélisme, c'est **une session par sous-ticket** — l'utilisateur ouvre N terminaux (ou N worktrees) et lance `/implement <sous-ticket#>` dans chacun.

## Modèle de branches

```
alpha ──► epic/<N>   (branche d'intégration, une par epic)
            ▲  ▲  ▲
            │  │  └─ ticket/<T3>-…   PR → epic/<N>, squash-mergée quand verte
            │  └──── ticket/<T2>-…
            └─────── ticket/<T1>-…
epic/<N> ──► alpha    (PR finale, mergée par l'humain)
```

Toutes les PR de sous-ticket ciblent `epic/<N>`. La PR finale `epic/<N> → alpha` recopie `Closes #<T>` pour chaque sous-ticket.

## Déroulé

1. **Préconditions** — l'epic a des sous-issues **et** un commentaire `## Analyse PO` :
   ```bash
   gh api graphql -f query='{ repository(owner:"SocialGouv",name:"egapro"){ issue(number:<N>){ subIssues(first:50){ totalCount nodes{ number title state issueType{name} labels(first:20){nodes{name}} } } } } }'
   gh issue view <N> --json comments --jq '[.comments[] | select(.body | startswith("## Analyse PO"))] | length'
   ```
   `totalCount = 0` ou pas d'analyse PO → **STOP**, propose `/analyze <N>`.
2. **Branche d'intégration** (idempotent) : `bash scripts/orchestration/ensure_epic_branch.sh <N>`.
3. **Ordre** — lis le body de chaque sous-issue ouverte, section `## Depends on` (format → [`ticket-spec-format.md`](../../analyze/references/ticket-spec-format.md)). Un ticket est **prêt** quand toutes ses dépendances sont mergées dans `epic/<N>` (leur PR est `MERGED`). Ignore les tickets portant le label `dispatch=escalate` : ils attendent un humain.
4. **Présenter le plan** à l'utilisateur : la liste des tickets prêts maintenant, puis les vagues suivantes. Propose : « je traite <T1> ici ; pour paralléliser, ouvre une session par ticket prêt et lance `/implement <T>` ». Attends sa réponse avant de démarrer.
5. **Pour chaque ticket traité dans cette session** : flux standard du SKILL (étapes 1 à 11) avec **base = `origin/epic/<N>`**. Une fois la PR ready et tous les checks verts :
   ```bash
   bash scripts/orchestration/merge_validated_ticket.sh <PR> <N> <T>
   ```
   | Exit | Sens | Action |
   |---|---|---|
   | 0 | squash-mergé dans `epic/<N>` | ticket suivant |
   | 2 | conflit avec `epic/<N>` (le script a commenté et remis le ticket en To Do) | `git fetch origin && git rebase origin/epic/<N>`, résoudre, `git push --force-with-lease`, revérifier, relancer le script |
   | 3 | GitHub calcule encore la mergeabilité | attendre 30 s, relancer |
   | 1 | erreur dure (base ≠ `epic/<N>`, droits) | STOP, rapporter |
6. **Garder `epic/<N>` à jour** quand `alpha` a avancé (entre deux tickets, ou avant la PR finale) : `bash scripts/orchestration/rebase_epic_branch.sh <N>`. Exit 2 = conflit : le script a commenté l'epic et posé `dispatch=escalate` → **STOP**, rends la main à l'utilisateur.
7. **Quand tous les sous-tickets sont mergés** — E2E sur la feature complète :
   - worktree sur `epic/<N>` à jour des squash-merges : `git fetch origin`, `git worktree add ../egapro-epic-<N> epic/<N>`, puis dans le worktree `git pull --ff-only origin epic/<N>` (une branche `epic/<N>` locale d'une session précédente est en retard) ; `bash scripts/setup-worktree.sh <index-libre>` ;
   - déroulé de [`e2e.md`](e2e.md) avec **base = `origin/alpha`** (le diff = toute la feature) ;
   - régression → commentaire `implement: régression E2E` sur l'epic puis `/analyze <N> rework` ([`rework.md`](../../analyze/references/rework.md)) : il crée les tickets de fix, que l'on implémente comme les autres, puis on rejoue cette étape. Au **3ᵉ** tour rouge, stop et escalade à l'utilisateur.
   - vert → commit `test(e2e): …` poussé sur `epic/<N>`.
8. **PR finale** : `bash scripts/orchestration/open_epic_final_pr.sh <N>` (idempotent, imprime le numéro).
9. **Gate d'acceptation** : demande à l'utilisateur de tester la PR finale (review app ou worktree local). S'il demande des changements → `/analyze <N> rework` avec son retour, puis retour à l'étape 3 pour les nouveaux tickets. La boucle se ferme quand il valide ; **c'est lui qui merge** `epic/<N> → alpha`.

## Règles propres à l'epic

- Ne jamais pousser directement sur `epic/<N>`, sauf les commits E2E de l'étape 7 et le rebase du script.
- Un sous-ticket encore OPEN dont la PR a des commentaires non traités relève de `/review <PR>`, pas d'un nouvel `/implement`.
- Le ticket reste en `In progress` après le merge dans `epic/<N>` ; il se ferme au merge de la PR finale.
