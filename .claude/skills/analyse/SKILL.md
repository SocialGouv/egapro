---
name: analyse
description: "Conception pipeline. Détecte le mode (epic/task/bug) selon le type d'issue ou le prompt et invoque les agents appropriés. Usage: /analyse [<issue#>] [<description>]"
---

# /analyse

**Phase conception** de la pipeline. Trois modes auto-détectés :

| Mode | Trigger | Agents invoqués | Sortie |
|---|---|---|---|
| **epic** | Issue type `Feature`, ou prompt « nouvelle feature », « parcours », « ajouter une page X » | `product-owner` (Opus) → `architect` (Opus) | Epic GitHub avec N sous-issues |
| **task** | Issue type `Task`, ou prompt « refactor », « migrer », « ajouter un champ X » sans contexte feature | `architect` mode task (Opus) | Commentaire `## Analyse architecte` posté sur la task |
| **bug** | Issue type `Bug`, ou prompt « bug », « cassé », « ne marche pas », « écart figma », « régression » | `bug-analyst` (Opus) | Commentaire `## Analyse du bug` posté sur le bug |

Chaque agent gère lui-même un gate de validation utilisateur explicite avant de poster sur GitHub. L'orchestrateur (toi qui exécutes ce skill) chaîne et ne ré-interroge pas l'utilisateur entre étapes.

**Règle absolue** : aucun agent conception ne bouge un ticket sur le board. Les transitions `To Do → In progress → In review` sont la responsabilité de `/implement`.

---

## Step 0 — Détection du mode

```bash
ARG_HEAD="$(echo "$ARGUMENTS" | awk '{print $1}')"
case "$ARG_HEAD" in
  '#'[0-9]*|[0-9]*)
    ISSUE_N="${ARG_HEAD#\#}"
    ;;
  https://github.com/*/issues/*)
    ISSUE_N="$(echo "$ARG_HEAD" | sed -E 's#.*/issues/([0-9]+).*#\1#')"
    ;;
  *)
    ISSUE_N=""
    ;;
esac
EXTRA_CONTEXT="$(echo "$ARGUMENTS" | cut -d' ' -f2-)"
```

### Cas A — issue number fourni

```bash
gh issue view "$ISSUE_N" --json number,title,body,issueType,labels,state,comments \
  --jq '{number, title, body, issueType: .issueType.name, labels: [.labels[].name], state, comments: [.comments[] | {author: .author.login, body}]}'
```

Brancher selon `issueType.name` :

- `Feature` → mode **epic**. Si l'issue n'a pas encore de sub-issues + `## Analyse PO` → sous-mode `epic-create` (PO va construire from scratch). Sinon → `epic-enrich` (PO + architect amendent).
- `Task` → mode **task**.
- `Bug` → mode **bug**.
- Type absent ou autre → demander explicitement à l'utilisateur quel mode utiliser.

### Cas B — description libre (pas d'issue)

Inférer le mode depuis la description (mots-clés bug/feature/task ; doute → demander). En mode `epic`, le PO créera l'issue ; en `task` ou `bug`, **demander à l'utilisateur de filer l'issue d'abord** (ces modes opèrent sur une issue existante avec une description user).

### Cas C — aucun argument

Demander :
- « Tu as un numéro d'issue à analyser ? »
- Sinon : « Quel est le sujet ? » et inférer le mode depuis la réponse.

---

## Mode epic — workflow

### Step 1 — Product Owner (Opus)

Déléguer à l'agent `product-owner` (`.claude/agents/product-owner/AGENT.md`) avec le sous-mode `create` ou `enrich`.

**`epic-create`** — passer la description utilisateur. L'agent gère son Q&A, rédige body + 2 commentaires (`## Besoin métier`, `## Analyse PO`), obtient validation explicite, poste l'issue. Retourne le numéro d'epic + scénarios.

