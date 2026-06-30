# Non-conformity verification (ultra11y)

For EACH entry, open the file at the cited line and assign a verdict in
`VERIFY.todo.json` (field `verdict`), with a `note`:

- `supported` — the non-conformity is real and correctly tied to the criterion;
- `partial` — real but the criterion/wording is imprecise;
- `refuted` — false (the cited element is actually conforming);
- `unsupported` — the cited element is not enough to decide.

> --semantic mode: confirm the cited snippet actually **supports** the non-conformity.

Then: `ultra11y verify --apply VERIFY.todo.json` (fails if any verdict is refuted/unsupported).

- [ ] #1 **3.1** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 3.1 :
      - Pour chaque mot ou ensemble de mots dont la mise en couleur est porteuse d’information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque indication de couleur donnée par un texte, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque image véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque propriété CSS déterminant une couleur et véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque média temporel véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque média non temporel véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
- [ ] #2 **5.1** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.1 :
      - Pour chaque tableau de données complexe, un résumé est-il disponible ?
- [ ] #3 **5.2** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.2 :
      - Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ?
- [ ] #4 **5.4** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.4 :
      - Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ?
- [ ] #5 **5.5** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.5 :
      - Pour chaque tableau de données ayant un titre, ce titre permet-il d’identifier le contenu du tableau de données de manière claire et concise ?
- [ ] #6 **5.6** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.6 :
      - Pour chaque tableau de données, chaque en-tête de colonne s’appliquant à la totalité de la colonne vérifie-t-il une de ces conditions ?
      - L’en-tête de colonnes est structuré au moyen d’une balise `<th>` ;
      - L’en-tête de colonnes est structuré au moyen d’une balise pourvue d’un attribut WAI-ARIA `role="columnheader"`.
      - Pour chaque tableau de données, chaque en-tête de ligne s’appliquant à la totalité de la ligne vérifie-t-il une de ces conditions ?
      - L’en-tête de lignes est structuré au moyen d’une balise `<th>` ;
      - L’en-tête de lignes est structuré au moyen d’une balise pourvue d’un attribut WAI-ARIA `role="rowheader"`.
- [ ] #7 **5.7** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.7 :
      - Pour chaque contenu de balise `<th>` s’appliquant à la totalité de la ligne ou de la colonne, la balise `<th>` respecte-t-elle une de ces conditions (hors cas particuliers) ?
      - La balise `<th>` possède un attribut `id` unique ;
      - La balise `<th>` possède un attribut `scope` ;
      - La balise `<th>` possède un attribut WAI-ARIA `role="rowheader"` ou `role="columnheader"`.
      - Pour chaque contenu de balise `<th>` s’appliquant à la totalité de la ligne ou de la colonne et possédant un attribut `scope`, la balise `<th>` vérifie-t-elle une de ces conditions ?
      - La balise `<th>` possède un attribut `scope` avec la valeur `"row"` pour les en-têtes de ligne ;
- [ ] #8 **5.8** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.8 :
      - Chaque tableau de mise en forme (balise `<table>`) vérifie-t-il ces conditions ?
      - Le tableau de mise en forme (balise `<table>`) n’a pas d’attribut `summary` (sinon vide) et ne contient pas de balises `<caption>`, `<th>`, `<thead>`, `<tfoot>` ou de balises ayant un attribut WAI-ARIA `role="rowheader"`, `role="columnheader"` ;
      - Les cellules du tableau de mise en forme (balises `<td>`) ne possèdent pas d’attributs `scope`, `headers` et `axis`.
- [ ] #9 **7.3** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 7.3 :
      - Chaque élément possédant un gestionnaire d’événement contrôlé par un script vérifie-t-il une de ces conditions (hors cas particuliers) ?
      - L’élément est accessible par le clavier et tout dispositif de pointage ;
      - Un élément accessible par le clavier et tout dispositif de pointage permettant de réaliser la même action est présent dans la page.
      - Un script ne doit pas supprimer le focus d’un élément qui le reçoit. Cette règle est-elle respectée (hors cas particuliers) ?
- [ ] #10 **8.9** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 8.9 :
      - Dans chaque page web les balises (à l’exception de `<div>`, `<span>` et `<table>`) ne doivent pas être utilisées uniquement à des fins de présentation. Cette règle est-elle respectée ?
