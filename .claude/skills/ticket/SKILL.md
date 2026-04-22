---
name: ticket
description: "Conception pipeline: PO → designer → architect. Usage: /ticket <feature description + Figma URL>"
---

# /ticket

Orchestre la phase conception. Trois agents Opus se succèdent et posent chacun un checkpoint `[Validation utilisateur]` sur l'epic avant de passer au suivant :

1. **`product-owner`** — refine le besoin, rédige les scénarios PO
2. **`designer`** — propose un flow d'écrans + mockups HTML DSFR statiques
3. **`architect`** — lit le code et produit N tickets exécutables au format `rules/ticket-spec-format.md`

À la sortie : un epic GitHub avec N sous-issues prêtes à dispatcher via `/epic`.

## Arguments

`$ARGUMENTS` — description de la feature (en français) + URL Figma avec node ID. Si l'URL Figma manque, demander à l'utilisateur avant de commencer.

---

# Step 1 — Product Owner (Opus)

Déléguer à l'agent `product-owner` (`.claude/agents/product-owner/AGENT.md`).

L'agent gère lui-même le Q&A fonctionnel et la validation utilisateur. Il retourne le numéro d'epic + la liste des scénarios.

**Attendre** le commentaire `[Validation utilisateur] Epic validé` sur l'epic avant de passer à la suite.

---

# Step 2 — Designer (Opus)

Déléguer à l'agent `designer` (`.claude/agents/designer/AGENT.md`). Passer : epic issue number + URL Figma.

L'agent produit HTML + screenshots dans `/tmp/egapro-mocks/epic-<NNN>/` (jamais commités) et valide avec l'utilisateur.

**Attendre** le commentaire `[Validation utilisateur] Design validé` avant de passer à la suite.

---

# Step 3 — Architect (Opus)

Déléguer à l'agent `architect` (`.claude/agents/architect/AGENT.md`). Passer : epic issue number.

L'agent lit le code, produit N sous-issues respectant `rules/ticket-spec-format.md`, applique le label `complexe` quand nécessaire, ordonne les dépendances via Parent issue / Sub-issues.

**Attendre** le commentaire `[Validation utilisateur] Architecture validée`.

---

# Step 4 — Report

```
## Ticket pipeline: DONE

Epic: #NNN
Tickets: #N1, #N2, #N3, …
Complexe: #N2 (Opus required)
Mockups: /tmp/egapro-mocks/epic-NNN/

Next: /epic NNN
```

## Notes

- Si l'un des agents revient sans validation utilisateur (ex : utilisateur a refusé après le Q&A du PO), **ne pas continuer**. Arrêter la pipeline, laisser l'utilisateur reformuler sa demande.
- Un agent peut être relancé isolément en invoquant directement son agent (`.claude/agents/<name>/AGENT.md`) — utile pour re-travailler un design après un RETRY de `design-validator` en aval.
