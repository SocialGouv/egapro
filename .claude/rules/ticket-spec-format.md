# Ticket Spec Format

Format standardisé des tickets **code** produits par l'agent `architect` et consommés par `code-dev` (Sonnet par défaut, Opus si label `complexe`).

Un ticket bien formaté permet à un dev Sonnet d'exécuter la tâche sans ambiguïté ni questions supplémentaires. Si un ticket ne respecte pas ce format, `code-dev` doit retourner le ticket en `To Do` avec un commentaire listant les manques, plutôt qu'improviser.

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

## Références visuelles

<Si le ticket touche de l'UI, référencer les screenshots produits par le `designer` (dans `/tmp/egapro-mocks/epic-<NNN>/screenshots/`, chemins exacts listés dans le commentaire `## Designer: proposition d'écrans` de l'epic parent). Exemples :
- `/tmp/egapro-mocks/epic-42/screenshots/declaration-form-desktop.png`
- `/tmp/egapro-mocks/epic-42/screenshots/declaration-form-mobile.png`

Si pas d'UI, écrire "N/A".>

## Critères d'acceptation

- [ ] <critère vérifiable 1>
- [ ] <critère vérifiable 2>
- [ ] Tests ajoutés et verts (`pnpm test`)
- [ ] Typecheck vert (`pnpm typecheck`)
- [ ] Lint vert (`pnpm lint:check`)
- [ ] Scénario(s) rejoué(s) sans erreur par `functional-validator`
- [ ] (si UI) Comparaison visuelle PASS par `design-validator`
```

## Règles de rédaction

- **Un ticket = une unité cohérente** : si les critères d'acceptation dépassent 8 éléments, découper en deux tickets avec dépendance parent-enfant GitHub.
- **Pas de décision architecturale** dans le ticket : l'architect a déjà tranché. Le dev exécute.
- **Pas de "voir le code pour comprendre"** : les fichiers à lire doivent être listés explicitement.
- **Le label `complexe`** est ajouté uniquement si la tâche demande un raisonnement multi-étapes non trivial (refacto multi-fichiers, perf critique, algo complexe). Par défaut, Sonnet suffit.
- **Dépendances** : utiliser le champ `Parent issue` / sub-issues GitHub. `/epic` respecte l'ordre : les tickets sans dépendance partent en premier, les suivants dès que leurs parents sont **Done**.