- [ ] #11 **9.1** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.1 :
      - Dans chaque page web, la hiérarchie entre les titres (balise `<hx>` ou balise possédant un attribut WAI-ARIA `role="heading"` associé à un attribut WAI-ARIA `aria-level`) est-elle pertinente ?
      - Dans chaque page web, le contenu de chaque titre (balise `<hx>` ou balise possédant un attribut WAI-ARIA `role="heading"` associé à un attribut WAI-ARIA `aria-level`) est-il pertinent ?
      - Dans chaque page web, chaque passage de texte constituant un titre est-il structuré à l’aide d’une balise `<hx>` ou d’une balise possédant un attribut WAI-ARIA `role="heading"` associé à un attribut WAI-ARIA `aria-level` ?
- [ ] #12 **9.2** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.2 :
      - Dans chaque page web, la structure du document vérifie-t-elle ces conditions (hors cas particuliers) ?
      - La zone d’en-tête de la page est structurée via une balise `<header>` ;
      - Les zones de navigation principales et secondaires sont structurées via une balise `<nav>` ;
      - La balise `<nav>` est réservée à la structuration des zones de navigation principales et secondaires ;
      - La zone de contenu principal est structurée via une balise `<main>` ;
      - La structure du document utilise une balise `<main>` visible unique ;
- [ ] #13 **9.3** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.3 :
      - Dans chaque page web, les informations regroupées visuellement sous forme de liste non ordonnée vérifient-elles une de ces conditions ?
      - La liste utilise les balises HTML `<ul>` et `<li>` ;
      - La liste utilise les attributs WAI-ARIA `role="list"` et `role="listitem"`.
      - Dans chaque page web, les informations regroupées visuellement sous forme de liste ordonnée vérifient-elles une de ces conditions ?
      - La liste utilise les balises HTML `<ol>` et `<li>` ;
      - La liste utilise les attributs WAI-ARIA `role="list"` et `role="listitem"`.
- [ ] #14 **9.4** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.4 :
      - Dans chaque page web, chaque citation courte utilise-t-elle une balise `<q>` ?
      - Dans chaque page web, chaque bloc de citation utilise-t-il une balise `<blockquote>` ?
- [ ] #15 **10.1** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 10.1 :
      - Dans chaque page web, les balises servant à la présentation de l’information ne doivent pas être présentes dans le code source généré des pages. Cette règle est-elle respectée ?
      - Dans chaque page web, les attributs servant à la présentation de l’information ne doivent pas être présents dans le code source généré des pages. Cette règle est-elle respectée ?
      - Dans chaque page web, l’utilisation des espaces vérifie-t-elle ces conditions ?
      - Les espaces ne sont pas utilisées pour séparer les lettres d’un mot ;
      - Les espaces ne sont pas utilisées pour simuler des tableaux ;
      - Les espaces ne sont pas utilisées pour simuler des colonnes de texte.
- [ ] #16 **10.2** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 10.2 :
      - Dans chaque page web, l’information reste-t-elle présente lorsque les feuilles de styles sont désactivées ?
- [ ] #17 **11.1** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 11.1 :
      - Chaque champ de formulaire vérifie-t-il une de ces conditions ?
      - Le champ de formulaire possède un attribut WAI-ARIA `aria-labelledby` référençant un passage de texte identifié ;
      - Le champ de formulaire possède un attribut WAI-ARIA `aria-label` ;
      - Une balise `<label>` ayant un attribut `for` est associée au champ de formulaire ;
      - Le champ de formulaire possède un attribut `title` ;
      - Un bouton adjacent au champ de formulaire lui fournit une étiquette visible et un élément `<label>` visuellement caché ou un attribut WAI-ARIA `aria-label`, `aria-labelledby` ou `title` lui fournit un nom accessible.
- [ ] #18 **11.5** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 11.5 :
      - Les champs de même nature vérifient-ils l’une de ces conditions, si nécessaire ?
      - Les champs de même nature sont regroupés dans une balise `<fieldset>` ;
      - Les champs de même nature sont regroupés dans une balise possédant un attribut WAI-ARIA `role="group"` ;
      - Les champs de même nature de type radio (`<input type="radio">`) ou balises possédant un attribut WAI-ARIA `role="radio"`) sont regroupés dans une balise possédant un attribut WAI-ARIA `role="radiogroup"` ou `role="group"`.
- [ ] #19 **11.6** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 11.6 :
      - Chaque regroupement de champs de même nature possède-t-il une légende ?
- [ ] #20 **11.7** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 11.7 :
      - Chaque légende associée à un regroupement de champs de même nature est-elle pertinente ?
- [ ] #21 **11.8** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 11.8 :
      - Pour chaque balise `<select>`, les items de même nature d’une liste de choix sont-ils regroupés avec une balise `<optgroup>`, si nécessaire ?
      - Dans chaque balise `<select>`, chaque balise `<optgroup>` possède-t-elle un attribut `label` ?
      - Pour chaque balise `<optgroup>` ayant un attribut `label`, le contenu de l’attribut `label` est-il pertinent ?
