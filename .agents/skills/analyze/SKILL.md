---
name: analyze
description: "Phase conception : transforme une demande ou une issue GitHub en spec exécutable avant tout code. Détecte le mode selon le type d'issue — epic (Feature : besoin PO puis découpage en sous-issues), task (commentaire ## Analyse architecte), bug (reproduction + cause racine, commentaire ## Analyse du bug), rework (tickets de fix en fin d'epic). Ne modifie jamais le code. Usage: /analyze [<issue#>] [<description>]"
argument-hint: "[<issue#>] [<description>] [--subagents]"
---

# /analyze

Phase **conception**. Tu produis un spec que `/implement` exécutera. **Tu ne modifies jamais le code** et tu ne crées aucune branche.

## Règles dures

1. **Gate de validation avant chaque écriture GitHub.** Montre le texte **complet** à l'utilisateur et attends un **oui explicite**. Pas d'auto-validation, pas de « je suppose ». Un refus = **STOP**, l'utilisateur reformule.
2. **Task et Bug : le body de l'issue reste intact.** Tout passe par des commentaires.
3. **Aucune transition de statut** d'un ticket existant. Les seuls statuts posés sont ceux des issues **que tu crées** (epic → Backlog, sous-issues / fix → To Do). `In review` et `Done` : jamais.
4. **Ne jamais effacer ni réécrire** un commentaire existant. On ajoute un commentaire `(révisé YYYY-MM-DD)`.
5. **Pas d'invention.** Une info manque → STOP et pose 1 à 3 questions ciblées.
6. **Dépôt public** : voir AGENTS.md § Hygiène git. Données d'exemple fictives.

## Quand → lis

| Quand | Lis |
|---|---|
| Mode epic, étape besoin | [references/product-owner.md](references/product-owner.md) |
| Mode epic, étape découpage, ou mode task | [references/architect.md](references/architect.md) |
| Mode bug | [references/bug-analysis.md](references/bug-analysis.md) |
| Mode rework | [references/rework.md](references/rework.md) |
| Avant de rédiger un spec | [references/ticket-spec-format.md](references/ticket-spec-format.md) |
| Avant de poser une taille | [references/complexity-estimation.md](references/complexity-estimation.md) |
| Avant toute opération GitHub (issue, type, parent, board) | [references/board.md](references/board.md) |
| L'argument contient `--subagents` | [subagents.md](../review/references/subagents.md) |

**Ouvre la référence du mode avant d'agir** : ce fichier ne dit que l'enchaînement, la méthode est dans la référence.

---

## Étape 0 — Lire l'argument

Le premier mot de l'argument est un numéro (`123`, `#123`) ou une URL `https://github.com/SocialGouv/egapro/issues/123` → `N`. Le reste est du contexte additionnel. `--subagents` n'importe où : retire-le, et tu peux déléguer l'exploration du code selon [subagents.md](../review/references/subagents.md) (jamais les échanges avec l'utilisateur ni les écritures GitHub). Sans lui, aucun sous-agent.

- **Numéro fourni** :
  ```bash
  gh issue view <N> --repo SocialGouv/egapro --json number,title,body,issueType,labels,state,comments \
    --jq '{number, title, body, issueType: .issueType.name, labels: [.labels[].name], state, comments: [.comments[] | {author: .author.login, body}]}'
  ```
- **Description libre sans numéro** : déduis le mode (bug / feature / task). En mode epic, l'étape PO créera l'issue. En task ou bug → **STOP** : demande à l'utilisateur de créer l'issue d'abord.
- **Aucun argument** → demande « As-tu un numéro d'issue ? Sinon, quel est le sujet ? ».

## Étape 1 — Choisir le mode

| Signal | Mode |
|---|---|
| contexte contient `rework`, ou demande de changement à la gate d'acceptation d'un epic, ou envoi depuis `/implement` sur régression E2E | **rework** |
| `issueType = Feature` (ou « nouvelle feature », « parcours », « ajouter une page ») | **epic** |
| `issueType = Task` (ou « refactor », « migrer », « ajouter un champ ») | **task** |
| `issueType = Bug` (ou « bug », « cassé », « régression », « écart Figma ») | **bug** |
| type absent ou ambigu | **STOP** — demande le mode à l'utilisateur |

En mode epic, sous-mode :
- **`create`** : l'issue n'a ni sous-issues ni commentaire `## Analyse PO` ;
- **`enrich`** : sinon.

Annonce le mode retenu en une ligne avant de continuer.

## Étape 2 — Exécuter le mode

### Mode epic
1. **Besoin** : applique [product-owner.md](references/product-owner.md) en sous-mode `create` ou `enrich`. Attends que le commentaire `[Validation utilisateur] Epic validé` (ou `Epic enrichi`) soit posté.
2. **Découpage** : applique [architect.md](references/architect.md) en mode `epic-create` ou `epic-enrich`. Attends le commentaire `[Validation utilisateur] Architecture validée`.

Ne ré-interroge pas l'utilisateur entre les deux étapes au-delà de leurs propres gates.

### Mode task
Applique [architect.md](references/architect.md) en mode `task`. Si l'architecte convertit la task en Feature → **STOP** et dis à l'utilisateur de relancer `/analyze <N>`. Sinon, attends le commentaire `[Validation utilisateur] Analyse validée`.

### Mode bug
Applique [bug-analysis.md](references/bug-analysis.md). Attends le commentaire `[Validation utilisateur] Analyse validée — prêt pour /implement`.

### Mode rework
Applique [rework.md](references/rework.md), sur l'**epic** concerné.

## Étape 3 — Vérifier avant de conclure

Coche chaque ligne, sinon reprends l'étape concernée :

- [ ] Le commentaire d'analyse commence exactement par l'en-tête attendu — `/implement` le cherche tel quel : `## Analyse PO` (epic), `## Analyse architecte` (task), `## Analyse du bug` (bug).
- [ ] Le marqueur `[Validation utilisateur] …` est posté.
- [ ] Chaque **feuille** (Task, Bug, sous-issue, ticket de fix) a sa taille sur le board (`set_ticket_size.sh`) **et** une section `## Complexité` de même taille. L'epic n'est **pas** sizé.
- [ ] Label `complexe` posé selon le critère de [ticket-spec-format.md](references/ticket-spec-format.md) § Règles de rédaction.
- [ ] Mode epic : chaque sous-issue a le type Task, l'epic pour parent, le statut To Do, et ses `## Depends on`, sans cycle.
- [ ] Aucun secret, PII ou nom d'infra interne dans ce qui a été posté.

## Étape 4 — Compte rendu

```
## Analyse: DONE  (mode=<epic|task|bug|rework>, sous-mode=<create|enrich|->)

Issue: #NNN
Sous-tickets créés : <liste — epic / rework uniquement>
Taille : <XS..XL — task / bug>
Tags : <complexe | aucun>

Suite: /implement NNN
```

En mode epic, `/implement <epic#>` traite les sous-tickets dans l'ordre des `Depends on`. Le détail est dans [epic.md](../implement/references/epic.md).
