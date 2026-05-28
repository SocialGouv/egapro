# Comment Formats

> **Used by**: tout agent qui poste un commentaire ou écrit dans une issue GitHub (`product-owner`, `architect`, `bug-analyst`, `code-dev`, `functional-validator`, `review-fixer`, `designer`, `design-validator`). Enforced à la relecture par l'utilisateur et indirectement par `structural-auditor` quand des agents amendent du markdown.

Ce fichier définit la **structure exacte** des artefacts texte que les agents posent sur GitHub : headers obligatoires, ordre des sections, où vit chaque artefact (body vs. commentaire). L'objectif est qu'un humain ou un agent suivant retrouve **toujours** l'info au même endroit, sans avoir à scruter un long pavé.

---

## Règle 0 — Le body de l'issue est sacré

**Le body d'une issue est réservé à l'utilisateur humain (ou à l'auteur original de l'issue).** Aucun agent ne réécrit, n'amende, ne reformule, ni ne complète le body après création — pas même pour clarifier, pas même pour corriger un typo.

**Unique exception** : `architect` en mode `epic-create` ou `epic-enrich` écrit le body des **sub-issues qu'il vient de créer lui-même** via `gh issue create`. Une fois cette sub-issue créée, son body est lui aussi figé pour les passes suivantes.

Toute analyse, scénario, screenshot, diagnostic, verdict, ou validation produit·e par un agent vit dans un **commentaire séparé** avec un header `## …` standardisé (sections ci-dessous).

Conséquences pratiques :
- `product-owner` mode `enrich` n'édite **jamais** le body de l'epic, même si la demande utilisateur a évolué (il ajoute un commentaire `## Besoin métier (révisé YYYY-MM-DD)`).
- `architect` mode `epic-enrich` peut amender le body d'une sub-issue **qu'il a créée précédemment** (statut `To Do`) ; ne touche **jamais** au body de l'epic ni à une issue qu'il n'a pas créée.
- `architect` mode `task` n'édite **jamais** le body de la task — son spec va exclusivement dans le commentaire `## Analyse architecte`.
- `bug-analyst` n'édite **jamais** le body du bug — son analyse va dans le commentaire `## Analyse du bug`.

---

## Conventions communes

