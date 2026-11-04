# Implémenter un ticket — le détail

> Le *quoi faire* est dans [`../SKILL.md`](../SKILL.md). Ce fichier porte le *comment bien le faire* : les pièges, les preuves dues, les conventions de PR. Lis-le en entier au premier ticket d'une session.

## Où est le spec

| Type d'issue | Spec |
|---|---|
| Sous-issue d'un epic (Feature) | le **body**, au format [`ticket-spec-format.md`](../../analyze/references/ticket-spec-format.md) |
| Task | le **dernier** commentaire `## Analyse architecte` (le body = la demande originale, intacte) |
| Bug | le **dernier** commentaire `## Analyse du bug` (root cause + vérification one-shot à exécuter) |

Spec absent ou non conforme → **STOP**. Commente le ticket en listant les manques, ne bouge pas le board, propose `/analyze <N>`. **Ne jamais improviser un spec.**

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

Selon [`conventions/testing.md`](conventions/testing.md) :

- nominal + cas d'erreur + edge cases ; **100 % de couverture** sur les fichiers de logique créés ou modifiés ;
- mocks centralisés de `src/test/setup.ts`, **jamais redupliqués** ;
- `__tests__/` à côté du module testé, jamais dans `src/app/` ;
- tester le comportement observable, pas l'implémentation ;
- `*.integration.test.ts` (`pnpm test:integration`, Docker) **dès que** le diff touche le DB-layer ou du SQL non trivial : les TU mockent le driver et ratent ses bugs.

### Triage d'un test rouge — décision écrite

Pour **chaque** test en échec, tranche explicitement et note-le (message de commit ou body de PR, section « Tests ») :

- **Régression non souhaitée** — ton code casse un comportement qui devait rester. → **Corrige la source, jamais le test.**
- **Évolution légitime** — le test assertait l'ancien comportement que le ticket change volontairement. → Mets l'assertion à jour.

Méthode : croise l'assertion qui casse, la section `## Scénarios de test` du spec et ton diff. **Dans le doute → régression.** Ne **jamais** retirer une assertion, ajouter `.skip` / `.todo` / `.only`, ni relâcher une attente : la revue `gates` le vérifie au diff et c'est un échec bloquant.

## Bug : deux preuves dues

Détail → [`bug-fix.md`](bug-fix.md). En bref :

1. **Vérification one-shot** (toujours) : exécute la procédure « Vérification du correctif (one-shot) » de l'analyse, relève la valeur **avant** (base, sans fix) et **après**. Consigne `<ce qui a été fait>` → `<avant>` / `<après>` dans le body de PR, section « Vérification ». Procédure absente ou inexécutable → écris-le explicitement, ne l'invente pas.
2. **Revert-verify** du test de non-régression :
   ```bash
   git diff <base> -- <fichiers-source> > /tmp/fix.patch
   git apply -R /tmp/fix.patch && pnpm --filter app test <le-test>   # doit être RED
   git apply /tmp/fix.patch    && pnpm --filter app test <le-test>   # doit être GREEN
   ```
   Vert sans le fix → le test ne reproduit pas le bug : retravaille-le.

## UI : construire fidèle au Figma

La **vérification** est faite en revue (`/review gates`, checklist [`design-fidelity.md`](../../review/references/design-fidelity.md)) — tu ne te notes pas toi-même. Ta part, c'est la **construction** selon [`conventions/figma.md`](conventions/figma.md) :

- pour chaque URL de la section `## Référence Figma`, `get_design_context` (code de référence + tokens + screenshot) ; `get_metadata` pour cartographier un gros frame, `get_variable_defs` pour les tokens par nom ;
- le code renvoyé est du React + Tailwind à **traduire** en DSFR, jamais à coller : token → classe ou `var(--…)` DSFR, `fontSize` → `fr-text--xs/sm/lg/xl`, `fontWeight ≥ 600` → `<strong>`, `itemSpacing` → `fr-m{b,t,r,l}-Xw` ;
- `get_screenshot` en spot-check quand la structure est ambiguë (gras cellule par cellule dans un tableau : l'API ne rend que le style dominant d'un node).

Ticket UI sans `## Référence Figma` → signale-le sur le ticket ; la revue rendra la fidélité « non vérifiable », jamais PASS silencieux.

## PR

- **Une branche = un ticket = une PR.** Pas de bundle.
- `gh pr create --draft --base <base>` où `<base>` = `alpha` (Task/Bug standalone) ou `epic/<N>` (sous-ticket).
- Body : **`Closes #<N>` en première ligne** (sinon `force_pr_issue_link.sh` échoue), puis résumé, plan de test, section « Tests » (triage), section « Vérification » (bugs), screenshots.
- **Screenshots obligatoires** pour toute modif UI (desktop + mobile), pris sur le dev server du worktree avec de la **donnée seedée fictive uniquement** — vérifie l'écran avant capture (dépôt public, voir `AGENTS.md` § Hygiène git).
- Juste après `gh pr create` : `bash scripts/orchestration/force_pr_issue_link.sh <PR>` (une seule fois — chaque flip de base relance ~2 runs CI). Sur une base `epic/<N>`, `Closes #N` ne ferme le ticket qu'au merge de la PR finale `epic/<N> → alpha`.

## CI, Sonar, bots

1. `gh pr checks <PR> --watch`. Un check rouge → `gh run view <run-id> --log-failed`, corrige, push, re-watch.
2. **Attends que TOUS les checks aient conclu** (le déploiement de review app finit après build/lint/tests) :
   ```bash
   gh pr view <PR> --json statusCheckRollup --jq \
     '[.statusCheckRollup[]? | select(.name) | .conclusion] | (length > 0) and (all(. == "SUCCESS" or . == "SKIPPED" or . == "NEUTRAL"))'
   ```
   Doit répondre `true`. Une conclusion vide = check encore en cours → attends.
3. **SonarCloud** : si `sonarcloud[bot]` dit `Quality Gate: Failed`, lis ses issues (bugs, vulnérabilités, hotspots, duplications, couverture), corrige, push.
4. **Un seul cycle de bots**, une fois tout vert :
   ```bash
   COMMENTS=$(timeout 1500 bash scripts/orchestration/wait_for_bot_reviews.sh <PR> < /dev/null)
   ```
   `0` → fini. Sinon lis tout (`gh pr view <PR> --comments`, `gh api repos/SocialGouv/egapro/pulls/<PR>/comments`), et pour **chaque** thread : corrige et réponds, ou réponds avec la justification (faux positif, hors scope). Jamais d'ignorance silencieuse.
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
