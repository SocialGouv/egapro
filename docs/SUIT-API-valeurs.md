# API SUIT — tables de valeurs des champs énumérés

> **Page générée depuis le code. Ne pas la modifier à la main : toute édition sera écrasée.**
>
> Régénération : `pnpm --filter app docs:suit-values`. Tant qu'elle n'est pas régénérée, la suite de tests échoue.
>
> Sources lues :
>
> - `packages/app/src/modules/domain/types.ts`
> - `packages/app/src/modules/export/shared/statusHistoryLabels.ts`
> - `packages/app/src/modules/cseOpinion/types.ts`, `schemas.ts`
> - `packages/app/src/modules/declaration-remuneration/steps/step5/sources.ts`
> - `packages/app/src/server/db/schema.ts`
> - `packages/app/src/server/rules/v2027.1.json`

Les valeurs ci-dessous complètent [`SUIT-API.md`](SUIT-API.md). Les libellés d'étape proviennent du ruleset `v2027.1`.

## Champs homonymes

Plusieurs champs du payload portent le même nom sans porter le même vocabulaire. Les voici, avant les tables.

### `Statut`

| Champ | Signification |
| --- | --- |
| `Parcours.Statut` | État courant dans la machine à états. |
| `Historique_statuts[].Statut` | Type d'événement d'une ligne d'historique. |
| `Seconde_declaration.Statut` | Booléen : la seconde déclaration a-t-elle été soumise. |

### `Type / type`

| Champ | Signification |
| --- | --- |
| `Avis_CSE[].Type` | Objet de la consultation du CSE. |
| `Fichiers_CSE[].Type` | Type du fichier d'avis CSE. |
| `Fichier_evaluation_conjointe.Type` | Type du fichier d'évaluation conjointe. |
| `files[].type` | Type de fichier servi par `GET /api/v1/files` — en minuscules, contrairement aux trois autres. |

### `Numero_declaration`

| Champ | Signification |
| --- | --- |
| `Historique_statuts[].Numero_declaration` | Tour du choix de parcours. |
| `Avis_CSE[].Numero_declaration` | Déclaration visée par l'avis. |

### `demarche_complete / demarche_completed`

| Champ | Signification |
| --- | --- |
| `demarche_complete` (`Historique_statuts[].Statut`) | Événement de fin de démarche. |
| `demarche_completed` (`Parcours.Statut`) | État terminal de la machine à états. |

## Tables de valeurs

### `Parcours.Statut`

État courant de la déclaration dans la machine à états versionnée.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Toujours présent.
- **Source** : `DECLARATION_FSM_STATUSES` (`modules/domain/types.ts`) ; libellés : étapes du ruleset `v2027.1`

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `draft` | — | Déclaration commencée et non soumise. N'apparaît dans l'export que pour une déclaration annulée : un brouillon non annulé n'est jamais exporté. |
| `awaiting_compliance_path_choice` | (1ère déclaration) Choix du parcours de mise en conformité | Déclaration soumise avec un écart d'au moins 5 % : l'entreprise doit choisir son parcours de mise en conformité. |
| `corrective_actions_chosen` | Actions correctives et seconde déclaration | Parcours « actions correctives » choisi après la première déclaration ; une seconde déclaration est attendue. |
| `joint_evaluation_chosen` | Évaluation conjointe des rémunérations | Parcours « évaluation conjointe » choisi après la première déclaration ; le rapport est attendu. |
| `awaiting_revision_choice` | (2e déclaration) Choix du parcours de mise en conformité | Seconde déclaration soumise avec un écart persistant : l'entreprise doit choisir un second parcours. |
| `revised_joint_evaluation_chosen` | Évaluation conjointe des rémunérations | Parcours « évaluation conjointe » choisi après la seconde déclaration ; le rapport est attendu. |
| `awaiting_cse_opinion` | Déposer le ou les avis CSE | Le ou les avis du CSE sont attendus. |
| `demarche_completed` | Finalisation - Démarche des indicateurs de rémunération | Aucune action supplémentaire n'est attendue sur Egapro. Ne pas confondre avec l'événement `demarche_complete` de `Historique_statuts[].Statut`, qui ne diffère que d'une lettre. |

### `Historique_statuts[].Statut`

