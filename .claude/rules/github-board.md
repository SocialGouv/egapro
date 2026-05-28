# GitHub Board Reference

> **Used by**: `product-owner`, `architect`, `bug-analyst`, `code-dev` (déplacent les tickets — uniquement code-dev en pratique, les autres ne touchent pas au board), skills `/analyse`, `/implement`. `functional-validator` commente seulement.

IDs et snippets GraphQL prêts à l'emploi pour que les agents (`architect`, `code-dev`) et skills (`/analyse`, `/implement`) pilotent le project board **EGAPRO V2**.

Les IDs sont **stables** tant que le board n'est pas recréé. Si un snippet échoue avec "node not found", re-extraire les IDs via la requête de diagnostic en bas de ce fichier.

---

## IDs constants

```
PROJECT_ID       = PVT_kwDOAh0HH84BFsK7
STATUS_FIELD_ID  = PVTSSF_lADOAh0HH84BFsK7zg29EI8
```

### Issue types (GitHub native)

| Type | ID | Qui applique | Quand |
|---|---|---|---|
| Feature | `IT_kwDOAh0HH84Aa_K4` | `product-owner` | création de l'epic (phase `/analyse`) |
| Task | `IT_kwDOAh0HH84Aa_Kz` | `architect` | création des sub-issues de l'epic |
| Bug | `IT_kwDOAh0HH84Aa_K1` | selon contexte | création d'une issue de bug |

L'epic porte le type **Feature** ; chaque sub-issue porte le type **Task**. À appliquer **juste après** `gh issue create` via la mutation GraphQL `updateIssueIssueType` (snippet 7 ci-dessous).

### Status options

