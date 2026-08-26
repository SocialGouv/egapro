---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Corriger un bug

> Le protocole vaut pour tout le monde : la pipeline (`bug-analyst` analyse, `code-dev` fixe, `tu-dev` / `e2e-dev` verrouillent) comme une session directe. La répartition des rôles dans la pipeline est dans `.claude/pipeline/orchestration.md`.

Deux pièges justifient à eux seuls la discipline : « je crois que j'ai fixé » sans preuve, qui revient en régression un mois plus tard ; et le fix accidentel qui ne vise pas la cause racine, donc le bug qui reparaît sous une autre forme.

## Deux choses distinctes vivent sous le mot « reproduire »

| | **Vérification one-shot** | **Test de non-régression** |
|---|---|---|
| But | prouver que le fix agit, maintenant | empêcher le bug de revenir |
| Quand | pendant l'implémentation | après le fix, prouvé par revert-verify |
| Durée de vie | éphémère — consignée dans le body de la PR | permanente — commitée dans la suite |
| Obligatoire ? | **toujours** | **non** — soumis à la criticité |

La **vérification one-shot est toujours due**, quel que soit le bug — même un bug d'infra ou un écart purement visuel, fût-elle manuelle. Elle relève de celui qui a le worktree, le dev server et le fix sous la main. Un bug sans test permanent n'est donc pas un bug non vérifié.

Le **test permanent** dépend du type de bug : logique métier ou API → test unitaire (ou d'intégration si le défaut est au DB-layer) ; UI / parcours → E2E Playwright, **seulement si le bug est assez critique** (parcours critique, fort risque de régression) et de préférence imbriqué dans le scénario existant. Un bug mineur ou cosmétique n'en reçoit en général pas.

## Le protocole

**1. Identifier la cause racine.** Ne pas s'arrêter au symptôme : remonter les appelants, la stack trace, les schémas Zod, les migrations. `nextjs_call(get_errors)` pour les erreurs compile/runtime, `git log -p <fichier>` pour les changements récents, les logs d'un env de review si le bug y est spécifique (scrubber avant de citer — `rules/git-artefact-hygiene.md`).

**2. Fixer la cause, pas le symptôme.**

```ts
// INTERDIT — masque un undefined qui ne devrait jamais arriver
if (value == null) return "default";

// CORRECT — corriger la fonction en amont qui propage le undefined
```

**3. Prouver le test par revert-verify.** Reverse-appliquer le diff **source** (`git apply -R`) → le test doit être **RED** ; ré-appliquer → **GREEN**. Un test qui passe sans le fix ne reproduit pas le bug : le retravailler.

**4. Consigner.** La vérification one-shot va dans le body de la PR, sous forme observable : ce qui a été fait → valeur **avant** / valeur **après**. Sans cette trace, personne ne peut distinguer un fix vérifié d'un fix plausible. Pour un bug visuel ou CSS, la preuve est une **mesure DOM** (`getBoundingClientRect`, `getComputedStyle`, `Range.getClientRects`), jamais un jugement à l'œil.

**5. Commit** : `fix(<scope>): <description courte> (#NNN)`. Le test de reproduction est commité séparément (`test(<scope>): …`).

## Bug de pipeline ou de déploiement

CI/CD, Docker, Kubernetes n'ont pas forcément de test automatisable. Alors : documenter la reproduction manuelle (commandes exactes) sur le ticket, tester le fix dans un environnement de review, joindre les logs avant/après (scrubbés), et si possible ajouter une assertion de monitoring qui rattrapera la régression.

## Écart visuel Figma ↔ app

Il n'y a pas de test unitaire du pixel-perfect, mais il y a mieux qu'une revue à l'œil. Corriger en suivant `rules/figma-workflow.md` (mapping token → DSFR), puis **re-mesurer le rendu** contre le node — c'est la vérification one-shot, et elle est due comme les autres. La plupart des écrans n'ont que ça : quatre écrans seulement portent un **contrat de fidélité** E2E permanent (`src/e2e/{breadcrumb-spacing,stepper-spacing,declaration-header-alignment,second-declaration-info-styling}.e2e.ts`). Si le bug tombe sur l'un d'eux, c'est le contrat qui verrouille : soit le code s'y conforme, soit le contrat est mis à jour avec le nouveau node en référence. Sinon, joindre les screenshots dev server (desktop + mobile) au body de la PR — c'est le signal pour la revue humaine. Voir `rules/visual-quality-validation.md`.