Type d'événement brut de la ligne d'historique. Ce n'est pas un état de la machine à états.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Toujours présent sur chaque ligne. `Historique_statuts` vaut `[]` si aucun événement n'est enregistré — jamais `null`, jamais absent.
- **Source** : `DECLARATION_EVENT_TYPE_LABELS` (`modules/export/shared/statusHistoryLabels.ts`)

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `submit` | Soumission de la déclaration | Soumission de la déclaration initiale. |
| `path_choice` | Choix du parcours | Choix d'un parcours de mise en conformité. Seul événement à porter `Numero_declaration`. |
| `second_declaration_submit` | Soumission de la seconde déclaration | Soumission de la seconde déclaration. |
| `joint_evaluation_submit` | Dépôt du rapport d'évaluation conjointe | Dépôt du rapport d'évaluation conjointe. |
| `cse_opinion_submit` | Dépôt d'un avis CSE | Dépôt d'un avis du CSE. |
| `cancel` | Annulation de la déclaration | Annulation de la déclaration. |
| `demarche_complete` | Démarche terminée | Fin de la démarche. Ne pas confondre avec l'état `demarche_completed` de `Parcours.Statut`, qui ne diffère que d'une lettre. |

### `Historique_statuts[].Libelle_statut`

Libellé FR lisible de la ligne d'historique. La liste ci-dessous est exhaustive.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Toujours présent sur chaque ligne.
- **Source** : `getStatusHistoryLabel` (`modules/export/shared/statusHistoryLabels.ts`)

| Valeur | Signification |
| --- | --- |
| `Soumission de la déclaration` | Événement `submit`. |
| `Choix du parcours` | Événement `path_choice` dont le parcours est inconnu ou absent. |
| `Soumission de la seconde déclaration` | Événement `second_declaration_submit`. |
| `Dépôt du rapport d'évaluation conjointe` | Événement `joint_evaluation_submit`. |
| `Dépôt d'un avis CSE` | Événement `cse_opinion_submit`. |
| `Annulation de la déclaration` | Événement `cancel`. |
| `Démarche terminée` | Événement `demarche_complete`. |
| `Choix du parcours — Justification de l'écart` | Événement `path_choice` portant la valeur `justify`. |
| `Choix du parcours — Actions correctives` | Événement `path_choice` portant la valeur `corrective_action`. |
| `Choix du parcours — Évaluation conjointe` | Événement `path_choice` portant la valeur `joint_evaluation`. |

### `Historique_statuts[].Numero_declaration`

Tour du choix de parcours porté par la ligne d'historique.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Présent uniquement sur les lignes dont `Statut` vaut `path_choice`. Absent — et non `null` — sur toutes les autres.
- **Source** : événements `path_choice` des rulesets embarqués

| Valeur | Signification |
| --- | --- |
| `1` | Choix de parcours effectué après la déclaration initiale. |
| `2` | Choix de parcours effectué après la seconde déclaration. |

### `Parcours_apres_declaration_1`

Parcours de mise en conformité choisi après la première déclaration.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : `null` tant qu'aucun choix n'a été fait à ce tour.
- **Source** : `COMPLIANCE_PATHS` (`modules/domain/types.ts`) ; disponibilité par tour : événements `path_choice` des rulesets embarqués

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `justify` | Justification de l'écart | L'entreprise justifie l'écart constaté ; aucun dépôt supplémentaire n'est attendu sur Egapro à ce titre. |
| `corrective_action` | Actions correctives | L'entreprise engage des actions correctives, puis dépose une seconde déclaration. |
| `joint_evaluation` | Évaluation conjointe | L'entreprise procède à une évaluation conjointe des rémunérations et en dépose le rapport. |

### `Parcours_apres_declaration_2`

Parcours de mise en conformité choisi après la seconde déclaration.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : `null` tant qu'aucun choix n'a été fait à ce tour.
- **Source** : `COMPLIANCE_PATHS` (`modules/domain/types.ts`) ; disponibilité par tour : événements `path_choice` des rulesets embarqués

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `justify` | Justification de l'écart | L'entreprise justifie l'écart constaté ; aucun dépôt supplémentaire n'est attendu sur Egapro à ce titre. |
| `joint_evaluation` | Évaluation conjointe | L'entreprise procède à une évaluation conjointe des rémunérations et en dépose le rapport. |

### `Avis_CSE[].Type`

Objet de la consultation du CSE.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Toujours présent sur chaque avis. Le bloc `Avis_CSE` est absent si aucun fichier d'avis CSE n'a été déposé.
- **Source** : `CSE_OPINION_CONTENT_TYPES` (`modules/cseOpinion/types.ts`)

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `accuracy` | Exactitude des données | Avis rendu par le CSE sur l'exactitude des données déclarées pour la déclaration visée. |
| `gap` | Mesures de correction de l'écart | Avis rendu par le CSE sur les mesures de correction de l'écart de rémunération. |

