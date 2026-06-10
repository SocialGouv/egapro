# État des lieux — Matrice fichiers × types de contenu CSE (epic 3476)

> Branche analysée : `epic/3476` (working tree courant, incluant les modifs e2e non commitées du `FixPlan.md`). Cible : `alpha`.
> Sources de vérité : besoin (`besoin.md`), maquettes Figma light mode (3 captures), code applicatif + tests.
> Méthode : audit multi-dimensions (visuel / fonctionnel / tests / backend / RGAA) avec vérification adversariale. 36 constats, 11 à fort enjeu confirmés (0 réfuté). Lecture directe du CSS DSFR livré pour la cause racine visuelle.

---

## Avancement (2026-06-09)

| Lot | Statut | Détail |
|---|---|---|
| **Lot 1** — checkbox visibles (F1) | ✅ Fait | `fr-sr-only` retiré du label, nom accessible dans un span interne, garde-fou SCSS, test anti-régression. Vérifié par screenshot navigateur (3 états visibles). |
| **Lot 2** — tooltips ⓘ + colonne supprimer (F4, F5, F8) | ✅ Fait | `TooltipButton` réutilisé sur chaque en-tête (alimenté par `column.description`) ; bouton supprimer déplacé en colonne dédiée à droite, icône seule + `aria-label`. Layout vérifié par screenshot. |
| **Lot 3** — règle « Justification » écart ≥ 5 % (F2) | ✅ Fait | Règle arbitrée (écart ≥ 5 % **ET** consultation CSE = oui) centralisée dans `computeRequiredContentTypes` (partagée UI + `finalize`) ; `hasGapsAboveThreshold` (domaine) câblé front (`page.tsx`) et back (`finalize`) ; tests réécrits + 4 nouveaux cas. |
| Lot 4 — taille/checks/badge (F6, F7, F7c) | À faire | |
| Lot 5 — durcissement backend (validation colonnes, alignement `hasSecondDeclaration`) | À faire | |
| Lot 6 — e2e multi-colonnes + RGAA état désactivé (F3, F9, F10) | À faire | |

Gates verts après Lots 1-3 : typecheck, 2477 tests unitaires, lint, format. Aucun commit (hors pipeline).

---

## 1. Synthèse

La feature est **correctement construite côté logique** (calcul des colonnes, exclusivité, persistance, validation backend, audit logging : tout est en place et bien testé en unitaire). Le problème n'est donc pas « il manque le code ». Les écarts réels sont concentrés sur **trois points** :

1. **Bug bloquant (critical) : les cases à cocher sont invisibles.** C'est l'écart que tu as repéré à l'œil. Ce n'est pas un problème métier de conception (les checkbox existent dans le DOM et fonctionnent) mais un **bug de rendu DSFR** : le `<label>` de chaque case porte `fr-sr-only`, or DSFR dessine le carré visible *via le `::before` du label*. Masquer le label masque le carré. Résultat : colonne visuellement vide, contrôle central de l'epic inutilisable à la souris et au regard. **La feature est, en l'état, non utilisable en production.**

2. **Écarts de fidélité Figma** (high/medium) : pas d'icône info ⓘ + tooltip sur les en-têtes de colonnes, bouton « Supprimer » mal placé (texte empilé sous le nom de fichier au lieu d'une colonne poubelle icône seule à droite), taille du fichier non affichée, encart récap en puces au lieu de checks.

3. **Divergence fonctionnelle vs besoin** (high, à arbitrer PO) : la colonne « Justification » s'affiche sur le **seul** critère « CSE consulté = oui », sans jamais tester l'**écart ≥ 5 %**. Le besoin exige *les deux* conditions. Front, back **et** tests sont alignés entre eux mais divergent tous du besoin (les tests *gravent* la règle erronée).

Point de méthode crucial : **les tests e2e passent malgré le bug n°1.** Le `FixPlan.md` (remédiation antérieure) a réécrit le harnais e2e pour « passer par la vraie UI », mais en cochant via `getByRole("checkbox").check()`. Playwright ignore l'opacité dans son test de visibilité : il actionne l'`<input opacity:0>` sans voir que le carré n'est pas peint. **La CI est verte, la feature est cassée.** Le périmètre du FixPlan excluait `src/modules/**` en postulant « la feature n'est pas en cause » : c'est l'angle mort.

