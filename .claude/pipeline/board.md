# Board GitHub — IDs et transitions

> **Pipeline only.** Lu à la demande par `product-owner`, `architect`, `architect-rework` (ops board en GraphQL brut) et par les scripts `scripts/orchestration/`. `code-dev` n'en a pas besoin : il passe par `set_ticket_status.sh` / `set_ticket_size.sh` / `create_linked_branch.sh`, qui encapsulent ces IDs.

Les IDs ne sont **pas devinables** — c'est la seule raison d'être de ce fichier. Ils sont stables tant que le board **EGAPRO V2** n'est pas recréé ; sur `node not found`, les ré-extraire avec la requête de diagnostic en bas.

---

## IDs constants

```
PROJECT_ID         = PVT_kwDOAh0HH84BFsK7
STATUS_FIELD_ID    = PVTSSF_lADOAh0HH84BFsK7zg29EI8
SIZE_FIELD_ID      = PVTSSF_lADOAh0HH84BFsK7zg29ENU   # single-select XS/S/M/L/XL
ESTIMATE_FIELD_ID  = PVTF_lADOAh0HH84BFsK7zg29ENY     # number (points Fibonacci)
START_DATE_FIELD_ID= PVTF_lADOAh0HH84BFsK7zg29ENc     # date (implementation start)
END_DATE_FIELD_ID  = PVTF_lADOAh0HH84BFsK7zg29ENg     # date (PR merge)
SPRINT_FIELD_ID    = PVTIF_lADOAh0HH84BFsK7zg8pCDM    # iteration
```

### Size options (complexité t-shirt)

| Size | Option ID | Points (`Estimate`) |
|---|---|---|
| XS | `6c6483d2` | 1 |
| S | `f784b110` | 2 |
| M | `7515a9f1` | 3 |
| L | `817d0097` | 5 |
| XL | `db339eb2` | 8 |

Ne jamais écrire `Size` / `Estimate` en GraphQL brut : passer par `scripts/orchestration/set_ticket_size.sh <ticket> <XS|S|M|L|XL>` (écrit les deux champs d'un coup). Rubrique de sizing : `complexity-estimation.md`. Lecture de la vélocité : `scripts/orchestration/sprint_velocity.sh` (skill `/velocity`).

### Date fields (Start date / End date)

Les deux champs `DATE` donnent une vision de la fenêtre d'implémentation d'un ticket (voir #3956) :

- **Start date** — jour où le ticket entre en implémentation. Écrit automatiquement par `set_ticket_status.sh` sur la transition `→ In progress` (donc via `/implement`, `code-dev` et `epic_loop.sh`), idempotent (le premier passage gagne).
- **End date** — jour de merge de la PR. Écrit par le workflow `.github/workflows/ticket-end-date.yaml` (résout `<N>` depuis `ticket/<N>-*`). Écrire un projet V2 d'org exige la permission `organization_projects: write`, que le `GITHUB_TOKEN` par défaut ne peut jamais porter : le workflow passe donc par un token d'App minté par token-bureau, et la demande est explicite (`permissions:` sur l'étape). Les prérequis hors repo (serveur token-bureau ≥ v0.0.10, permission de l'App approuvée côté org) sont détaillés dans l'en-tête du workflow. Le workflow accepte aussi un `workflow_dispatch` (`ticket`, `date`) pour rejouer la pose sans merger de PR.

Ne jamais écrire ces champs en GraphQL brut : passer par `scripts/orchestration/set_ticket_date.sh <ticket> <start|end> [--if-empty] [YYYY-MM-DD]` (write primitive unique). Backfill historique des tickets déjà mergés : `scripts/orchestration/backfill_ticket_dates.sh` (Start = 1ᵉʳ commit de la PR, End = date de merge).

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

## Mutations

Les mutations GraphQL du Projects V2 sont standard — ce qui ne l'est pas, ce sont les IDs ci-dessus et les trois pièges ci-dessous.

| Opération | Mutation / query |
|---|---|
| Node ID d'une issue | `repository.issue(number:).id` |
| Ajouter au project | `addProjectV2ItemById(input:{projectId, contentId})` → `item.id` |
| Item ID d'une issue déjà dans le project | `repository.issue.projectItems` puis filtrer sur `project.id == PROJECT_ID` |
| Déplacer entre statuts | `updateProjectV2ItemFieldValue(input:{projectId, itemId, fieldId: STATUS_FIELD_ID, value:{singleSelectOptionId}})` |
| Lier un ticket à son epic | `addSubIssue(input:{issueId: <epic>, subIssueId: <ticket>})` |
| Appliquer un issue type | `updateIssueIssueType(input:{issueId, issueTypeId})` |

Les trois pièges :

1. **`gh issue edit` n'a pas de flag `--type`** — l'issue type passe obligatoirement par `updateIssueIssueType`, juste après `gh issue create`.
2. **`Status` / `Size` / `Estimate` / dates ne s'écrivent jamais en GraphQL brut** — passer par `set_ticket_status.sh`, `set_ticket_size.sh`, `set_ticket_date.sh`. Ils encapsulent les IDs et `set_ticket_status.sh` refuse `In review` / `Done` (exit 3).
3. **Une issue peut appartenir à plusieurs projects** — toujours filtrer `projectItems` sur `project.id == PROJECT_ID`, jamais prendre `nodes[0]`.

### Lister les sub-issues d'un epic avec leur statut

La seule query dont la forme n'est pas déductible — `subIssues` + `projectItems.fieldValues` avec le fragment inline sur le single-select :

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
---

## Usage par agent

| Agent / Skill | Opérations |
|---|---|
| `product-owner` | crée l'epic, l'ajoute au project (Backlog → To Do), applique le type `Feature` |
| `architect` | crée les sub-issues, les ajoute au project (To Do), applique le type `Task`, les lie au parent |
| `architect-rework` | idem `architect`, pour les tickets de fix |
| `code-dev` | `To Do → In progress` via `set_ticket_status.sh` — **jamais** `In review` ni `Done` |
| `functional-validator`, `design-validator`, `tu-dev`, `e2e-dev` | commentent seulement, aucune transition |
| `/implement` | préconditions + `In progress` (mode epic : via le loop driver) |
