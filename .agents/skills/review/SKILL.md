---
name: review
description: "Revue de code, deux modes. `gates` (défaut sans argument) : passe les contrôles qualité sur le diff courant — pnpm verify, puis les checklists structure, sécurité, accessibilité (ultra11y), fidélité Figma, fonctionnel — et rend un verdict, sans rien modifier. `pr` : traite les threads de revue non résolus d'une PR (humains + bots), corrige, pousse, prépare les réponses et les poste après validation. Usage: /review [gates] | /review <PR#|issue#>"
argument-hint: "[gates] [--subagents] | <PR#|issue#>"
---

# /review

Deux modes. Choisis-le à l'étape 0, puis suis **uniquement** la section du mode choisi.

| Argument | Mode |
|---|---|
| vide, ou `gates` | **gates** — revue du diff courant, lecture seule |
| numéro ou URL de PR / d'issue | **pr** — traiter les commentaires de revue |
| vide, mais la branche courante a une PR avec des threads non résolus | demander : « gates ou pr ? » |

`--subagents` (n'importe où dans l'argument, mode gates seulement) : retire-le avant de choisir le mode, puis lis [references/subagents.md](references/subagents.md). Sans lui, aucun sous-agent.

## Quand → lis

| Quand | Lis |
|---|---|
| un `.ts` / `.tsx` / un test est dans le diff | [references/structural.md](references/structural.md) |
| le diff touche `src/server/**`, `routers/`, tRPC, `src/app/api/**`, l'auth | [references/security.md](references/security.md) |
| un `.tsx` est dans le diff | [references/a11y.md](references/a11y.md) |
| un `.tsx` / `.scss` est dans le diff | [references/design-fidelity.md](references/design-fidelity.md) |
| le diff change le comportement de l'app (pas seulement tests, docs, config d'outillage) | [references/functional.md](references/functional.md) |
| mode **pr** | [references/pr-comments.md](references/pr-comments.md) |
| l'argument contient `--subagents` | [references/subagents.md](references/subagents.md) |
| une convention de code à vérifier | `../implement/references/conventions/` (index dans `AGENTS.md`) |

---

## Mode gates — revue du diff courant (lecture seule)

Tu **rapportes**, tu ne corriges pas. L'appelant (toi plus tard, ou le skill `implement`) corrige puis relance `/review gates`.

1. **Base et périmètre.**
   ```bash
   BASE="${VERIFY_BASE:-origin/alpha}"     # sur un sous-ticket d'epic : origin/epic/<N>
   git fetch -q origin "${BASE#origin/}"
   git diff --name-only "$(git merge-base HEAD "$BASE")" ; git diff --name-only HEAD ; git ls-files --others --exclude-standard
   ```
   Note la liste des fichiers modifiés. Diff vide → réponds `Rien à revoir` et **STOP**.

2. **La machine d'abord — toujours.**
   ```bash
   pnpm verify
   ```
   (patterns sur le diff, audit statique ultra11y de tout `src` — comme la gate CI —, lint, format, typecheck, tests.) Si ce code exact a déjà passé `pnpm verify` au vert (l'étape 5 de `/implement`), la commande répond aussitôt — lance-la quand même, c'est elle qui fait foi.
   **FAIL → STOP.** Rends le tableau avec `verify: FAIL` et les lignes d'erreur utiles. Les checklists ne servent à rien tant que la machine est rouge.
   Si un dev server tourne : appelle aussi `nextjs_call` (`get_errors`) du MCP `next-devtools`.

3. **Choisis les checklists** avec la table « Quand → lis ». Lis chaque référence retenue **en entier** avant de l'appliquer. Une checklist non pertinente est notée `skip — <raison>`, jamais omise.
   Avec `--subagents` seulement : délègue structure, sécurité et accessibilité selon [references/subagents.md](references/subagents.md) ; tu gardes fidélité Figma et fonctionnel.

   **Fidélité Figma et fonctionnel ont besoin de l'app qui tourne.** Pas de dev server → démarre-le en arrière-plan depuis la racine du worktree (`pnpm --filter app dev`, sur le port de `packages/app/.env.local` ; sans `.env.local` : `bash scripts/setup-worktree.sh <index libre>` d'abord). Impossible à démarrer → ces deux gates rendent `degraded` avec la raison. Jamais `skip` ni PASS faute de serveur.

4. **Applique chaque checklist** sur les fichiers du diff uniquement. Chaque constat = `[SÉVÉRITÉ] fichier:ligne — description → correctif`. Pas de `fichier:ligne` vérifiable = pas de constat. Le code préexistant hors diff : une ligne max en fin de rapport, hors verdict.

