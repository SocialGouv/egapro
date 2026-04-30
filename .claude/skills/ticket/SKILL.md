---
name: ticket
description: "Conception pipeline: PO → designer → architect. Usage: /ticket <feature description + Figma URL> | /ticket <issue_number_or_url> [<extra context>]"
---

# /ticket

Orchestre la phase conception. Trois agents Opus se succèdent. **Chaque agent gère lui-même un gate de validation utilisateur explicite avant de poster sur GitHub** — l'orchestrateur (toi qui exécutes ce skill) chaîne simplement les agents et ne ré-interroge pas l'utilisateur entre eux.

1. **`product-owner`** — refine le besoin, rédige les scénarios PO
2. **`designer`** — propose un flow d'écrans + mockups HTML DSFR statiques
3. **`architect`** — lit le code et produit N tickets exécutables au format `rules/ticket-spec-format.md`

À la sortie : un epic GitHub avec N sous-issues prêtes à dispatcher via `/epic`.

## Arguments — deux modes

`$ARGUMENTS` peut être interprété de deux façons :

### Mode A — création (description libre)

`$ARGUMENTS` = description de la feature (en français) + URL Figma avec node ID. Si l'URL Figma manque, demander à l'utilisateur avant de commencer. **Comportement par défaut.**

### Mode B — enrichissement d'un ticket existant

`$ARGUMENTS` commence par un identifiant d'issue GitHub :
- `#42` ou `42` (numéro brut)
- URL complète : `https://github.com/SocialGouv/egapro/issues/42`

Du contexte additionnel (ajustements, URL Figma manquante, précisions) peut suivre l'identifiant.

**Détection** :
```bash
ARG_HEAD="$(echo "$ARGUMENTS" | awk '{print $1}')"
case "$ARG_HEAD" in
  '#'[0-9]*|[0-9]*)
    EPIC_NUMBER="${ARG_HEAD#\#}"
    MODE="enrich"
    ;;
  https://github.com/*/issues/*)
    EPIC_NUMBER="$(echo "$ARG_HEAD" | sed -E 's#.*/issues/([0-9]+).*#\1#')"
    MODE="enrich"
    ;;
  *)
    MODE="create"
    ;;
esac
EXTRA_CONTEXT="$(echo "$ARGUMENTS" | cut -d' ' -f2-)"   # tout sauf le head
```

En mode **enrich**, lire l'issue existante avant de déléguer :
```bash
gh issue view "$EPIC_NUMBER" --json number,title,body,labels,state,comments \
  --jq '{number, title, body, labels: [.labels[].name], state, comments: [.comments[] | {author: .author.login, body}]}'
```

