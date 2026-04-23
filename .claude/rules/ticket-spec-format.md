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

<Si le ticket touche de l'UI, **impérativement** afficher les screenshots inline (desktop + mobile) via les URLs `raw.githubusercontent.com` de la branche `design-assets/epic-<NNN>` publiée par le `designer`. Cette branche est orpheline et héberge les PNG — voir `.claude/agents/designer/AGENT.md` pour la procédure de publication. Les chemins `/tmp/...` sont ajoutés en annexe pour que `code-dev` et `design-validator` puissent lire les fichiers localement lors de la validation visuelle Phase 4.

Format :

```markdown
**Desktop**
![<alt>](https://raw.githubusercontent.com/<owner>/<repo>/design-assets/epic-<NNN>/epic-<NNN>/screenshots/<screen>-desktop.png)

**Mobile**
![<alt>](https://raw.githubusercontent.com/<owner>/<repo>/design-assets/epic-<NNN>/epic-<NNN>/screenshots/<screen>-mobile.png)

_Annexe pipeline (lecture locale par code-dev / design-validator) :_
- `/tmp/egapro-mocks/epic-<NNN>/screenshots/<screen>-desktop.png`
- `/tmp/egapro-mocks/epic-<NNN>/screenshots/<screen>-mobile.png`
```

Si pas d'UI, écrire "N/A".>

## Critères d'acceptation

- [ ] <critère vérifiable 1>
- [ ] <critère vérifiable 2>
- [ ] Tests ajoutés et verts (`pnpm test`)
- [ ] Typecheck vert (`pnpm typecheck`)
- [ ] Lint vert (`pnpm lint:check`)
- [ ] Scénario(s) rejoué(s) sans erreur par `functional-validator`
- [ ] (si UI) Comparaison visuelle PASS par `design-validator`

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
- **Dépendances inter-tickets** : listées dans la section `Depends on` du body. `/epic` parse cette section et applique la stratégie **stacked PRs** : si un ticket `T2` dépend de `T1` encore `In review` (PR non mergée), `T2` est créé avec `--base` sur la branche de `T1`. Ainsi l'exécution n'attend jamais une validation humaine.
- **Parent issue GitHub** : utilisé uniquement pour pointer vers l'epic (relation epic → ticket). **Pas** pour exprimer des dépendances inter-tickets — utiliser `Depends on` à la place.