**`epic-enrich`** — passer le numéro d'epic + JSON snapshot + `EXTRA_CONTEXT`. L'agent lit l'historique, propose un diff, obtient validation, applique (commentaires `(révisé YYYY-MM-DD)` plutôt que réécriture).

**Attendre** le commentaire `[Validation utilisateur] Epic validé` (ou `Epic enrichi`) avant la suite.

### Step 2 — Architect (Opus, mode `epic-create` ou `epic-enrich`)

Déléguer à `architect` (`.claude/agents/architect/AGENT.md`) avec le mode passé. L'agent lit le code + URL Figma, propose un découpage, obtient validation, crée/amende les sub-issues.

**Attendre** le commentaire `[Validation utilisateur] Architecture validée`.

---

## Mode task — workflow

Déléguer à `architect` mode `task` (`.claude/agents/architect/AGENT.md`). Passer : `TASK_N`, mode `task`, URL Figma si fournie/présente dans le body.

L'agent :
1. Lit le body (intact) + tous les commentaires
2. **Pose des questions à l'utilisateur si la task est trop floue** — fichiers concernés, comportement attendu, scénario observable, réf Figma. Pas d'invention.
3. Propose un spec inline au format `rules/ticket-spec-format.md`
4. Obtient validation explicite
5. Poste un commentaire `## Analyse architecte` sur la task — **le body reste intact**
6. Applique le label `complexe` si > 5 fichiers / refacto multi-modules

**Attendre** le commentaire `[Validation utilisateur] Analyse validée — prêt pour /implement`.

---

## Mode bug — workflow

Déléguer à `bug-analyst` (`.claude/agents/bug-analyst/AGENT.md`). Passer : `BUG_N`, `EXTRA_CONTEXT`.

L'agent :
1. Lit le body + commentaires
2. **Pose des questions à l'utilisateur si le bug est trop flou** — env, étapes de repro, comportement attendu, URL Figma si visual mismatch
3. Choisit la sous-stratégie de repro :
   - **Fonctionnel local** : worktree `alpha` + `pnpm dev:app` + Playwright
   - **Env-specific** : `kubectl` + Playwright sur l'URL de la review app
   - **Visual mismatch (Figma ↔ app)** : worktree `alpha` + dev server + Playwright + `figma` MCP, diff structurel
4. Identifie root cause + fichiers à modifier
5. Obtient validation explicite
6. Poste un commentaire `## Analyse du bug` sur l'issue — **le body reste intact**

**Attendre** le commentaire `[Validation utilisateur] Analyse validée — prêt pour /implement`.

---

## Step final — Report

```
## Analyse: DONE  (mode=<epic|task|bug>, sub-mode=<...>)

Issue: #NNN
Sub-tickets créés : <liste, mode epic uniquement>
Tags appliqués : <complexe|none>

Next: /implement NNN
```

## Notes

- **Complexité t-shirt en fin d'analyse** — chaque ticket **feuille** (Task / Bug, jamais l'epic) reçoit une taille XS→XL écrite sur le board (`Size` + `Estimate`) par l'agent d'analyse via `set_ticket_size.sh`, avec justification dans le commentaire/body sous `## Complexité`. Rubrique : `rules/complexity-estimation.md`. Ces points alimentent la vélocité de sprint (skill `/velocity`).
- **Pas de transition de statut board** — l'issue reste dans son statut courant (`Backlog` ou `To Do`). C'est `/implement` qui bouge à `In progress` puis `In review`.
- Si un agent revient sans validation utilisateur (utilisateur a refusé après Q&A) → arrêter la pipeline, laisser l'utilisateur reformuler.
- En mode `epic-enrich`, ne **jamais effacer** les commentaires précédents (`## Besoin métier`, `## Analyse PO`). Préférer un commentaire `(révisé YYYY-MM-DD)` pointant vers le précédent — la traçabilité historique est précieuse.
- En mode `task` et `bug`, le **body reste intact**. Tout vit dans des commentaires. `code-dev` est briefé pour lire le commentaire d'analyse comme spec canonique.
