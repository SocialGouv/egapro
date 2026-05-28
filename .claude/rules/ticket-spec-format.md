# Ticket Spec Format

> **Used by**: `architect` (écrit le spec — body en mode epic-*, commentaire `## Analyse architecte` en mode task), `bug-analyst` (commentaire `## Analyse du bug` qui sert de spec implicite pour les bugs), `code-dev` (valide le format avant exécution, retourne en To Do si manquant), skill `/implement` (préconditions). Complète `rules/comment-formats.md` (templates) et `rules/test-strategy.md` (choix du type de test).

Format standardisé des tickets **code** consommés par `code-dev` (Sonnet par défaut, Opus si label `complexe`). Selon le type d'issue, l'emplacement du spec change :

| Type d'issue | Source du spec | Body |
|---|---|---|
| **Feature** (sub-issue d'epic) | **Body** de la sub-issue, écrit par l'architect en mode epic-* | Body écrit par l'architect à création |
| **Task** | Commentaire **`## Analyse architecte`** posté par l'architect en mode task | **Body intact** (rédaction humaine de la demande originale) |
| **Bug** | Commentaire **`## Analyse du bug`** posté par `bug-analyst` (root cause + fix proposé + scénario de vérification) | **Body intact** (rapport bug rédigé par l'utilisateur) |

> **Rappel `comment-formats.md` Règle 0** : Le body d'une issue Task ou Bug est **réservé à l'humain qui l'a ouverte**. Architect et bug-analyst ne le réécrivent jamais. Toute analyse va dans un commentaire séparé.

Un spec bien formaté permet à un dev Sonnet d'exécuter la tâche sans ambiguïté ni questions supplémentaires. Si le spec attendu (selon le type) est manquant, `code-dev` doit retourner le ticket en `To Do` avec un commentaire listant les manques, plutôt qu'improviser.

---

## Structure obligatoire

```markdown
## Contexte

<1 à 3 phrases : à quelle feature appartient ce ticket, quel est le "pourquoi" métier.
Référencer l'epic parent : "Issue #NNN".>

## Résultat attendu

<Description précise et **observable** du résultat final attendu :
- Le comportement utilisateur exact (avant → après)
- Les écrans / composants finaux (avec screenshots gist embeddés inline si UI : `![desktop](https://gist.githubusercontent.com/.../raw/...)`)
- Les valeurs / formats attendus (texte exact, classes DSFR, structure DOM si pertinent)
- Ce qui doit rester inchangé (régression à éviter)

Cette section sert de référence pour `code-dev` pendant l'implémentation et pour `functional-validator` lors de la validation. Elle doit être suffisamment détaillée pour qu'un dev junior puisse savoir s'il a fini ou non.>

## Fichiers impactés

- `~/modules/<feature>/components/<Name>.tsx` (création)
- `~/modules/<feature>/schemas.ts` (modification)
- `~/server/api/routers/<name>.ts` (modification)

## Changement attendu

<Description précise du code à produire ou modifier. Pas d'ambiguïté :
- quelles props / quelles méthodes
- quel type de retour
- quels imports
- quel comportement exact

Pas de décision architecturale ni de "à toi de voir" — l'architect a tranché.>

## Scénarios de validation

<Sub-issues d'epic : recopier ici les scénarios PO pertinents (`S1`, `S2`, …) depuis l'epic parent, incluant les screenshots gist inline associés (état actuel + état attendu si UI).

Tasks standalone et Bugs : scénarios spécifiques au ticket au format Gherkin simplifié :

**S1 — <Titre court>**
- **Étant donné** ... (état initial)
- **Quand** ... (action utilisateur)
- **Alors** ... (résultat observable)

**S2 — ...** (si applicable)

Ces scénarios seront **rejoués par `functional-validator`** après l'implémentation pour valider que le résultat attendu est atteint. Ils doivent être :
- **Observables** en black-box (pas de référence à l'état interne)
- **Reproductibles** sans data setup ambigu
- **Distincts** entre eux (pas deux scénarios qui testent la même chose)>

## Référence Figma

<Si le ticket touche de l'UI, **impérativement** citer l'URL Figma précise du / des écran(s) ou composant(s) concerné(s), avec le node ID quand pertinent (`?node-id=...`). `code-dev` consommera cette URL via le MCP `figma-dev` (`get_design_context` pour la structure, `get_screenshot` pour la vue d'ensemble) au moment de l'implémentation, en suivant `rules/figma-workflow.md` (Phase 3 pixel-perfect + Phase 4 validation visuelle qu'il fait lui-même).

Format :

- Écran principal : <Figma URL avec node-id>
- Composant X : <Figma URL avec node-id>     # si plusieurs nodes pertinents
- État Y (hover / error / mobile) : <Figma URL avec node-id>

**Une URL = un node Figma précis.** Pas d'URL générique de fichier Figma sans node-id : `code-dev` doit pouvoir aller direct au bon écran, sans deviner.

Si pas d'UI, écrire "N/A".>

## Tests recommandés

<Selon `rules/test-strategy.md` — préciser le type de test attendu :

- "Tests unitaires (vitest) sur `~/modules/.../schemas.ts` + tests component (testing-library) sur `<Form>.tsx`"
- "Adapter `packages/app/src/e2e/declaration.e2e.ts` pour couvrir la nouvelle étape"
- "Pas de nouveau E2E — la couverture vient des component tests"

**Pas de ticket E2E-only** sauf si le ticket explicite la demande d'un nouveau parcours E2E (cf. test-strategy.md §A).>

## Critères d'acceptation

- [ ] <critère vérifiable 1>
- [ ] <critère vérifiable 2>
- [ ] Tests ajoutés et verts (`pnpm test`)
- [ ] Typecheck vert (`pnpm typecheck`)
- [ ] Lint vert (`pnpm lint:check`)
- [ ] Scénarios S1..SN rejoués sans erreur par `functional-validator`
- [ ] (si UI) Vérification visuelle vs. Figma faite par `code-dev` (screenshots dev server vs. lecture structurelle `get_design_context`, voir `rules/figma-workflow.md`)

## Depends on

<Liste des tickets dont celui-ci dépend (le code/schéma de ces tickets doit exister avant que celui-ci puisse être implémenté). Un ticket par ligne avec le numéro GitHub :

- #<N1>
- #<N2>

Si aucune dépendance, écrire "N/A" ou omettre la section entièrement.>

## Requires services

<Services docker-compose optionnels dont le ticket a besoin en plus du core (db, minio, maildev, valkey qui sont lancés par défaut). Un service par ligne :

- clamavd  (antivirus, nécessaire si le ticket touche à l'upload de fichiers)

Si le ticket n'a besoin que du core, omettre la section entièrement.>
```

## Règles de rédaction

- **Un ticket = une unité cohérente** : si les critères d'acceptation dépassent 8 éléments, découper en deux tickets et exprimer la dépendance via la section `Depends on`.
- **Pas de décision architecturale** dans le ticket : l'architect a déjà tranché. Le dev exécute.
- **Pas de "voir le code pour comprendre"** : les fichiers à lire doivent être listés explicitement.
- **Résultat attendu observable** : la section `## Résultat attendu` est le contrat — elle doit être suffisamment détaillée pour que `code-dev` sache quand il a fini, et pour que `functional-validator` puisse trancher PASS/RETRY/REFACTO.
- **Scénarios + screenshots gist** : pour les tickets UI, les scénarios doivent référencer des screenshots gist (état actuel + état attendu). Pas de chemin `/tmp/...`.
- **Préférence tests unitaires** : voir `rules/test-strategy.md`. Ne jamais créer un ticket dont le seul objectif est d'ajouter un E2E, sauf si la demande est explicite.
- **Le label `complexe`** est ajouté uniquement si la tâche demande un raisonnement multi-étapes non trivial (refacto multi-fichiers, perf critique, algo complexe). Par défaut, Sonnet suffit.
- **Dépendances inter-tickets** : listées dans la section `Depends on` du body. `/epic` parse cette section pour gater le dispatch — `T2` est dispatché dès que `T1` a été squash-mergé dans la branche d'intégration `epic/<N>` (la PR de `T1` validée par la pipeline est auto-mergée par `process_tick_result.sh`, GitHub supprime la branche, `T2` peut alors brancher sur `epic/<N>` qui contient désormais le code de `T1`). L'exécution n'attend donc jamais la review humaine d'une PR de sous-ticket.
- **Parent issue GitHub** : utilisé uniquement pour pointer vers l'epic (relation epic → ticket). **Pas** pour exprimer des dépendances inter-tickets — utiliser `Depends on` à la place.