5. **Rends le rapport** — exactement ce gabarit :

   ```
   ## Review gates: PASS | NEEDS WORK

   Base: <BASE>  ·  Fichiers: <n>

   | Gate | Verdict | Constats |
   |---|---|---|
   | verify | PASS / FAIL | — |
   | structure | PASS / NEEDS WORK / MINOR / skip | <n> |
   | sécurité | SECURE / VULNERABLE / HARDENING NEEDED / skip | <n> |
   | accessibilité | PASS / NEEDS WORK / MINOR / skip | <n> (+ risques résiduels) |
   | fidélité Figma | PASS / RETRY / REFACTO / degraded / skip | <n> |
   | fonctionnel | PASS / RETRY / REFACTO / degraded / skip | <n> |

   ### Constats
   - [ERROR] path/file.tsx:42 — … → …

   ### Risques résiduels
   - …
   ```

   Verdict global **PASS** seulement si : `verify` PASS, aucune gate en NEEDS WORK / VULNERABLE / RETRY / REFACTO. Un `MINOR`, `HARDENING NEEDED` ou `degraded` n'empêche pas PASS mais se liste (`degraded` : avec ce qui n'a pas pu être vérifié).

**Interdits en mode gates** : modifier un fichier, relâcher un test pour le faire passer, déclarer conforme un critère d'accessibilité de rendu (contraste, focus, zoom) depuis la source.

---

## Mode pr — traiter les commentaires de revue

Lis d'abord [references/pr-comments.md](references/pr-comments.md) : il porte les commandes exactes.

1. **Résoudre la PR et la branche de travail** (pr-comments § 1) :
   - numéro de PR → cette PR ; numéro d'issue → son type décide :
     - `Task` / `Bug` → la PR ouverte liée ; branche = sa branche head ;
     - `Feature` (epic) → la PR finale `epic/<N> → alpha` + les PR des sous-tickets ; branche = `epic/<N>` ;
     - type absent → demander.
   Aucune PR trouvée → le dire et **STOP**.

2. **Worktree.** Un worktree sur la branche de travail (jamais une nouvelle branche), puis `bash scripts/setup-worktree.sh <index>` s'il manque `packages/app/.env.local` — `<index>` libre entre 0 et 9 : port `3001 + index` sans écoute (`lsof -iTCP:<port> -sTCP:LISTEN` vide) et pris par aucun autre worktree.

3. **Lire les threads NON RÉSOLUS** via GraphQL `reviewThreads` (pr-comments § 2), plus les commentaires de niveau PR. Zéro thread non résolu → `Rien à traiter` et **STOP**.

4. **Catégoriser chaque thread** : `fix` · `non pertinent` (à justifier) · `question` · `déjà adressé` (vérifié au diff) · `ambigu`.
   Au moins un `ambigu` → **pose la question à l'utilisateur et attends** avant de toucher au code.

5. **Corriger** les `fix`, en suivant `AGENTS.md`, `packages/app/AGENTS.md` et les conventions. Pas de commentaire ajouté dans le code. Si le comportement change : mets à jour les tests vitest ; si un parcours utilisateur est touché : mets à jour l'E2E selon `../implement/references/e2e.md`.

6. **Revue** : exécute le **mode gates** ci-dessus sur la branche. Pas PASS → corrige → relance, jusqu'au PASS.

7. **Push.** `git commit` signé (`fix(review): <résumé>`), `git push origin <branche>`. Jamais `--no-verify`, jamais `--no-gpg-sign`, jamais de force-push sans accord explicite de l'utilisateur.

8. **CI.** `gh pr checks <PR> --watch`. Tout doit finir `SUCCESS` / `SKIPPED` / `NEUTRAL`. Rouge → corriger, pousser, reboucler.

9. **Préparer les réponses — sans les poster.** Un brouillon par thread (gabarits en pr-comments § 3). Passe chaque brouillon au filtre anti-secret (pr-comments § 4). Présente **tous** les brouillons à l'utilisateur et **attends sa validation explicite**.

10. **Poster** les réponses validées (pr-comments § 5).

11. **Contrôle final** : chaque thread non résolu de l'étape 3 a une réponse de toi, ou est listé comme « en attente de décision utilisateur ». Aucun thread ignoré en silence.

12. **Rapport** :
    ```
    ## Review PR: DONE | NEEDS_USER | FAILED

    PR: #N1, #N2  ·  Branche: <branche>
    Threads: <total> — corrigés <a>, justifiés <b>, questions <c>, déjà adressés <d>, en attente <e>
    Commits: <sha…>  ·  CI: verte | rouge (<check>)
    ```
    Proposer ensuite : « Je surveille les nouveaux commentaires ? » — si oui, refaire depuis l'étape 3 plus tard.

**Interdits en mode pr** : changer le statut d'un ticket sur le board, merger, poster une réponse non validée, réécrire l'historique publié sans accord. Les réponses sont publiques : voir `AGENTS.md` § Hygiène git.