| Statut | Option ID | Qui bouge | Quand |
|---|---|---|---|
| Backlog | `f75ad846` | `product-owner` | création epic (phase `/analyse`) |
| To Do | `61e4505c` | `architect` | tickets créés, prêts à dispatcher |
| In progress | `47fc9ee4` | `code-dev` | début ticket — et y reste pendant l'implémentation et après `gh pr ready` (validation IA terminée). |
| In review | `df73e18b` | `process_tick_result.sh` (sub-task d'epic uniquement, post-merge) **ou** utilisateur (standalone Task/Bug, manuel après merge humain) | sub-task d'epic : juste après squash-merge dans `epic/<N>` ; standalone : l'humain bouge à la main après revue + merge |
| Done | `98236657` | **utilisateur uniquement** | après validation humaine de la PR mergée |

**Règles** :

1. **`Done` reste user-only** — aucun agent ne pose cette transition, jamais. `set_ticket_status.sh` refuse explicitement (exit 3).
2. **`In review` n'est autorisé qu'à un seul endroit côté pipeline** : `process_tick_result.sh` après un squash-merge réussi d'une sub-task d'epic dans `epic/<N>`. Le script utilise le flag `--post-merge` de `set_ticket_status.sh` pour cette transition. Toute autre demande de transition `In review` par un agent (notamment `code-dev`, `functional-validator`) est refusée par défaut (`set_ticket_status.sh` exit 3 sans flag).
3. **Standalone Task / Bug** (pas de parent epic) : `code-dev` ne touche pas au statut après `gh pr ready`. Le ticket reste `In progress`. L'humain merge la PR, ferme l'issue (via `Closes #N`), et bouge manuellement le board à `In review` puis `Done`.
4. **Ticket Feature (epic)** : jamais bougé par la pipeline. L'humain le ferme et le bouge en `In review` / `Done` à la main, typiquement quand la PR finale `epic/<N> → alpha` est mergée.

---

## Snippets prêts à l'emploi

### 1. Récupérer le node ID d'une issue (préalable pour l'ajouter au project)

```bash
ISSUE_NUMBER=42
NODE_ID=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) { id }
  }
}' -f owner=SocialGouv -f repo=egapro -F n=$ISSUE_NUMBER --jq '.data.repository.issue.id')
```

### 2. Ajouter une issue au project (retourne le project item ID)

```bash
ITEM_ID=$(gh api graphql -f query='
mutation($project:ID!, $content:ID!) {
  addProjectV2ItemById(input: { projectId: $project, contentId: $content }) {
    item { id }
  }
}' -f project="PVT_kwDOAh0HH84BFsK7" -f content="$NODE_ID" --jq '.data.addProjectV2ItemById.item.id')
```

### 3. Récupérer l'item ID d'une issue déjà dans le project

```bash
ITEM_ID=$(gh api graphql -f query='
query($owner:String!, $repo:String!, $n:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$n) {
      projectItems(first: 5) {
        nodes {
          id
          project { id }
        }
      }
    }
  }
}' -f owner=SocialGouv -f repo=egapro -F n=$ISSUE_NUMBER \
  --jq '.data.repository.issue.projectItems.nodes[] | select(.project.id == "PVT_kwDOAh0HH84BFsK7") | .id')
```

### 4. Déplacer un ticket entre statuts

```bash
# $OPTION_ID = un des IDs ci-dessus (jamais 98236657 / Done pour un agent IA)
gh api graphql -f query='
mutation($project:ID!, $item:ID!, $field:ID!, $option:String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project,
    itemId: $item,
    fieldId: $field,
    value: { singleSelectOptionId: $option }
  }) { projectV2Item { id } }
}' \
  -f project="PVT_kwDOAh0HH84BFsK7" \
  -f item="$ITEM_ID" \
  -f field="PVTSSF_lADOAh0HH84BFsK7zg29EI8" \
  -f option="47fc9ee4"   # In progress
```

### 5. Lister les sub-issues d'un epic avec leur statut (pour `/implement` mode epic)

```bash
EPIC_NUMBER=42
gh api graphql -f query='
query($owner:String!, $repo:String!, $epic:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$epic) {
      subIssues(first: 50) {
        nodes {
          number
          title
          state
          labels(first: 10) { nodes { name } }
          projectItems(first: 5) {
            nodes {
              id
              project { id }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field { ... on ProjectV2SingleSelectField { name } }
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}' -f owner=SocialGouv -f repo=egapro -F epic=$EPIC_NUMBER
```

Parser le JSON, filtrer sur `project.id == "PVT_kwDOAh0HH84BFsK7"`, extraire le champ `Status` (`name` = "To Do" / "In progress" / ...).

### 6. Définir le Parent issue d'un ticket (nested sub-issue)

```bash
gh api graphql -f query='
mutation($parent:ID!, $child:ID!) {
  addSubIssue(input: { issueId: $parent, subIssueId: $child }) {
    subIssue { number }
  }
}' -f parent="$EPIC_NODE_ID" -f child="$TICKET_NODE_ID"
```

### 7. Appliquer un issue type (Feature / Task / Bug)

`gh issue edit` ne supporte **pas** le flag `--type`. Utiliser la mutation GraphQL :

```bash
# $ISSUE_NODE_ID récupéré via snippet 1
# $TYPE_ID = IT_kwDOAh0HH84Aa_K4 (Feature) | IT_kwDOAh0HH84Aa_Kz (Task) | IT_kwDOAh0HH84Aa_K1 (Bug)
gh api graphql -f query='
mutation($issueId: ID!, $typeId: ID!) {
  updateIssueIssueType(input: { issueId: $issueId, issueTypeId: $typeId }) {
    issue { number issueType { name } }
  }
}' -f issueId="$ISSUE_NODE_ID" -f typeId="$TYPE_ID"
```

**Usage standard dans la pipeline `/analyse`** :
- `product-owner` applique **Feature** à l'epic juste après sa création.
- `architect` applique **Task** à chaque sub-issue juste après sa création (boucle for).

### 8. Assigner un ticket à l'utilisateur (au début de l'implémentation)

Quand `code-dev` démarre un ticket (ou quand le loop driver le dispatche), l'assigner au handle GitHub de l'utilisateur principal du repo pour que les notifications de PR / review revienne directement à lui :

```bash
gh issue edit "$TICKET_NUMBER" --add-assignee Viczei
```

Idempotent — si l'utilisateur est déjà assigné, l'opération ne fait rien et ne erreur pas.

**Usage standard** :
- Mode epic : `epic_loop.sh` assigne chaque sub-task juste avant de spawn l'instance `claude` pour `code-dev`.
- Mode task / bug : `/implement` assigne le ticket juste avant d'invoquer `code-dev`.

### 9. Bouger un ticket en `In review` après squash-merge (pipeline uniquement)

Réservé à `process_tick_result.sh` après un squash-merge réussi d'une PR de sub-task dans `epic/<N>`. Utilise le flag `--post-merge` de `set_ticket_status.sh` qui débloque la transition normalement refusée :

```bash
bash scripts/orchestration/set_ticket_status.sh "$TICKET" "In review" --post-merge
```

Sans le flag, la transition `In review` est rejetée (exit 3). Le flag n'est **jamais** posé par `code-dev` ni par les autres agents — uniquement par `process_tick_result.sh` dans la branche `validated + merge OK`.

---

## Diagnostic — re-extraire les IDs si le board a bougé

```bash
gh api graphql -f query='
{
  node(id: "PVT_kwDOAh0HH84BFsK7") {
    ... on ProjectV2 {
      title
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id name
            options { id name }
          }
        }
      }
    }
  }
}'
```

Si le board a été recréé, mettre à jour les constantes en haut de ce fichier.

---

## Usage par agent

| Agent / Skill | Opérations utilisées |
|---|---|
| `product-owner` | 1, 2 (créer epic, ajouter au project en Backlog puis → To Do en fin de phase) |
| `architect` | 1, 2, 4, 6 (créer sub-issues, ajouter au project, → To Do, lier au parent) |
| `code-dev` | 3, 4, 8 (passer To Do → In progress + assigner ; ne bouge **jamais** à In review ni Done) |
| `functional-validator` | aucune (commente seulement, ne touche pas au board) |
| `process_tick_result.sh` | 9 (sub-task d'epic post-merge : To Do/In progress → In review via `--post-merge`) |
| `/analyse` | aucune transition de board (les agents conception sont read-only) ; via PO peut ajouter au project en Backlog (op. 1+2+4) |
| `/implement` | 3, 4, 5, 8 (préconditions + In progress + assigner ; mode epic = via le loop driver). Pas de transition à In review en mode standalone Task/Bug. |
| `epic_loop.sh` | 8 (assigner les sub-tasks dispatchées) |