| Dimension | Verdict | Constats |
|---|---|---|
| Logique métier (calcul colonnes, exclusivité, multi-types, persistance, gate submit) | Conforme | implémentée + testée unitairement (S1-S10) |
| Backend (mutations, contrainte unique, cascade, audit) | Conforme | re-validation `finalize`, unicité DB, cascade, 3 points d'audit |
| **Rendu visuel des checkbox** | **Cassé (critical)** | F1 |
| **Fidélité Figma** (tooltips, colonne supprimer, taille, checks) | **Écarts** | F4, F5, F6, F7 |
| **Règle d'affichage Justification (écart ≥ 5 %)** | **Divergent (à arbitrer)** | F2 |
| Accessibilité RGAA (état désactivé, tooltips) | Écarts | F3, F8 |
| Tests (faux positif e2e + trous de couverture e2e) | Insuffisants | F9, F10 |

---

## 2. Écart fonctionnel

### F1 — `[CRITICAL]` Cases à cocher invisibles (cause racine du « pas de checkbox »)

**Constat.** Dans [ContentTypeMatrix.tsx:133-138](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L133-L138), chaque `<label>` de checkbox porte `className="fr-label fr-sr-only"`.

**Mécanique DSFR (vérifiée dans le CSS livré).**
- L'`<input type="checkbox">` natif est rendu invisible : `.fr-checkbox-group input[type=checkbox] { position:absolute; opacity:0 }` ([checkbox.main.css:13-19](packages/app/public/dsfr/component/checkbox/checkbox.main.css#L13)).
- Le carré visible est dessiné **par le pseudo-élément `::before` du `<label>`** : `.fr-checkbox-group input[type=checkbox] + label::before { ... }` ([checkbox.main.css:40-54](packages/app/public/dsfr/component/checkbox/checkbox.main.css#L40)).
- `fr-sr-only` réduit le label à `width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0)` ([core.main.css ~1814-1825](packages/app/public/dsfr/core/core.main.css#L1814)). Le label étant clippé, son `::before` n'a aucune surface peinte.

**Conséquence.** Input invisible (opacity:0) + carré (`::before` du label) clippé = **aucune case visible**. La colonne de type est vide à l'écran (exactement le symptôme de la capture dark mode). L'utilisateur voyant n'a ni affordance ni retour d'état (coché / décoché / désactivé). L'usage réel de S5, S6, S7, S8, S9 est invalidé. La zone reste techniquement cliquable (input 1rem, opacity:0), mais sans aucun repère visuel.

**Pourquoi le code paraît correct.** La logique est bonne, c'est uniquement le pattern d'accessibilité du label qui est faux : il fallait un nom accessible riche **sans** clipper l'élément porteur du `::before`.

> Confiance : élevée. Confirmé par lecture du composant + du CSS DSFR + cohérence avec la capture.

### F2 — `[HIGH, à arbitrer PO]` Colonne « Justification » sans test de l'écart ≥ 5 %

**Constat.** Le besoin (règle d'affichage + scénarios S2/S4) exige la colonne Justification **si (écart ≥ 5 %) ET (consultation CSE = oui)**. Le code ne teste que le second critère :
- [contentTypeColumns.ts:78,84](packages/app/src/modules/cseOpinion/contentTypeColumns.ts#L78) : `if (firstDeclGapConsulted === true)` / `if (secondDeclGapConsulted === true)`. L'écart n'est jamais lu (le type `ContentTypeColumnsInput` n'a pas de champ pour le gap).
- [page.tsx:69-79](packages/app/src/app/avis-cse/etape/[step]/page.tsx#L69) : alimente ces flags uniquement depuis `opinions[].gapConsulted`.
- [cseOpinion.ts:264-271](packages/app/src/server/api/routers/cseOpinion.ts#L264) (`finalize`) : même gating sur `gapConsulted` seul.

Front et back sont **cohérents entre eux**, mais divergent **tous deux** du besoin. Le domaine expose pourtant `hasGapsAboveThreshold` / `gapLevel` / `GAP_ALERT_THRESHOLD` (`~/modules/domain`), jamais mobilisés ici.

**Reproductibilité.** Un déclarant **sans écart** mais avec CSE atteint quand même l'étape (FSM `submit_to_cse_opinion_directly` : `cseRequired` ne teste pas l'écart). La `GapConsultationCard` de l'étape 1 est rendue inconditionnellement ([Step1Opinions.tsx:255-278](packages/app/src/modules/cseOpinion/Step1Opinions.tsx#L255)). S'il répond « oui » à la question de consultation, une colonne Justification apparaît et une association est exigée au submit, **alors que le besoin dit de la masquer**.

**Nuance honnête.** Le déclenchement suppose une saisie utilisateur incohérente (répondre « oui » à une question portant explicitement sur la consultation d'écarts ≥ 5 % qu'il n'a pas). Mais le bug de fond est indépendant de ce scénario : *le code ne croise jamais écart et consultation*, donc il ne peut pas implémenter la condition double, quelle que soit la saisie.

> Confiance : élevée sur la divergence. **Décision PO requise** : confirmer que la règle « écart ≥ 5 % ET consulté » est bien la cible (le FixPlan §1.1 la cite explicitement comme telle), puis trancher la priorité.

---

## 3. Écart visuel (vs maquettes Figma)

Rappel : la maquette cible illustre un cas **S4 à 3 colonnes** (Exactitude 1re, Exactitude 2e, Justification 2e, *sans* Justification 1re), avec checkbox visibles, tooltips et colonne poubelle. La capture de l'app actuelle est un cas **1 colonne** (1 déclaration sans écart) : le nombre de colonnes diffère pour cause de **données de contexte différentes**, pas de bug (la logique de suffixe est conforme, cf. §5).

| # | Écart | Sévérité | Cible (maquette) | État actuel (code) |
|---|---|---|---|---|
| F1 | Checkbox invisibles | **critical** | case cochable visible par cellule | colonnes vides (cf. §2) |
| F4 | Tooltip ⓘ sur en-têtes | high | icône info + tooltip = libellé long de l'avis | en-tête = `label` + `declarationLabel` seuls ([ContentTypeMatrix.tsx:52-65](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L52)). `column.description` calculé mais **jamais rendu** ([contentTypeColumns.ts:48-51](packages/app/src/modules/cseOpinion/contentTypeColumns.ts#L48)) |
| F5 | Bouton supprimer | high | colonne dédiée à droite, **icône poubelle seule** | bouton **texte** « Supprimer » empilé sous le nom de fichier, dans la 1re cellule ([ContentTypeMatrix.tsx:93-102](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L93) + `.fileCell` flex-column [SCSS:19-24](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.module.scss#L19)) |
| F6 | Taille du fichier | medium | sous-texte « PDF · 61,88 Ko » | sous-texte « PDF » seul ([ContentTypeMatrix.tsx:90-92](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L90)). Le type `UploadedFile` n'a pas de champ `size` ([types.ts:3-7](packages/app/src/modules/cseOpinion/types.ts#L3)) alors que `FileUpload` affiche déjà la taille en amont |
| F7 | Encart récap | low | chaque ligne préfixée d'un check ✓ | `<ul><li>` bruts, puce par défaut ([OpinionSummaryBox.tsx:23-34](packages/app/src/modules/cseOpinion/components/OpinionSummaryBox.tsx#L23)) |
| F7b | Alerte erreur d'upload | medium | alerte avec bouton fermer (dismissible) | `<p class="fr-message fr-message--error">` non dismissible (`FileUpload`, partagé). Wording divergent |
| F7c | Indicateur « Enregistré » | low | badge auto-save en haut à droite | auto-save effectif (mutate à chaque toggle) mais **aucun feedback visuel** ([Step2Upload.tsx:72-89](packages/app/src/modules/cseOpinion/Step2Upload.tsx#L72)) |

> Note : `column.description` est dupliqué en chaînes littérales hardcodées dans [Step2Upload.tsx:261-263](packages/app/src/modules/cseOpinion/Step2Upload.tsx#L261) pour l'encart, mais n'est consommé nulle part en rendu de l'en-tête. À factoriser au passage (DRY).

---

## 4. Écart d'accessibilité (RGAA)

| # | Écart | Sévérité | Détail |
|---|---|---|---|
| F1 | (cf. §2) perte de perceptibilité du contrôle | critical | info visuelle supprimée pour les voyants alors qu'elle reste dans l'arbre d'accessibilité pour le lecteur d'écran : l'inverse de l'intention. Proche WCAG 1.3.1 / 1.4.1 / 2.5.x |
| F3 | État désactivé non atteignable / non expliqué | high | l'exclusivité utilise `disabled` natif ([ContentTypeMatrix.tsx:122](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L122)) : input retiré du tab order, et la **cause** (« type déjà associé au fichier X ») n'est jamais annoncée. Le besoin demande explicitement « état désactivé annoncé ». Pattern RGAA attendu : `aria-disabled` (focusable) + `aria-describedby` |
| F8 | Tooltips ⓘ absents (versant a11y) | medium | doublon fonctionnel de F4 : le pattern `TooltipButton` accessible existe déjà dans le repo ([declaration-remuneration/shared/TooltipButton.tsx](packages/app/src/modules/declaration-remuneration/shared/TooltipButton.tsx)) et devrait être réutilisé |

Points **conformes** à conserver : `caption` sr-only du tableau, `scope="col"/"row"`, `headers=` sur chaque `td`, `aria-live="polite"` sur les alertes ([Step2Upload.tsx:243-257](packages/app/src/modules/cseOpinion/Step2Upload.tsx#L243)).

---

## 5. Écart sur les tests

### F9 — `[CRITICAL]` Faux positif e2e : les tests passent alors que les cases sont invisibles

[compliance-flows.ts:84-88](packages/app/src/e2e/helpers/compliance-flows.ts#L84) coche via `getByRole("checkbox", { name }).check()`. Le sélecteur cible l'`<input>` (rôle implicite), dont le nom accessible vient justement du label `fr-sr-only`. L'input ayant une boîte 1rem non vide et n'étant ni `display:none` ni `visibility:hidden`, **Playwright le considère actionnable** (l'opacité n'entre pas dans son test de visibilité). La mutation part, l'e2e est vert. Aucun test (ni jsdom unitaire, ni Playwright) n'évalue le rendu du carré. **D'où le faux sentiment de sécurité.**

### F10 — `[HIGH]` Couverture e2e limitée au cas mono-colonne

[fillCseStep1](packages/app/src/e2e/helpers/compliance-flows.ts#L7) répond **toujours** « non » à la consultation ([:12,16](packages/app/src/e2e/helpers/compliance-flows.ts#L12)). Les deux seuls appels ([compliance.e2e.ts:39,354](packages/app/src/e2e/compliance.e2e.ts#L39)) invoquent `submitCseStep2` sans options. Résultat : **une seule colonne « Exactitude » jouée end-to-end**. Jamais testés en e2e : colonne Justification, 2 déclarations / 4 colonnes, exclusivité S5/S6 (besoin de 2 fichiers), multi-types S7, submit bloqué + message S8, reprise S10. Ces scénarios existent **en unitaire** (cf. ci-dessous) mais pas en navigateur réel.

### Constat aggravant — les tests gravent la règle erronée

[contentTypeColumns.test.ts:36](packages/app/src/modules/cseOpinion/__tests__/contentTypeColumns.test.ts#L36) affirme que `gapConsulted=true` (sans aucune notion d'écart) **doit** produire la colonne Justification ; [cseOpinion.finalize.test.ts:330](packages/app/src/server/api/routers/__tests__/cseOpinion.finalize.test.ts#L330) exige l'association gap dès `gapConsulted=true`. Toute correction de F2 cassera ces tests, qui devront être réécrits. La suite donne donc aujourd'hui une **fausse assurance de conformité au besoin**.

### Ce qui est, lui, bien couvert (unitaire)

| Scénario | Couverture |
|---|---|
| S1-S4 (calcul colonnes + libellés) | [contentTypeColumns.test.ts:24-79](packages/app/src/modules/cseOpinion/__tests__/contentTypeColumns.test.ts#L24) |
| S5 (exclusivité), S6 (réactivation), label mono-décl | [ContentTypeMatrix.test.tsx:90-198](packages/app/src/modules/cseOpinion/components/__tests__/ContentTypeMatrix.test.tsx#L90) |
| S6, S7, S8, S10, delete, finalize | [Step2Upload.test.tsx](packages/app/src/modules/cseOpinion/__tests__/Step2Upload.test.tsx) |
| Contrainte unique, cascade, multi-types, anti-doublon | [cseOpinion.fileAssociations.integration.test.ts](packages/app/src/server/api/routers/__tests__/cseOpinion.fileAssociations.integration.test.ts), [cseOpinion.test.ts:327-435](packages/app/src/server/api/routers/__tests__/cseOpinion.test.ts#L327) |
| Gate finalize par type requis | [cseOpinion.finalize.test.ts:306-426](packages/app/src/server/api/routers/__tests__/cseOpinion.finalize.test.ts#L306) |

> Les helpers DB `insertCseOpinionFileWithAssociations` / `setCseFileAssociationsForCurrentDeclaration` ont été **retirés** du working tree (modif e2e du FixPlan) : aucun appel résiduel, pas de code mort.

---

## 6. Ce qui est conforme (à ne pas réécrire)

KISS/DRY : la majeure partie de l'epic est saine. Ne corriger que les écarts ci-dessus.

- **Exclusivité par colonne (S5/S6)** : `lockedByOther` ([ContentTypeMatrix.tsx:109-111](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L109)) + décochage qui repasse à `null` + double verrou backend (rejet du doublon + contrainte UNIQUE DB). Cohérent front/back/DB.
- **Multi-types par fichier (S7)** : `handleToggle` ne modifie que la clé cochée (spread).
- **Suffixe de libellé selon 1/2 déclarations (S1/S2/S3)** : conditionné à `hasSecondDeclaration`, testé.
- **Gate du submit + message (S8)** : `isComplete` / `getMissingColumns` + alerte `aria-live` + re-validation serveur `finalize`.
- **Persistance / reprise (S10)** : mutate à chaque toggle, `buildAssociationMap` à la reprise (ignore les colonnes non affichées), cascade FK à la suppression.
- **Backend** : contrainte `unique(declarationId, declarationNumber, type)`, `onDelete: cascade`, audit logging câblé en 3 points pour `setFileContentTypes`.

---

## 7. Plan d'implémentation

Découpé en lots priorisés. Chaque lot est autonome et peut faire l'objet d'un ticket / PR.

### Lot 1 — `[CRITICAL, à faire en premier]` Rendre les cases visibles (F1)

**Objectif :** restaurer le carré DSFR sans perdre le nom accessible.

**Fichier :** [ContentTypeMatrix.tsx:118-139](packages/app/src/modules/cseOpinion/components/ContentTypeMatrix.tsx#L118).

**Correctif :** ne plus mettre `fr-sr-only` sur le `<label>` porteur du `::before`. Déporter le texte accessible dans un `<span>` sr-only **à l'intérieur** du label (le label garde son `::before` peint), ou via `aria-label` sur l'input.

```tsx
// AVANT (case invisible) :
<label className="fr-label fr-sr-only" htmlFor={inputId}>
  {checkboxLabel(column, file.fileName)}
</label>

// APRÈS (case visible, nom accessible préservé) :
<label className="fr-label" htmlFor={inputId}>
  <span className="fr-sr-only">{checkboxLabel(column, file.fileName)}</span>
</label>
```

**Points de vigilance :**
- Le `::before` est positionné en `left:-1.5rem` (variante `--sm`) par rapport au label. Avec un label « vide visuellement », ajuster le SCSS de `.checkboxCell` pour centrer le carré dans la cellule (donner au label/groupe une largeur minimale et centrer). Vérifier le rendu réel (dev server + comparaison Figma via le MCP `figma-dev`), **pas** via `getByRole` (cf. F9).
- Valider la structure exacte avec le MCP `dsfr` (`get_component_doc` checkbox) avant d'écrire le HTML.
- Conserver `headers=` + `scope` (déjà corrects) : le nom accessible reste fourni par le label.

**Test associé (verrou anti-régression) :** ajouter un test unitaire qui **échoue si le label porte `fr-sr-only`** (ou que le texte accessible n'est pas dans un span interne), pour empêcher la réintroduction du bug. C'est le seul niveau capable d'attraper cette classe de défaut (jsdom ne peint pas, Playwright ignore l'opacité).

### Lot 2 — `[HIGH]` Fidélité Figma : tooltips, colonne supprimer (F4, F5, F8)

**F4/F8 — Tooltips ⓘ sur les en-têtes.** Réutiliser le composant existant [`TooltipButton`](packages/app/src/modules/declaration-remuneration/shared/TooltipButton.tsx) (DRY) dans chaque `<th>` de colonne, alimenté par `column.description` (déjà calculé, aujourd'hui inutilisé). Bouton focusable, `aria-describedby` vers le `role="tooltip"`, icône `fr-icon-information-line` décorative (`aria-hidden`). Supprimer au passage la duplication des libellés longs dans `Step2Upload.tsx` en consommant `column.description`.

**F5 — Bouton supprimer.** Ajouter une **colonne dédiée à droite** dans le `<thead>`/`<tbody>` (en-tête vide ou `fr-sr-only`), bouton `fr-btn--tertiary-no-outline fr-icon-delete-line` **sans texte visible**, avec `title` / `aria-label` « Supprimer {fichier} ». Remplacer le changement de libellé (« Suppression… ») par `aria-busy` pour l'état d'attente. Retirer le bouton du `.fileCell`.

### Lot 3 — `[HIGH, après arbitrage PO]` Aligner la règle « Justification » sur le besoin (F2)

**Pré-requis :** décision PO confirmant « écart ≥ 5 % ET consulté ».

**Approche (centraliser pour éviter une nouvelle divergence) :**
1. Créer une fonction pure de domaine, p.ex. `isJustificationRequired({ gapHigh, gapConsulted })`, dans `~/modules/domain`, et la rendre seule source de la règle.
2. Faire transiter un booléen **`gapHigh` par déclaration** (calculé via `hasGapsAboveThreshold` / `gapLevel` du domaine à partir des données de rémunération de la déclaration concernée) :
   - jusqu'à `computeContentTypeColumns` ([contentTypeColumns.ts:69-92](packages/app/src/modules/cseOpinion/contentTypeColumns.ts#L69)) en ajoutant les champs d'entrée correspondants ;
   - jusqu'à `page.tsx` ([:69-79](packages/app/src/app/avis-cse/etape/[step]/page.tsx#L69)) qui doit charger l'info d'écart ;
   - jusqu'à `finalize` ([cseOpinion.ts:253-272](packages/app/src/server/api/routers/cseOpinion.ts#L253)).
3. **Fermer la porte d'entrée en amont :** ne pas rendre la `GapConsultationCard` à l'étape 1 quand il n'y a pas d'écart ([Step1Opinions.tsx:255-278](packages/app/src/modules/cseOpinion/Step1Opinions.tsx#L255)), pour empêcher un `gapConsulted=true` sans écart.
4. **Réécrire** les tests qui gravent la règle erronée ([contentTypeColumns.test.ts:36](packages/app/src/modules/cseOpinion/__tests__/contentTypeColumns.test.ts#L36), [cseOpinion.finalize.test.ts:330,374](packages/app/src/server/api/routers/__tests__/cseOpinion.finalize.test.ts#L330)) pour croiser `(gapHigh) × (gapConsulted)`.

### Lot 4 — `[MEDIUM]` Reste de la fidélité visuelle (F6, F7, F7b, F7c)

- **F6 (taille fichier) :** ajouter `size` au type `UploadedFile`, le remonter depuis `getFiles` ([cseOpinion.ts:95-111](packages/app/src/server/api/routers/cseOpinion.ts#L95)), afficher « PDF · {formatFileSize(size)} ». **Factoriser** `formatFileSize` (aujourd'hui local à `FileUpload`) dans un util partagé.
- **F7 (checks ✓ récap) :** liste sans puce + `fr-icon-check-line` `aria-hidden` par item dans `OpinionSummaryBox`.
- **F7b (alerte upload dismissible) :** à valider avec le PO. `FileUpload` est **partagé** : décider si le passage `fr-message` -> `fr-alert` dismissible vaut pour tous les flux ou seulement CSE. Aligner le wording.
- **F7c (indicateur « Enregistré ») :** badge piloté par `setTypesMutation.isSuccess/isPending` dans la zone d'en-tête, `aria-live="polite"`.

### Lot 5 — `[MEDIUM]` Durcissement backend (défense en profondeur)

- **Validation serveur des colonnes autorisées :** `setFileContentTypes` ([cseOpinion.ts:126-181](packages/app/src/server/api/routers/cseOpinion.ts#L126)) accepte aujourd'hui n'importe quel couple `(declarationNumber, type)` propriétaire du fichier, sans vérifier qu'il correspond à une colonne réellement affichée. Re-dériver côté serveur l'ensemble autorisé (mêmes entrées que `computeContentTypeColumns`, y compris `gapHigh` du Lot 3) et rejeter (`BAD_REQUEST`) toute association hors de cet ensemble. Mutualise la dérivation avec le Lot 3.
- **Aligner `hasSecondDeclaration` :** la matrice ([page.tsx:68](packages/app/src/app/avis-cse/etape/[step]/page.tsx#L68)) utilise `hasSubmittedSecondDeclaration`, `finalize` ([cseOpinion.ts:249-251](packages/app/src/server/api/routers/cseOpinion.ts#L249)) la présence de lignes `cseOpinions` n°2. Sources différentes (cohérence reposant sur un invariant implicite). Aligner sur une source unique, ou tester explicitement l'invariant.

### Lot 6 — `[HIGH]` Combler les tests (F9, F10, F3)

- **Verrou visuel (corrige F9) :** assertion qui détecte l'invisibilité (test unitaire sur l'absence de `fr-sr-only` au label, et/ou e2e `toBeVisible`/`toHaveScreenshot` sur le carré). **Sans ce verrou, aucun fix de F1 n'est protégé.**
- **Scénarios e2e manquants (F10) :** au moins un parcours `fillCseStep1(page, true)` (2 déclarations, 4 colonnes), un parcours gap consulté (colonne Justification), un parcours **submit bloqué** (upload sans cocher -> bouton désactivé + alerte), un parcours **exclusivité 2 fichiers** (S5/S6), un parcours **reprise** (cocher, recharger, vérifier l'état). Le helper expose déjà les options `columns` / `hasSecondDeclaration`.
- **Tests RGAA (F3) :** une fois `disabled` natif remplacé par `aria-disabled` + `aria-describedby`, couvrir : case verrouillée focusable + cause annoncée.

---

## 8. Ordre recommandé

```
Lot 1 (checkbox visibles)          <- débloque l'usage, urgent
  + Lot 6.verrou visuel            <- protège le fix immédiatement
Lot 2 (tooltips + colonne supprimer)
Lot 3 (règle écart ≥ 5 %)          <- conditionné à l'arbitrage PO
  + Lot 5 (durcissement backend)   <- mutualise la dérivation avec Lot 3
Lot 4 (taille, checks, alerte, badge)
Lot 6.reste (scénarios e2e)
```

Lots 1, 2, 4 sont des écarts purement UI/visuels sans risque métier. Le Lot 3 touche la règle métier et **demande une décision PO** avant implémentation. Le Lot 5 sécurise l'API indépendamment du front.