- [ ] #22 **12.6** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 12.6 :
      - Dans chaque page web où elles sont présentes, la zone d’en-tête, de navigation principale, de contenu principal, de pied de page et de moteur de recherche respectent-elles au moins une de ces conditions ?
      - La zone possède un rôle WAI-ARIA de type landmark correspondant à sa nature ;
      - La zone possède un titre dont le contenu permet de comprendre la nature du contenu de la zone ;
      - La zone peut être masquée par le biais d’un bouton précédent directement la zone dans l’ordre du code source ;
      - La zone peut être évitée par le biais d’un lien d’évitement précédent directement la zone dans l’ordre du code source ;
      - La zone peut être atteinte par le biais d’un lien d’accès rapide visible ou, à défaut, visible à la prise de focus.
- [ ] #23 **13.3** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 13.3 :
      - Dans chaque page web, chaque fonctionnalité de téléchargement d’un document bureautique vérifie-t-elle une de ces conditions ?
      - Le document en téléchargement est compatible avec l'accessibilité ;
      - Il en existe une version alternative en téléchargement compatible avec l'accessibilité ;
      - Il en existe une version alternative au format HTML compatible avec l'accessibilité.
- [ ] #24 **13.4** @ `packages/app/src/modules/declaration-remuneration/steps/jointEvaluation/JointEvaluationForm.tsx:87` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 13.4 :
      - Chaque document bureautique ayant une version accessible vérifie-t-il une de ces conditions ?
      - La version compatible avec l’accessibilité offre la même information ;
      - La version alternative au format HTML est pertinente et offre la même information.
- [ ] #25 **3.1** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 3.1 :
      - Pour chaque mot ou ensemble de mots dont la mise en couleur est porteuse d’information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque indication de couleur donnée par un texte, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque image véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque propriété CSS déterminant une couleur et véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque média temporel véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
      - Pour chaque média non temporel véhiculant une information, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ?
- [ ] #26 **5.1** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.1 :
      - Pour chaque tableau de données complexe, un résumé est-il disponible ?
- [ ] #27 **5.2** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.2 :
      - Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ?
- [ ] #28 **5.4** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.4 :
      - Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ?
- [ ] #29 **5.5** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.5 :
      - Pour chaque tableau de données ayant un titre, ce titre permet-il d’identifier le contenu du tableau de données de manière claire et concise ?
- [ ] #30 **5.6** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.6 :
      - Pour chaque tableau de données, chaque en-tête de colonne s’appliquant à la totalité de la colonne vérifie-t-il une de ces conditions ?
      - L’en-tête de colonnes est structuré au moyen d’une balise `<th>` ;
      - L’en-tête de colonnes est structuré au moyen d’une balise pourvue d’un attribut WAI-ARIA `role="columnheader"`.
      - Pour chaque tableau de données, chaque en-tête de ligne s’appliquant à la totalité de la ligne vérifie-t-il une de ces conditions ?
      - L’en-tête de lignes est structuré au moyen d’une balise `<th>` ;
      - L’en-tête de lignes est structuré au moyen d’une balise pourvue d’un attribut WAI-ARIA `role="rowheader"`.
- [ ] #31 **5.7** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.7 :
      - Pour chaque contenu de balise `<th>` s’appliquant à la totalité de la ligne ou de la colonne, la balise `<th>` respecte-t-elle une de ces conditions (hors cas particuliers) ?
      - La balise `<th>` possède un attribut `id` unique ;
      - La balise `<th>` possède un attribut `scope` ;
      - La balise `<th>` possède un attribut WAI-ARIA `role="rowheader"` ou `role="columnheader"`.
      - Pour chaque contenu de balise `<th>` s’appliquant à la totalité de la ligne ou de la colonne et possédant un attribut `scope`, la balise `<th>` vérifie-t-elle une de ces conditions ?
      - La balise `<th>` possède un attribut `scope` avec la valeur `"row"` pour les en-têtes de ligne ;
- [ ] #32 **5.8** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 5.8 :
      - Chaque tableau de mise en forme (balise `<table>`) vérifie-t-il ces conditions ?
      - Le tableau de mise en forme (balise `<table>`) n’a pas d’attribut `summary` (sinon vide) et ne contient pas de balises `<caption>`, `<th>`, `<thead>`, `<tfoot>` ou de balises ayant un attribut WAI-ARIA `role="rowheader"`, `role="columnheader"` ;
      - Les cellules du tableau de mise en forme (balises `<td>`) ne possèdent pas d’attributs `scope`, `headers` et `axis`.
