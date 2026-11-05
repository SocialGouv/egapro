# Board GitHub EGAPRO V2 — IDs, transitions, opérations

> Lu à la demande par **analyze** (création d'epic, de sous-issues, de tickets de fix) et **implement** (passage `In progress`). Les IDs ne sont **pas devinables** — c'est la raison d'être de ce fichier. Ils sont stables tant que le board n'est pas recréé ; sur `node not found`, les ré-extraire avec la [requête de diagnostic](#diagnostic--ré-extraire-les-ids).

---

## IDs constants

```
REPO               = SocialGouv/egapro
PROJECT_ID         = PVT_kwDOAh0HH84BFsK7
STATUS_FIELD_ID    = PVTSSF_lADOAh0HH84BFsK7zg29EI8
SIZE_FIELD_ID      = PVTSSF_lADOAh0HH84BFsK7zg29ENU   # single-select XS/S/M/L/XL
ESTIMATE_FIELD_ID  = PVTF_lADOAh0HH84BFsK7zg29ENY     # number (points Fibonacci)
START_DATE_FIELD_ID= PVTF_lADOAh0HH84BFsK7zg29ENc     # date (implementation start)
END_DATE_FIELD_ID  = PVTF_lADOAh0HH84BFsK7zg29ENg     # date (PR merge)
SPRINT_FIELD_ID    = PVTIF_lADOAh0HH84BFsK7zg8pCDM    # iteration
```

### Issue types (GitHub natifs)

| Type | ID | Appliqué par | Quand |
|---|---|---|---|
| Feature | `IT_kwDOAh0HH84Aa_K4` | analyze, mode epic | création de l'epic |
| Task | `IT_kwDOAh0HH84Aa_Kz` | analyze, mode epic / rework | création des sous-issues et tickets de fix |
| Bug | `IT_kwDOAh0HH84Aa_K1` | selon contexte | création d'une issue de bug |

L'epic porte le type **Feature** ; chaque sous-issue porte le type **Task**. À appliquer **juste après** `gh issue create` ([Op. E](#op-e--appliquer-un-issue-type)).

### Status options

| Statut | Qui le pose | Quand |
|---|---|---|
| Backlog | analyze, mode epic | création de l'epic |
| To Do | analyze, mode epic / rework | sous-issues et tickets de fix créés |
| In progress | implement | début d'implémentation — le ticket **y reste** une fois la PR prête |
| In review | **utilisateur uniquement** | quand l'humain décide qu'une PR est prête pour sa revue |
| Done | **utilisateur uniquement** | après validation humaine de la PR mergée |

**Règle absolue** : aucun agent ne passe un ticket à `In review` ni `Done`. `set_ticket_status.sh` refuse ces deux transitions (exit 3).

Hors création (statut initial d'une issue neuve), **analyze ne déplace aucun ticket existant** : `To Do → In progress` appartient à implement.

### Champs Size / Estimate / dates

- **Size + Estimate** : `bash scripts/orchestration/set_ticket_size.sh <N> <XS|S|M|L|XL>` — rubrique dans [`complexity-estimation.md`](complexity-estimation.md).
- **Start date** : posée automatiquement par `set_ticket_status.sh` sur la transition `→ In progress` (le premier passage gagne).
- **End date** : posée par le workflow `.github/workflows/ticket-end-date.yaml` au merge de la PR (résout `<N>` depuis la branche `ticket/<N>-*` ; la PR finale `epic/<N>` et les branches hors ticket sont ignorées). Écrire un project V2 d'org exige `organization_projects: write`, que le `GITHUB_TOKEN` par défaut ne porte jamais : le workflow passe par un token d'App minté par token-bureau (prérequis hors dépôt dans son en-tête). Rejouer la pose sans merger : `workflow_dispatch` (entrées `ticket`, `date`).
- Écriture manuelle d'une date : `bash scripts/orchestration/set_ticket_date.sh <N> <start|end> [--if-empty] [YYYY-MM-DD]`.

---

## Scripts (à préférer au GraphQL brut)

| Besoin | Commande |
|---|---|
| Changer le statut (Backlog / To Do / In progress) | `bash scripts/orchestration/set_ticket_status.sh <N> "To Do"` |
| Poser la taille | `bash scripts/orchestration/set_ticket_size.sh <N> M` |
| Poser une date | `bash scripts/orchestration/set_ticket_date.sh <N> start --if-empty` |
| Créer une branche `ticket/<N>-*` liée à l'issue (sidebar Development) | `bash scripts/orchestration/create_linked_branch.sh <N> <base, ex. origin/alpha>` (stdout = nom de branche) |

`set_ticket_status.sh` ajoute l'issue au project si elle n'y est pas encore : pour une issue neuve, **un seul appel** suffit à l'ajouter et à poser son statut initial.

---

## Opérations GraphQL

Les mutations Projects V2 sont standard ; ce qui ne l'est pas, ce sont les IDs ci-dessus et les trois pièges ci-dessous.

### Les trois pièges

1. **`gh issue edit` n'a pas de flag `--type`** — l'issue type passe obligatoirement par `updateIssueIssueType` ([Op. E](#op-e--appliquer-un-issue-type)), juste après `gh issue create`.
2. **`Status` / `Size` / `Estimate` / dates ne s'écrivent jamais en GraphQL brut** — passer par les scripts ci-dessus.
3. **Une issue peut appartenir à plusieurs projects** — toujours filtrer `projectItems` sur `project.id == PROJECT_ID`, jamais prendre `nodes[0]`.

### Op. A — node ID d'une issue

```bash
gh api graphql -f query='query($n:Int!){ repository(owner:"SocialGouv", name:"egapro"){ issue(number:$n){ id } } }' \
  -F n=<N> --jq '.data.repository.issue.id'
```

### Op. D — lier un ticket à son epic (sous-issue)

```bash
gh api graphql -f query='mutation($e:ID!,$t:ID!){ addSubIssue(input:{issueId:$e, subIssueId:$t}){ issue { number } } }' \
  -f e=<EPIC_NODE_ID> -f t=<TICKET_NODE_ID>
```

Le lien parent sert **uniquement** à rattacher le ticket à l'epic, jamais à exprimer une dépendance (c'est la section `## Depends on` du body).

### Op. E — appliquer un issue type

```bash
gh api graphql -f query='mutation($i:ID!,$t:ID!){ updateIssueIssueType(input:{issueId:$i, issueTypeId:$t}){ issue { number } } }' \
  -f i=<ISSUE_NODE_ID> -f t=<TYPE_ID>   # Feature IT_kwDOAh0HH84Aa_K4 · Task IT_kwDOAh0HH84Aa_Kz · Bug IT_kwDOAh0HH84Aa_K1
```

### Op. F — lister les sous-issues d'un epic avec leur statut

La seule query dont la forme n'est pas déductible (`subIssues` + `projectItems.fieldValues` avec le fragment inline sur le single-select) :

```bash
gh api graphql -f query='
query($owner:String!, $repo:String!, $epic:Int!) {
  repository(owner:$owner, name:$repo) {
    issue(number:$epic) {
      subIssues(first: 50) {
        totalCount
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
}' -f owner=SocialGouv -f repo=egapro -F epic=<EPIC_N>
```

Filtrer sur `project.id == "PVT_kwDOAh0HH84BFsK7"`, extraire le champ `Status` (`name` = "To Do" / "In progress" / …). `subIssues.totalCount > 0` est le marqueur « epic découpé » que vérifie implement.

### Séquences types

- **Créer un epic** : `gh issue create --label Epic` → Op. A → Op. E (Feature) → `set_ticket_status.sh <N> "Backlog"`.
- **Créer une sous-issue / un ticket de fix** : `gh issue create` → Op. A (ticket + epic) → Op. E (Task) → Op. D (parent = epic) → `set_ticket_status.sh <N> "To Do"` → `set_ticket_size.sh <N> <taille>`.

---

Board recréé → mettre à jour les IDs en tête de ce fichier **et** dans `scripts/orchestration/set_ticket_*.sh`, seuls à écrire le board.
