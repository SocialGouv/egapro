# Ticket Spec Format

> **Used by**: `architect` (écrit le spec — body en mode epic-*, commentaire `## Analyse architecte` en mode task), `bug-analyst` (commentaire `## Analyse du bug` qui sert de spec implicite pour les bugs), `code-dev` (valide le format avant exécution, retourne en To Do si manquant), skill `/implement` (préconditions).

Format standardisé des tickets **code** consommés par `code-dev` (Sonnet par défaut, Opus si label `complexe`). Selon le type d'issue, l'emplacement du spec change :

| Type d'issue | Source du spec |
|---|---|
| **Feature** (sub-issue d'epic) | **Body** de la sub-issue, écrit par l'architect en mode epic-* |
| **Task** | Body = description originale (intacte) + commentaire **`## Analyse architecte`** posté par l'architect en mode task |
| **Bug** | Body = rapport bug (intact) + commentaire **`## Analyse du bug`** posté par `bug-analyst` (root cause + fix proposé, pas un spec complet — le protocole `bug-fix-workflow.md` prend le relais) |

Un spec bien formaté permet à un dev Sonnet d'exécuter la tâche sans ambiguïté ni questions supplémentaires. Si le spec attendu (selon le type) est manquant, `code-dev` doit retourner le ticket en `To Do` avec un commentaire listant les manques, plutôt qu'improviser.

---

## Structure obligatoire

```markdown
## Contexte

<1 à 3 phrases : à quelle feature appartient ce ticket, quel est le "pourquoi" métier.
Référencer l'epic parent : "Issue #NNN".>

## Fichiers impactés

- `~/modules/<feature>/components/<Name>.tsx` (création)
- `~/modules/<feature>/schemas.ts` (modification)
- `~/server/api/routers/<name>.ts` (modification)

## Changement attendu

<Description précise du code à produire ou modifier. Pas d'ambiguïté :
- quelles props / quelles méthodes
- quel type de retour
- quels imports
- quel comportement exact>

## Scénarios de test

<Référencer les scénarios PO par identifiant (ex: `S1`, `S2`) définis sur l'epic parent.
Ajouter les scénarios spécifiques au ticket si besoin, au format Gherkin simplifié :

- **Étant donné** ... (état initial)
- **Quand** ... (action utilisateur)
- **Alors** ... (résultat observable)>

## Référence Figma

<Si le ticket touche de l'UI, **impérativement** citer l'URL Figma précise du / des écran(s) ou composant(s) concerné(s), avec le node ID quand pertinent (`?node-id=...`). `code-dev` consommera cette URL via le MCP `figma-dev` (`get_design_context` pour la structure, `get_screenshot` pour la vue d'ensemble) au moment de l'implémentation, en suivant `rules/figma-workflow.md` (Phase 3 pixel-perfect + Phase 4 validation visuelle qu'il fait lui-même).

Format :

```markdown
- Écran principal : <Figma URL avec node-id>
- Composant X : <Figma URL avec node-id>     # si plusieurs nodes pertinents
- État Y (hover / error / mobile) : <Figma URL avec node-id>
```

**Une URL = un node Figma précis.** Pas d'URL générique de fichier Figma sans node-id : `code-dev` doit pouvoir aller direct au bon écran, sans deviner.

Si pas d'UI, écrire "N/A".>

## Critères d'acceptation

- [ ] <critère vérifiable 1>
- [ ] <critère vérifiable 2>
- [ ] Tests ajoutés et verts (`pnpm test`)
- [ ] Typecheck vert (`pnpm typecheck`)
- [ ] Lint vert (`pnpm lint:check`)
- [ ] Scénario(s) rejoué(s) sans erreur par `functional-validator`
- [ ] (si UI) Vérification visuelle vs. Figma faite par `code-dev` (screenshots dev server vs. `get_screenshot` Figma, voir `rules/figma-workflow.md` Phase 4)

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
- **Le label `complexe`** est ajouté uniquement si la tâche demande un raisonnement multi-étapes non trivial (refacto multi-fichiers, perf critique, algo complexe). Par défaut, Sonnet suffit.
- **Dépendances inter-tickets** : listées dans la section `Depends on` du body. `/epic` parse cette section pour gater le dispatch — `T2` est dispatché dès que `T1` a été squash-mergé dans la branche d'intégration `epic/<N>` (la PR de `T1` validée par la pipeline est auto-mergée par `process_tick_result.sh`, GitHub supprime la branche, `T2` peut alors brancher sur `epic/<N>` qui contient désormais le code de `T1`). L'exécution n'attend donc jamais la review humaine d'une PR de sous-ticket.
- **Parent issue GitHub** : utilisé uniquement pour pointer vers l'epic (relation epic → ticket). **Pas** pour exprimer des dépendances inter-tickets — utiliser `Depends on` à la place.