### `Avis_CSE[].Avis`

Sens de l'avis rendu par le CSE.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : `null` lorsque l'avis n'a pas été renseigné — le cas notamment lorsque le CSE n'a pas été consulté sur les mesures de correction.
- **Source** : `opinionTypeSchema` (`modules/cseOpinion/schemas.ts`)

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `favorable` | Favorable | Le CSE a rendu un avis favorable. |
| `unfavorable` | Défavorable | Le CSE a rendu un avis défavorable. |

### `Avis_CSE[].Numero_declaration`

Déclaration sur laquelle porte l'avis du CSE.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Toujours présent sur chaque avis.
- **Source** : `DeclarationNumber` (`modules/cseOpinion/types.ts`)

| Valeur | Signification |
| --- | --- |
| `1` | L'avis porte sur la déclaration initiale. |
| `2` | L'avis porte sur la seconde déclaration. |

### `Fichiers_CSE[].Type`

Type des fichiers listés dans `Fichiers_CSE`.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Le bloc `Fichiers_CSE` est absent si aucun fichier d'avis CSE n'a été déposé.
- **Source** : `file_type` (`server/db/schema.ts`)

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `cse_opinion` | Avis du CSE | PDF d'avis du CSE déposé par l'entreprise (jusqu'à 4 par an, entreprises d'au moins 100 salariés). |

### `Fichier_evaluation_conjointe.Type`

Type du fichier d'évaluation conjointe.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Le bloc `Fichier_evaluation_conjointe` est absent si aucun rapport n'a été déposé.
- **Source** : `file_type` (`server/db/schema.ts`)

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `joint_evaluation` | Évaluation conjointe | PDF du rapport d'évaluation conjointe des rémunérations déposé par l'entreprise. |

### `files[].type`

Type de fichier — nommé en minuscules, contrairement aux `Type` de l'export des déclarations.

- **Endpoint** : `GET /api/v1/files`
- **Présence** : Toujours présent sur chaque fichier listé.
- **Source** : `file_type` (`server/db/schema.ts`)

| Valeur | Libellé FR | Signification |
| --- | --- | --- |
| `cse_opinion` | Avis du CSE | PDF d'avis du CSE déposé par l'entreprise (jusqu'à 4 par an, entreprises d'au moins 100 salariés). |
| `joint_evaluation` | Évaluation conjointe | PDF du rapport d'évaluation conjointe des rémunérations déposé par l'entreprise. |

### `Source_categories_emplois`

Source de détermination des catégories d'emplois de l'indicateur G. Servie brute depuis une colonne texte libre, sans conversion.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : `null` si aucun indicateur G n'a été déclaré.
- **Source** : `CATEGORY_SOURCES` et `LEGACY_SOURCE_LABELS` (`modules/declaration-remuneration/steps/step5/sources.ts`)

| Valeur | Libellé FR | Disponibilité | Signification |
| --- | --- | --- | --- |
| `accord-entreprise` | Accord d'entreprise | Active | Les catégories d'emplois sont celles d'un accord d'entreprise. |
| `accord-groupe` | Accord de groupe | Active | Les catégories d'emplois sont celles d'un accord de groupe. |
| `accord-branche` | Accord de branche | Active | Les catégories d'emplois sont celles d'un accord de branche. |
| `decision-unilaterale` | Décision unilatérale | Active | Les catégories d'emplois résultent d'une décision unilatérale de l'employeur. |
| `convention-collective` | Convention collective | Historique | Valeur historique : le choix a été retiré du formulaire, mais la colonne n'a jamais été migrée et l'export sert la valeur brute. Un consommateur qui valide strictement doit l'accepter. |
| `classification-interne` | Classification interne | Historique | Valeur historique : le choix a été retiré du formulaire, mais la colonne n'a jamais été migrée et l'export sert la valeur brute. Un consommateur qui valide strictement doit l'accepter. |
| `autre` | Autre | Historique | Valeur historique : le choix a été retiré du formulaire, mais la colonne n'a jamais été migrée et l'export sert la valeur brute. Un consommateur qui valide strictement doit l'accepter. |

### `Seconde_declaration.Statut`

Booléen, et non un état : indique si la seconde déclaration a été soumise.

- **Endpoint** : `GET /api/v1/export/declarations`
- **Présence** : Toujours présent.
- **Source** : `assembleDeclaration` (`modules/export/fetchDeclarations.ts`)

| Valeur | Signification |
| --- | --- |
| `true` | Une seconde déclaration a été soumise. |
| `false` | Aucune seconde déclaration n'a été soumise. |
