# `.claude/pipeline/`

Les règles de la pipeline `/analyse` → `/implement`. **Rien ici n'est chargé automatiquement** : ces fichiers sont lus à la demande par les skills, les agents pipeline et les scripts `scripts/orchestration/`.

| Fichier | Contenu | Lu par |
|---|---|---|
| `orchestration.md` | la pipeline de bout en bout : agents, skills, scripts, modèle de branches, qui écrit quoi et quand | `/analyse`, `/implement`, `/report`, `/review` |
| `board.md` | les IDs du board GitHub **EGAPRO V2** (non devinables), les transitions autorisées et les trois pièges GraphQL | `product-owner`, `architect`, `architect-rework`, les scripts board |
| `ticket-spec-format.md` | ce qu'un spec de ticket doit porter, et où il vit selon le type d'issue | `architect`, `bug-analyst` (écrivent) · `code-dev`, `tu-dev` (lisent) |
| `complexity-estimation.md` | la rubrique de sizing t-shirt et ses anchors de calibration | `architect`, `bug-analyst`, `/velocity`, `/plan-sprint` |

**Pourquoi séparé de `.claude/rules/`** : une session de travail directe — édition, hotfix, question — n'a aucun usage du board GitHub ni du format de spec des tickets. Les laisser dans `.claude/rules/` les faisait charger sur n'importe quelle édition de `.ts`, au prix d'une centaine de lignes de contexte à chaque fois, pour une mécanique qui ne la concernait pas.

Le socle produit et code, lui, vaut pour tout le monde — pipeline comprise — et reste dans `.claude/rules/`, auto-chargé par `paths:`.
