---
paths:
  - "scripts/orchestration/**"
---

# GitHub Board Reference

> **Used by**: `product-owner`, `architect`, `bug-analyst`, `code-dev` (déplacent les tickets — uniquement code-dev en pratique, les autres ne touchent pas au board), skills `/analyse`, `/implement`. `functional-validator` et `tu-dev` commentent seulement (jamais de transition de board).
>
> **Chargement** : auto-chargé via `paths:` quand on édite `scripts/orchestration/**` (où les IDs sont utilisés par les scripts board). `code-dev` n'en a pas besoin en contexte (il passe par `set_ticket_status.sh` / `create_linked_branch.sh` qui encapsulent les IDs). `architect` / `product-owner` font des ops board en GraphQL brut → **ils doivent lire ce fichier à la demande** (les IDs ne sont pas devinables).

IDs et snippets GraphQL prêts à l'emploi pour que les agents (`architect`, `code-dev`) et skills (`/analyse`, `/implement`) pilotent le project board **EGAPRO V2**.

Les IDs sont **stables** tant que le board n'est pas recréé. Si un snippet échoue avec "node not found", re-extraire les IDs via la requête de diagnostic en bas de ce fichier.

---

## IDs constants

```
PROJECT_ID       = PVT_kwDOAh0HH84BFsK7
STATUS_FIELD_ID  = PVTSSF_lADOAh0HH84BFsK7zg29EI8
SIZE_FIELD_ID    = PVTSSF_lADOAh0HH84BFsK7zg29ENU   # single-select XS/S/M/L/XL
ESTIMATE_FIELD_ID= PVTF_lADOAh0HH84BFsK7zg29ENY     # number (points Fibonacci)
SPRINT_FIELD_ID  = PVTIF_lADOAh0HH84BFsK7zg8pCDM    # iteration
```

### Size options (complexité t-shirt)

| Size | Option ID | Points (`Estimate`) |
|---|---|---|
| XS | `6c6483d2` | 1 |
| S | `f784b110` | 2 |
| M | `7515a9f1` | 3 |
| L | `817d0097` | 5 |
| XL | `db339eb2` | 8 |

Ne jamais écrire `Size` / `Estimate` en GraphQL brut : passer par `scripts/orchestration/set_ticket_size.sh <ticket> <XS|S|M|L|XL>` (écrit les deux champs d'un coup). Rubrique de sizing : `rules/complexity-estimation.md`. Lecture de la vélocité : `scripts/orchestration/sprint_velocity.sh` (skill `/velocity`).

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
| In progress | `47fc9ee4` | `code-dev` | début ticket — et y reste après `gh pr ready` (validation IA terminée). `code-dev` ne bouge plus le ticket au-delà. |
| In review | `df73e18b` | **utilisateur uniquement** | quand l'humain décide qu'une PR est prête pour sa propre revue |
| Done | `98236657` | **utilisateur uniquement** | après validation humaine de la PR mergée |

**Règle absolue** : aucun agent IA ne passe un ticket à `In review` (`df73e18b`) ni `Done` (`98236657`). Les IDs sont listés pour référence mais ne doivent apparaître dans **aucun `gh api` mutation** d'un agent. Le script `set_ticket_status.sh` refuse explicitement les deux transitions (exit 3).

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
| `code-dev` | 3, 4 (passer To Do → In progress ; ne bouge **jamais** à In review ni Done) |
| `functional-validator` | aucune (commente seulement, ne touche pas au board) |
| `/analyse` | aucune transition de board (les agents conception sont read-only) ; via PO peut ajouter au project en Backlog (op. 1+2+4) |
| `/implement` | 3, 4, 5 (préconditions + In progress ; mode epic = via le loop driver). Pas de transition à In review. |