- **Headers** en h2 (`## …`). Pas de h1 dans un commentaire (réservé au titre de l'issue).
- **Préfixes de verdict** : `## <Agent>: <VERDICT>` quand l'agent retourne un verdict machine-lisible (functional-validator, design-validator).
- **Identifiants stables** : `S1, S2, …` pour les scénarios (jamais renumérotés en mode `enrich`).
- **Validation utilisateur** : un commentaire `[Validation utilisateur] <message>` sépare clairement le « prêt pour la suite » du draft. Toujours posté en dernier par chaque agent.
- **Screenshots & images** : embeds inline via URL gist publique (`![label](https://gist.githubusercontent.com/.../raw/...)`). Jamais de chemin `/tmp/...` (cf. mémoire utilisateur `feedback_github_outputs_must_be_visible`).
- **Données** : exemples toujours fictifs (`SIREN 123456789`, `email@example.fr`, `Société Démo`). Jamais de PII ni de secret (cf. `rules/git-artefact-hygiene.md`).
- **Langue** : français pour le contenu utilisateur (titres de sections, scénarios). Identifiants techniques (fichiers, classes) en anglais.

---

## 1. `product-owner` mode `create` / `enrich`

### 1.a Body de l'epic (mode `create` uniquement)

**Une seule chose** : citation verbatim (ou très légèrement reformulée) de la demande utilisateur originale. Pas d'analyse, pas de scénarios. Format suggéré :

```markdown
> Citation de la demande originale ici.
> Sur plusieurs lignes si besoin.
```

### 1.b Commentaire `## Besoin métier`

Posté **après** la création de l'epic, **avant** `## Analyse PO`. 3 à 5 phrases.

```markdown
## Besoin métier

<Qui (utilisateurs cibles) — Pourquoi (problème à résoudre) — Quelle règle métier sous-jacente — À quelle feature existante ça se rattache (références à `docs/features.md` quand pertinent).>
```

Mode `enrich` : si une révision du besoin est nécessaire, poster **un nouveau commentaire** `## Besoin métier (révisé YYYY-MM-DD)` qui pointe vers le précédent (`> Révise le commentaire du <date> · raison : <résumé EXTRA_CONTEXT>`). Ne jamais éditer le commentaire historique.

### 1.c Commentaire `## Analyse PO`

Le découpage formel exécutable. Sections **dans cet ordre exact** :

```markdown
## Analyse PO

### Contexte produit

<2-3 phrases sur comment cette feature s'insère dans l'app actuelle : depuis quelle page on y accède, quelles features existantes elle touche, quelles features documentées dans `docs/features.md` elle prolonge ou modifie.>

### État actuel de l'app

<Description courte de ce qui existe aujourd'hui sur cette zone, avec screenshots inline embeds gist :

- Page X (route `/path`) — `![État actuel page X](https://gist.githubusercontent.com/.../raw/screenshot-page-x-desktop.png)`
- Composant Y (état hover / mobile) — `![Composant Y mobile](https://gist.githubusercontent.com/.../raw/...)`

Au minimum 1 screenshot desktop + 1 screenshot mobile par écran impacté.>

### User stories

1. En tant que <persona>, je veux <action>, afin de <bénéfice>.
2. ...

### Scénarios de test

**S1 — <Titre court du scénario>**
- **Étant donné** <état initial>
- **Quand** <action utilisateur>
- **Alors** <résultat observable>

**S2 — ...**

(Identifiants S1, S2, … stables en mode `enrich` : ne jamais renuméroter ; nouveaux scénarios ajoutés à la suite.)

### Hors scope

- <Ce que l'epic ne couvre PAS, explicitement>
- ...

### Critères d'acceptation de l'epic

- [ ] <Critère observable 1>
- [ ] <Critère observable 2>
- [ ] ...
```

### 1.d Commentaire de validation

```markdown
[Validation utilisateur] Epic validé — prêt pour phase architect
```

(ou `Epic enrichi` en mode enrich)

---

## 2. `architect` mode `epic-create` / `epic-enrich`

### 2.a Body des sub-issues créées

**Seul cas où un agent écrit dans un body** : à `gh issue create` de la sub-issue. Format obligatoire — voir `rules/ticket-spec-format.md` (section « Structure obligatoire »).

Pour les sub-issues UI, **inclure obligatoirement** dans la section `## Scénarios de test` :
- Les identifiants de scénarios PO pertinents (`S1`, `S2`, … cités depuis l'epic parent)
- Les screenshots gist correspondants embeddés inline depuis l'analyse PO

### 2.b Commentaire final sur l'epic

```markdown
[Validation utilisateur] Architecture validée — N tickets créés, prêt pour /implement
```

---

## 3. `architect` mode `task`

### 3.a Commentaire `## Analyse architecte`

Posté sur la task. **Le body reste intact.** Format :

```markdown
## Analyse architecte

### Contexte

<1-3 phrases : à quelle feature appartient ce ticket, quel est le "pourquoi" métier (référence epic parent si applicable).>

### Résultat attendu

<Description précise et **observable** du résultat final attendu. Inclure :
- Le comportement utilisateur exact (avant → après)
- Les écrans / composants finaux (avec screenshots gist embeddés si UI)
- Les valeurs / formats attendus (texte exact, classes DSFR, structure DOM si pertinent)
- Ce qui doit rester inchangé (régression à éviter)>

### Fichiers impactés

- `~/modules/<feature>/components/<Name>.tsx` (création)
- `~/modules/<feature>/schemas.ts` (modification)
- `~/server/api/routers/<name>.ts` (modification)

### Changement attendu

<Description précise du code à produire ou modifier (props, méthodes, types de retour, imports, comportement exact).>

### Scénarios de validation

**S1 — <Titre>**
- **Étant donné** ...
- **Quand** ...
- **Alors** ... (résultat observable)

**S2 — ...** (si applicable)

(Ces scénarios seront rejoués par `functional-validator` après l'implémentation.)

### Référence Figma

<URL Figma précise (avec node-id) si UI, ou "N/A". Une URL = un node.>

### Tests recommandés

<Suivre `rules/test-strategy.md` :
- Unit tests (testing-library / vitest) pour validation forms, logique pure, helpers
- E2E uniquement si parcours critique entier ET aucun E2E existant ne le couvre (sinon adapter l'existant)>

### Critères d'acceptation

- [ ] <Critère vérifiable 1>
- [ ] <Critère vérifiable 2>
- [ ] Tests ajoutés et verts (`pnpm test`)
- [ ] Typecheck vert (`pnpm typecheck`)
- [ ] Lint vert (`pnpm lint:check`)
- [ ] Scénarios S1..SN rejoués sans erreur par `functional-validator`

### Depends on

- #<N1>  (ou "N/A")

### Requires services

- <service docker-compose>  (ou omettre si core stack suffit)
```

### 3.b Commentaire de validation

```markdown
[Validation utilisateur] Analyse validée — prêt pour /implement
```

---

## 4. `bug-analyst` — `## Analyse du bug`

Posté sur le bug. **Le body reste intact.**

```markdown
## Analyse du bug

### Reproduction

✓ confirmée (sous-stratégie : <fonctionnel local | env-specific | visual mismatch>)

### État actuel

<Description du comportement observé, avec screenshots gist embeddés si visual :
- État actuel : `![État buggué](https://gist.githubusercontent.com/.../raw/...)`
- État attendu (depuis Figma ou doc) : `![Attendu](https://gist.githubusercontent.com/.../raw/...)`

Pour les bugs non-visuels : logs / stack traces / requête réseau échouée (scrubbés des secrets).>

### Root cause

`~/modules/<...>/<file>.tsx:NNN` — <Explication 2-3 phrases : pourquoi le bug se produit, ce qui dans le code est faux.>

### Fichiers à modifier

- `~/modules/<...>/<file>.tsx:NNN` (raison)
- `~/modules/<...>/<schema>.ts` (raison)

### Fix proposé

<2-3 lignes : approche du fix, pas du code complet. C'est `code-dev` qui code.>

### Scénario de vérification

**S1 — <Titre>**
- **Étant donné** <état initial reproducteur>
- **Quand** <action>
- **Alors** <résultat attendu après fix>

(Sera rejoué par `functional-validator` après le fix.)

### Tests recommandés

<Selon `rules/test-strategy.md` :
- Bug logique métier / domain → unit test (vitest) à côté du module
- Bug UI / comportement utilisateur → préférer testing-library (component test) ; E2E seulement si parcours critique non couvert
- Bug visual mismatch → pas de test automatisé, relecture structurelle Figma>

### Tags

- Label `complexe` : <appliqué | none> (raison si appliqué)
```

### 4.b Commentaire de validation

```markdown
[Validation utilisateur] Analyse validée — prêt pour /implement
```

---

## 5. `functional-validator` — verdict QA

Posté sur le **ticket** (Feature sub-task / Task / Bug), pas sur la PR.

```markdown
## Functional Validator: <PASS | RETRY | REFACTO>

Ticket: #NNN
PR: #PPP
Scénarios rejoués: S1 ✓, S2 ✗, S3 ✓
Erreurs console: <0 | description>
Erreurs réseau: <0 | description>

### Détail des écarts

<Pour chaque scénario ✗ :
**S2** — <Titre>
- Attendu : <résultat scénario>
- Observé : <ce qui s'est passé réellement, avec screenshot gist si UI>
- Hypothèse : <où chercher dans le code>>

### Verdict

<Justification 1-2 lignes du verdict :
- PASS : tous scénarios OK, pas d'erreur
- RETRY : écart mineur corrigeable, à fixer (max 2 retry consécutifs)
- REFACTO : écart structurel, ticket retourne en To Do>
```

---

## 6. `code-dev` — body de PR

Premier ligne **obligatoire** : `Closes #NNN` (active le force-link PR ↔ issue).

```markdown
Closes #NNN

## Résumé

<2-3 bullet points sur les changements>

## Test plan

- [ ] Scénarios S1..SN rejoués localement
- [ ] Tests unitaires verts (`pnpm test`)
- [ ] Typecheck vert
- [ ] CI verte attendue

## Screenshots (si UI)

Desktop : `![Desktop](https://gist.githubusercontent.com/.../raw/...)`
Mobile : `![Mobile](https://gist.githubusercontent.com/.../raw/...)`
```

---

## 7. `code-dev` — réponses aux reviews bot/humain

Réponse en thread (`gh api -X POST repos/.../pulls/$PR/comments` avec `in_reply_to`) :

```markdown
<Réponse directe au point soulevé :
- Correction appliquée : pointer vers le commit qui adresse le point
- Non pertinent : justification 1-2 lignes
- Question : réponse technique factuelle>
```

**Jamais d'ignorance silencieuse** — chaque thread post-push doit avoir au moins une réponse de l'auteur de la PR (post-condition 9d.2bis du `code-dev`).

---

## 8. `designer` / `design-validator` (si pipeline UI)

Voir `rules/visual-quality-validation.md` pour le détail des verdicts. Format de header identique à functional-validator (`## Design Validator: <PASS | RETRY | REFACTO>`). Screenshots embeddés inline depuis gist.

---

## Récap : qui poste où

| Agent | Body | Commentaires | Verdicts |
|---|---|---|---|
| `product-owner` | Epic à création (mode create) | `## Besoin métier`, `## Analyse PO`, `[Validation utilisateur]` | — |
| `architect` epic-* | Sub-issues à création | `[Validation utilisateur]` sur epic | — |
| `architect` task | — | `## Analyse architecte`, `[Validation utilisateur]` | — |
| `bug-analyst` | — | `## Analyse du bug`, `[Validation utilisateur]` | — |
| `code-dev` | PR (création) | Réponses aux threads de review | — |
| `functional-validator` | — | — | `## Functional Validator: ...` sur le ticket |
| `design-validator` | — | — | `## Design Validator: ...` sur le ticket |
| `review-fixer` | — | Réponses aux threads | — |
