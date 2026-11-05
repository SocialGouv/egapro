# Implémenter un ticket — le détail

> Le *quoi faire* est dans [`../SKILL.md`](../SKILL.md). Ce fichier porte le *comment bien le faire* : les pièges, les preuves dues, les conventions de PR. Lis-le en entier au premier ticket d'une session.

## Où est le spec

Table : étape 1 du [`SKILL.md`](../SKILL.md). Task ou Bug : c'est le **dernier** commentaire d'analyse qui fait foi (le body reste la demande originale, intacte). Spec absent ou non conforme → **STOP** : commente le ticket en listant les manques, ne bouge pas le board, propose `/analyze <N>`. **Ne jamais improviser un spec.**

La liste « Fichiers impactés » du spec est un **point de départ**, pas un périmètre fermé : si tu découvres d'autres fichiers nécessaires, touche-les — mais tout ce qui sort du sujet du ticket (refacto opportuniste, fix voisin) va dans un autre ticket.

## Discipline non-interactive (bloquante)

Une commande qui attend une réponse sur un TTY peut bloquer indéfiniment (vu : `pnpm db:generate` bloqué 1 h parce que drizzle-kit posait une question).

1. Toute commande potentiellement interactive reçoit `< /dev/null` : `pnpm db:generate < /dev/null`.
2. **Jamais** `script -q -c '…'` pour capturer une sortie : il crée un pseudo-TTY. Utilise `2>&1 | tee /tmp/log` ou `2>&1 | tail -50`.
3. Une commande longue (> 30 s : migrate, install, build) est bornée : `timeout 180 pnpm db:migrate < /dev/null`. Timeout atteint → tu le dis sur le ticket, tu ne relances pas en boucle.

## Implémenter

- Les conventions vivent dans [`conventions/`](conventions/) — ouvre celles de la table « Quand → lis » du SKILL **avant** d'écrire, pas après.
- `pnpm typecheck` après chaque modif de types ou de schémas. Si le dev server tourne, `nextjs_call(get_errors)` (MCP `next-devtools`) attrape ce que `tsc` ne voit pas.
- Ne jamais deviner de mémoire une API Next.js (`nextjs_docs`), une classe DSFR (MCP `dsfr`) ou une valeur Figma (MCP `figma`).

## Tests vitest — écrits pendant, pas après

