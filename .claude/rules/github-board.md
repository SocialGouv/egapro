# GitHub Board Reference

IDs et snippets GraphQL prêts à l'emploi pour que les agents (`architect`, `code-dev`) et skills (`/epic`, `/code`) pilotent le project board **EGAPRO V2**.

Les IDs sont **stables** tant que le board n'est pas recréé. Si un snippet échoue avec "node not found", re-extraire les IDs via la requête de diagnostic en bas de ce fichier.

---

## IDs constants

```
PROJECT_ID       = PVT_kwDOAh0HH84BFsK7
STATUS_FIELD_ID  = PVTSSF_lADOAh0HH84BFsK7zg29EI8
```

### Status options

| Statut | Option ID | Qui bouge | Quand |
|---|---|---|---|
| Backlog | `f75ad846` | `product-owner` | création epic (phase `/ticket`) |
| To Do | `61e4505c` | `architect` | tickets créés, prêts à dispatcher |
| In progress | `47fc9ee4` | `code-dev` | début ticket (jusqu'à tous validators PASS) |
| In review | `df73e18b` | `code-dev` | tous validators PASS + PR marked ready |
| Done | `98236657` | **utilisateur uniquement** | revue humaine de la PR |

**Règle absolue** : aucun agent IA ne passe un ticket à `Done` (`98236657`). L'ID est listé ici pour référence mais ne doit apparaître dans **aucun `gh api` mutation** d'un agent.

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

### 5. Lister les sub-issues d'un epic avec leur statut (pour `/epic`)

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
| `designer` | aucune (ne touche pas au board, commente seulement) |
| `architect` | 1, 2, 4, 6 (créer sub-issues, ajouter au project, → To Do, lier au parent) |
| `code-dev` | 3, 4 (passer To Do → In progress → In review) |
| `functional-validator`, `design-validator` | aucune (commentent seulement, ne touchent pas au board) |
| `/epic` | 5 (lister sub-issues + statut pour savoir quoi dispatcher) |
| `/code` | 3, 4 (préconditions + éventuel retour To Do) |