**Exigences sur l'issue existante** :
- Doit être **OPEN** (sinon : prévenir l'utilisateur, demander confirmation pour rouvrir / créer une nouvelle).
- Si l'issue n'a **pas le type `Feature`** ni le label `Epic` → la pipeline va la promouvoir en epic (le PO appliquera le type Feature et le statut `Backlog` du board s'ils sont absents). Avertir l'utilisateur que l'issue va être convertie en epic et lui demander confirmation explicite avant de continuer.
- Si l'issue a déjà des sub-issues : la pipeline part du principe que les phases déjà présentes (PO / designer / architect) sont à **compléter ou ré-itérer**, pas à recréer. Voir comportement par phase ci-dessous.

---

# Step 1 — Product Owner (Opus)

Déléguer à l'agent `product-owner` (`.claude/agents/product-owner/AGENT.md`).

**Mode A (create)** — passer la description utilisateur. L'agent gère son Q&A fonctionnel, rédige le draft (body + 2 commentaires `## Besoin métier` et `## Analyse PO`), **obtient explicitement la validation utilisateur**, puis poste sur GitHub. Il retourne le numéro d'epic + la liste des scénarios.

**Mode B (enrich)** — passer le numéro d'issue + le JSON `gh issue view` pré-chargé + `EXTRA_CONTEXT`. L'agent doit :
- Lire le body et **tous les commentaires** existants
- Identifier ce qui est déjà présent (besoin métier ? analyse PO ? scénarios ? validation utilisateur précédente ?) et ce qui manque ou nécessite mise à jour à la lumière de `EXTRA_CONTEXT`
- Proposer un **diff** (sections à ajouter / amender / laisser intact), pas une réécriture from-scratch — éviter les commentaires en doublon
- Obtenir une **validation utilisateur explicite** sur ce diff
- Sur approbation : appliquer (nouveau commentaire `## Besoin métier (révisé YYYY-MM-DD)`, ou édition du body, ou nouveau `## Analyse PO (révisée)` selon le delta)
- Si l'issue n'a pas encore le type Feature / le statut Backlog : appliquer (snippets `rules/github-board.md` op. 7 + 1+2+4)

**Attendre** dans les deux modes le commentaire `[Validation utilisateur] Epic validé` (ou `Epic enrichi` en mode B) sur l'epic avant de passer à la suite.

---

# Step 2 — Designer (Opus)

Déléguer à l'agent `designer` (`.claude/agents/designer/AGENT.md`). Passer : epic issue number + URL Figma + mode (`create` / `enrich`).

**Mode A** — l'agent produit HTML + screenshots dans `/tmp/egapro-mocks/epic-<NNN>/` (jamais commités), **obtient explicitement la validation utilisateur sur le flow et les mockups**, uploade les PNG sur `design-assets/epic-<NNN>` et poste un commentaire avec images inline.

**Mode B** — si la branche `design-assets/epic-<NNN>` existe déjà et qu'un commentaire `## Designer: proposition d'écrans` est présent :
- Lire le commentaire existant + screenshots déjà publiés
- Évaluer ce qui doit changer à la lumière du PO révisé / `EXTRA_CONTEXT`
- Mettre à jour seulement les écrans impactés (push commit incrémental sur la branche orpheline)
- Poster un nouveau commentaire `## Designer: proposition d'écrans (révisée YYYY-MM-DD)` listant le delta
- Si rien à changer : poster un commentaire « Designer: pas de changement nécessaire » et passer en validation

**Attendre** le commentaire `[Validation utilisateur] Design validé` (ou `Design inchangé`) avant de passer à la suite.

---

# Step 3 — Architect (Opus)

Déléguer à l'agent `architect` (`.claude/agents/architect/AGENT.md`). Passer : epic issue number + mode.

**Mode A** — l'agent lit le code, **obtient explicitement la validation utilisateur sur le découpage proposé**, produit N sous-issues respectant `rules/ticket-spec-format.md`, applique le label `complexe` quand nécessaire, ordonne les dépendances via Parent issue / Sub-issues.

**Mode B** — l'epic peut déjà avoir des sub-issues :
- Lister les sub-issues existantes (snippet 5 de `rules/github-board.md`) + leur statut + leur PR liée
- Calculer le delta vs. le PO/designer révisés :
  - **Sub-issue déjà `Done` / `In review`** : ne pas la modifier (intouchable). Si le scope a changé, créer une **nouvelle** sub-issue qui amende.
  - **Sub-issue `In progress`** : commenter `architect: scope ajusté — voir epic` puis la replacer en `To Do` si le diff impacte le ticket — décision soumise à validation utilisateur explicite (un agent IA ne peut pas annuler le travail d'un autre sans aval).
  - **Sub-issue `To Do`** : mise à jour du body autorisée (édition `gh issue edit`).
  - **Nouveaux tickets** : création standard.
- Demander **validation utilisateur explicite** sur le plan d'amendement avant tout `gh issue create` / `gh issue edit`.

**Attendre** le commentaire `[Validation utilisateur] Architecture validée` (ou `Architecture amendée`).

---

# Step 4 — Report

```
## Ticket pipeline: DONE  (mode=<create|enrich>)

Epic: #NNN
Tickets créés: #N1, #N2
Tickets amendés: #N3
Tickets intouchés (déjà In review/Done): #N4
Complexe: #N2 (Opus required)
Mockups: /tmp/egapro-mocks/epic-NNN/

Next: /epic NNN
```

## Notes

- Si l'un des agents revient sans validation utilisateur (ex : utilisateur a refusé après le Q&A du PO), **ne pas continuer**. Arrêter la pipeline, laisser l'utilisateur reformuler sa demande.
- Un agent peut être relancé isolément en invoquant directement son agent (`.claude/agents/<name>/AGENT.md`) — utile pour re-travailler un design après un RETRY de `design-validator` en aval.
- En mode B, **ne jamais effacer** les commentaires précédents `## Besoin métier`, `## Analyse PO`, `## Designer: proposition d'écrans`. La traçabilité historique est précieuse — préférer ajouter un commentaire `(révisé YYYY-MM-DD)` qui pointe vers le précédent.