Règles (couverture, mocks de `src/test/setup.ts`, emplacement, tests d'intégration dès que le DB-layer bouge) → [`conventions/testing.md`](conventions/testing.md).

### Triage d'un test rouge — décision écrite

Pour **chaque** test en échec, tranche explicitement et note-le (message de commit ou body de PR, section « Tests ») :

- **Régression non souhaitée** — ton code casse un comportement qui devait rester. → **Corrige la source, jamais le test.**
- **Évolution légitime** — le test assertait l'ancien comportement que le ticket change volontairement. → Mets l'assertion à jour.

Méthode : croise l'assertion qui casse, la section `## Scénarios de test` du spec et ton diff. **Dans le doute → régression.** Ne **jamais** retirer une assertion, ajouter `.skip` / `.todo` / `.only`, ni relâcher une attente : la revue `gates` le vérifie au diff et c'est un échec bloquant.

## Bug et UI

- **Bug** : deux preuves dues, vérification one-shot avant / après et revert-verify du test → [`bug-fix.md`](bug-fix.md).
- **UI** : construire selon [`conventions/figma.md`](conventions/figma.md) ; la fidélité est vérifiée en revue (`design-fidelity.md`), tu ne te notes pas toi-même. Ticket UI sans `## Référence Figma` → signale-le sur le ticket ; la revue rendra la fidélité « non vérifiable », jamais PASS silencieux.

## PR

- **Une branche = un ticket = une PR.** Pas de bundle.
- `gh pr create --draft --base <base>` où `<base>` = `alpha` (Task/Bug standalone) ou `epic/<N>` (sous-ticket).
- Body : gabarit de l'étape 9 du SKILL ; **`Closes #<N>` en première ligne**, sinon `force_pr_issue_link.sh` échoue.
- **Screenshots obligatoires** pour toute modif UI (desktop + mobile), pris sur le dev server du worktree avec de la **donnée seedée fictive uniquement** — vérifie l'écran avant capture (dépôt public, voir `AGENTS.md` § Hygiène git).
- Juste après `gh pr create` : `bash scripts/orchestration/force_pr_issue_link.sh <PR>` (une seule fois — chaque flip de base relance ~2 runs CI). Échec « Closes keyword missing » → `gh pr edit <PR> --body-file /tmp/pr-<N>.md` avec `Closes #<N>` en première ligne, puis relance le script. Sur une base `epic/<N>`, `Closes #N` ne ferme le ticket qu'au merge de la PR finale `epic/<N> → alpha`.

## CI, Sonar, bots

Substitue chaque `<PR>` par le numéro **avant** de lancer une commande : `<PR>` laissé tel quel est lu par le shell comme une redirection (`PR=1234` puis `"$PR"`).

1. `gh pr checks <PR> --watch`. Un check rouge → `gh run view <run-id> --log-failed`, corrige, push, re-watch.
2. **Attends que TOUS les checks aient conclu** (le déploiement de review app finit après build/lint/tests) :
   ```bash
   gh pr view <PR> --json statusCheckRollup --jq \
     '[.statusCheckRollup[]? | select(.name) | .conclusion] | (length > 0) and (all(. == "SUCCESS" or . == "SKIPPED" or . == "NEUTRAL"))'
   ```
   Doit répondre `true`. Une conclusion vide = check encore en cours → attends.
3. **SonarCloud** : si `sonarcloud[bot]` dit `Quality Gate: Failed`, lis ses issues (bugs, vulnérabilités, hotspots, duplications, couverture), corrige, push. Bloquants sans discussion : bugs, vulnérabilités, security hotspots non revus. Le bot n'a pas encore commenté → attends : pas de `gh pr ready` sans `Quality Gate: Passed` lu.
4. **Un seul cycle de bots**, une fois tout vert :
   ```bash
   COMMENTS=$(timeout 1500 bash scripts/orchestration/wait_for_bot_reviews.sh <PR> < /dev/null)
   ```
   `0` → fini. Sinon lis tout (`gh pr view <PR> --comments`, `gh api repos/SocialGouv/egapro/pulls/<PR>/reviews`, `gh api repos/SocialGouv/egapro/pulls/<PR>/comments`), et pour **chaque** thread : corrige et réponds, ou réponds avec la justification (faux positif, hors scope) — catégories (question, désaccord…) → [`pr-comments.md`](../../review/references/pr-comments.md). Jamais d'ignorance silencieuse. Si tu as poussé un correctif dans ce cycle : re-attends CI + Sonar verts (critère jq du point 2) avant d'aller plus loin.
5. Post-condition : `bash scripts/orchestration/check_review_replies.sh <PR> < /dev/null` doit sortir en 0. Réponse dans un thread : `gh api -X POST repos/SocialGouv/egapro/pulls/<PR>/comments -f in_reply_to=<comment_id> -f body='…'`.
6. **Une seule itération.** Les commentaires postés après ton push de correction relèvent de `/review <PR>`, pas de ce ticket — sinon tu boucles sur le re-spam des bots.
7. `gh pr ready <PR>`, puis re-vérifie le critère jq du point 2 (marquer ready relance certains workflows).

## Bloqué

Même axe en échec après **3 tentatives** (CI, revue, Sonar) : commit + push l'état courant, commente le ticket (`implement: bloqué` + axe, 3 tentatives, logs pertinents scrubbés), et rends la main à l'utilisateur. Si le blocage vient du spec (ticket mal découpé, hypothèse fausse), dis-le : la suite est `/analyze <N>`.

## Interdits

- `In review` et `Done` sont **réservés à l'humain** (`set_ticket_status.sh` les refuse). Ton terminus : PR ready, ticket en `In progress`.
- Pas de `gh pr merge` vers `alpha`. Seul le squash-merge d'un sous-ticket dans `epic/<N>` est permis ([`epic.md`](epic.md)).
- Pas de `--no-verify`, `--no-gpg-sign`, `-c commit.gpgsign=false`, `@ts-ignore`, ni CI sautée.
- Aucun secret, PII ou détail d'infra dans un commit, un body de PR, une réponse de thread.
