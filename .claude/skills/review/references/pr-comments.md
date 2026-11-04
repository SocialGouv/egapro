# Référence — traiter les commentaires de revue d'une PR

Commandes exactes du mode `pr` de `/review`. Dépôt : `SocialGouv/egapro` (public — chaque réponse est indexée et mirrorée immédiatement).

## 1. Résoudre la PR et la branche de travail

```bash
ARG="${ARGUMENTS%% *}"; ID="${ARG#\#}"; ID="$(echo "$ID" | sed -E 's#.*/(issues|pull)/([0-9]+).*#\2#')"

# Est-ce une PR ?
gh pr view "$ID" --json number,headRefName,closingIssuesReferences 2>/dev/null
# Sinon c'est une issue : son type décide du mode
gh issue view "$ID" --json number,issueType,labels --jq '{number, type: .issueType.name}'
```

| Cas | PR(s) en scope | Branche de travail |
|---|---|---|
| numéro de PR | cette PR | `headRefName` de la PR |
| issue `Task` / `Bug` | la PR ouverte qui la ferme (ci-dessous) | sa branche head |
| issue `Feature` (epic) | la PR finale `epic/<N> → alpha` **+** les PR des sous-tickets (ouvertes ou mergées — leurs threads restent lisibles) | `epic/<N>` (les sous-tickets y sont déjà squash-mergés ; leurs branches n'existent plus) |
| aucun argument | la PR de la branche courante (`gh pr view --json number`) | branche courante |
| type absent / ambigu | — | **demander** |

```bash
# Task / Bug → PR ouverte liée
gh issue view "$ID" --json closedByPullRequestsReferences --jq '[.closedByPullRequestsReferences[].number] | join(" ")'
# garder celles qui sont ouvertes : gh pr view <n> --json state --jq .state  → "OPEN"
# repli : gh pr list --state open --search "linked:$ID" --json number --jq '.[0].number'

# Epic → PR finale + PR des sous-tickets
gh pr list --head "epic/$ID" --base alpha --state open --json number --jq '.[0].number // empty'
gh api graphql -F n="$ID" -f query='query($n:Int!){repository(owner:"SocialGouv",name:"egapro"){issue(number:$n){subIssues(first:50){nodes{closedByPullRequestsReferences(first:5){nodes{number state}}}}}}}' \
  --jq '[.data.repository.issue.subIssues.nodes[].closedByPullRequestsReferences.nodes[].number] | unique | join(" ")'
```

Une PR de sous-ticket encore **ouverte** sur un epic : ses corrections vont sur sa propre branche, pas sur `epic/<N>`.

## 2. Lire les threads non résolus

Source de vérité : les **threads** (`isResolved: false`), pas les états de review (un `COMMENTED` ancien et résolu n'est pas du travail).

```bash
for PR in $PR_LIST; do
  gh api graphql -F pr="$PR" -f query='query($pr:Int!){repository(owner:"SocialGouv",name:"egapro"){pullRequest(number:$pr){
    reviewThreads(first:100){nodes{id isResolved isOutdated path line
      comments(first:50){nodes{databaseId author{login} body url createdAt}}}}}}}' \
    --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)
           | {pr: '"$PR"', thread: .id, path, line, outdated: .isOutdated,
              comments: [.comments.nodes[] | {id: .databaseId, author: .author.login, body}]}]'
  # Commentaires de niveau PR (hors threads de code), et corps des reviews
  gh api "repos/SocialGouv/egapro/issues/$PR/comments" --jq '[.[] | {id, author: .user.login, body, created_at}]'
  gh api "repos/SocialGouv/egapro/pulls/$PR/reviews" --jq '[.[] | select(.body != "") | {id, author: .user.login, state, body}]'
done
```

Pour chaque élément, garder : PR, auteur, body, `path:line` (si inline), `thread` id (pour répondre). Un thread `outdated` reste à traiter : vérifier si le code actuel règle encore le point. Les commentaires de bots (Sonar, ultra11y, Copilot…) se traitent comme ceux des humains.

## 3. Catégoriser et rédiger

| Catégorie | Critère | Brouillon de réponse |
|---|---|---|
| **fix** | vrai problème : bug, sécurité, accessibilité, perf, lisibilité non triviale | « Adressé dans `<sha court>` : <description brève du correctif>. » |
| **non pertinent** | faux positif, hors périmètre, ou avis contraire défendable | « <justification technique>. Pas de modification. » — jamais ignoré en silence |
| **question** | l'auteur veut comprendre | réponse technique courte, sans modification |
| **déjà adressé** | un commit ultérieur l'a réglé — **vérifié au diff**, pas supposé | « Déjà traité dans `<sha court>`. » |
| **désaccord** | tu penses que le reviewer se trompe | argumentation, et laisser le reviewer trancher |
| **ambigu** | le doute reste | **demander à l'utilisateur** avant tout code — ne pas inventer d'interprétation |

Réponses en français, courtes, sans formule IA, **aucune mention d'outil ou de modèle**. Citer un log : la seule ligne pertinente (exception + message + `fichier:ligne` egapro), jamais un bloc complet.

## 4. Filtre anti-secret — obligatoire avant tout post

Passer **chaque** brouillon (et tout `gh pr comment` / `gh issue comment`) au filtre :

```bash
echo "$BODY" | grep -E '(ghp_|ghs_|gho_|ghu_|github_pat_|sk-ant-|sk-proj-|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_=-]{20,}\.|postgres://[^@]+:[^@]+@|Bearer\s+[A-Za-z0-9._-]{20,})' && {
    echo "STOP: secret-shaped string detected in payload, refusing to post" >&2
    return 1
}
```

Puis relire à la main : ni PII (email, nom, SIREN réel → `<email>`, `<SIREN>`), ni credentials de test, ni infra interne (namespace K8s, pods, IP, dashboards). Règle complète → `AGENTS.md` § Hygiène git.

**Si c'est un reviewer qui a leaké un secret** dans son commentaire : avertir l'utilisateur immédiatement — la **rotation** à la source est obligatoire, l'édition du commentaire ne suffit pas.

## 5. Poster (après validation explicite de l'utilisateur seulement)

Présenter la liste complète `thread → catégorie → brouillon`, attendre « ok ». Refus partiel → ne poster que ce qui est validé, lister le reste comme « en attente de décision utilisateur ».

```bash
# Réponse dans un thread de code
gh api graphql -F thread="$THREAD_ID" -F body="$BODY" -f query='mutation($thread:ID!,$body:String!){
  addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$thread, body:$body}){comment{url}}}'

# Réponse de niveau PR
gh pr comment "$PR" --body "$BODY"
```

Ne **pas** marquer les threads comme résolus : c'est au reviewer de le faire, sauf demande explicite de l'utilisateur.

## 6. Contrôle final

```bash
ME=$(gh api user --jq '.login')
for PR in $PR_LIST; do
  gh api graphql -F pr="$PR" -f query='query($pr:Int!){repository(owner:"SocialGouv",name:"egapro"){pullRequest(number:$pr){
    reviewThreads(first:100){nodes{id isResolved comments(last:1){nodes{author{login}}}}}}}}' \
    --jq "[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false and .comments.nodes[0].author.login != \"$ME\") | .id]"
done
```

Chaque id restant doit figurer dans la liste « en attente de décision utilisateur ». Sinon : un thread a été oublié → le traiter.

## Règles

- Corrections sur la **branche de travail** existante — jamais une nouvelle branche.
- Commits signés, jamais `--no-verify` / `--no-gpg-sign`. **Pas de force-push** sans accord explicite ; exception à demander : un `git rebase` propre sur `epic/<N>` si la branche d'intégration a bougé.
- **Aucun changement de statut sur le board**, **aucun merge** : le merge reste humain.
- CI : `gh pr checks <PR> --watch` jusqu'à `SUCCESS` / `SKIPPED` / `NEUTRAL` ; rouge → corriger, pousser, reboucler.