- [ ] #33 **7.3** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 7.3 :
      - Chaque élément possédant un gestionnaire d’événement contrôlé par un script vérifie-t-il une de ces conditions (hors cas particuliers) ?
      - L’élément est accessible par le clavier et tout dispositif de pointage ;
      - Un élément accessible par le clavier et tout dispositif de pointage permettant de réaliser la même action est présent dans la page.
      - Un script ne doit pas supprimer le focus d’un élément qui le reçoit. Cette règle est-elle respectée (hors cas particuliers) ?
- [ ] #34 **8.9** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 8.9 :
      - Dans chaque page web les balises (à l’exception de `<div>`, `<span>` et `<table>`) ne doivent pas être utilisées uniquement à des fins de présentation. Cette règle est-elle respectée ?
- [ ] #35 **9.1** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.1 :
      - Dans chaque page web, la hiérarchie entre les titres (balise `<hx>` ou balise possédant un attribut WAI-ARIA `role="heading"` associé à un attribut WAI-ARIA `aria-level`) est-elle pertinente ?
      - Dans chaque page web, le contenu de chaque titre (balise `<hx>` ou balise possédant un attribut WAI-ARIA `role="heading"` associé à un attribut WAI-ARIA `aria-level`) est-il pertinent ?
      - Dans chaque page web, chaque passage de texte constituant un titre est-il structuré à l’aide d’une balise `<hx>` ou d’une balise possédant un attribut WAI-ARIA `role="heading"` associé à un attribut WAI-ARIA `aria-level` ?
- [ ] #36 **9.2** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.2 :
      - Dans chaque page web, la structure du document vérifie-t-elle ces conditions (hors cas particuliers) ?
      - La zone d’en-tête de la page est structurée via une balise `<header>` ;
      - Les zones de navigation principales et secondaires sont structurées via une balise `<nav>` ;
      - La balise `<nav>` est réservée à la structuration des zones de navigation principales et secondaires ;
      - La zone de contenu principal est structurée via une balise `<main>` ;
      - La structure du document utilise une balise `<main>` visible unique ;
- [ ] #37 **9.3** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.3 :
      - Dans chaque page web, les informations regroupées visuellement sous forme de liste non ordonnée vérifient-elles une de ces conditions ?
      - La liste utilise les balises HTML `<ul>` et `<li>` ;
      - La liste utilise les attributs WAI-ARIA `role="list"` et `role="listitem"`.
      - Dans chaque page web, les informations regroupées visuellement sous forme de liste ordonnée vérifient-elles une de ces conditions ?
      - La liste utilise les balises HTML `<ol>` et `<li>` ;
      - La liste utilise les attributs WAI-ARIA `role="list"` et `role="listitem"`.
- [ ] #38 **9.4** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 9.4 :
      - Dans chaque page web, chaque citation courte utilise-t-elle une balise `<q>` ?
      - Dans chaque page web, chaque bloc de citation utilise-t-il une balise `<blockquote>` ?
- [ ] #39 **10.1** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 10.1 :
      - Dans chaque page web, les balises servant à la présentation de l’information ne doivent pas être présentes dans le code source généré des pages. Cette règle est-elle respectée ?
      - Dans chaque page web, les attributs servant à la présentation de l’information ne doivent pas être présents dans le code source généré des pages. Cette règle est-elle respectée ?
      - Dans chaque page web, l’utilisation des espaces vérifie-t-elle ces conditions ?
      - Les espaces ne sont pas utilisées pour séparer les lettres d’un mot ;
      - Les espaces ne sont pas utilisées pour simuler des tableaux ;
      - Les espaces ne sont pas utilisées pour simuler des colonnes de texte.
- [ ] #40 **10.2** @ `packages/app/src/modules/declaration-remuneration/steps/CompliancePathChoice.tsx:127` (`fieldset.{common.readOnlyFieldset}`) — <fieldset> sans <legend> (ou légende vide) — regroupement de champs sans légende.
      RGAA 10.2 :
      - Dans chaque page web, l’information reste-t-elle présente lorsque les feuilles de styles sont désactivées ?

## Pre-completion checklist

- [ ] Every entry has a verdict (no `null`).
- [ ] No invented non-conformity: every `supported` verdict cites a real element at the given line.
- [ ] The report's “to assess” criteria (rendering / judgment) have been decided (or left as an explicit residual risk).
- [ ] For component-library-rendered code (DSFR…), the verdict relies on the **produced** HTML (build / `scan`), not the JSX source.
- [ ] `ultra11y verify --apply VERIFY.todo.json` is green again.
