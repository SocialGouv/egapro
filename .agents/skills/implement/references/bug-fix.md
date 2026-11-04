# Corriger un bug

> S'applique à tout correctif, dans `/implement` comme en session directe. L'analyse (repro, cause racine, procédure de vérification) est produite par `/analyze` → [`bug-analysis.md`](../../analyze/references/bug-analysis.md). Ce fichier couvre le côté **implémentation**.

Deux pièges justifient la discipline : « je crois que j'ai fixé » sans preuve, qui revient en régression un mois plus tard ; et le fix accidentel qui ne vise pas la cause racine, donc le bug qui reparaît sous une autre forme.

## Deux choses distinctes vivent sous le mot « reproduire »

| | **Vérification one-shot** | **Test de non-régression** |
|---|---|---|
| But | prouver que le fix agit, maintenant | empêcher le bug de revenir |
| Quand | pendant l'implémentation | après le fix, prouvé par revert-verify |
| Durée de vie | éphémère — consignée dans le body de la PR | permanente — commitée dans la suite |
| Obligatoire ? | **toujours** | **non** — soumis à la criticité |

La **vérification one-shot est toujours due**, quel que soit le bug — même un bug d'infra ou un écart purement visuel, fût-elle manuelle. Un bug sans test permanent n'est donc pas un bug non vérifié.

Le **test permanent** dépend du type de bug : logique métier ou API → test unitaire (ou d'intégration si le défaut est au DB-layer) ; UI / parcours → E2E Playwright, **seulement si le bug est assez critique** (parcours critique, fort risque de régression) et toujours imbriqué dans le scénario existant — critères dans [`e2e.md`](e2e.md). Un bug mineur ou cosmétique n'en reçoit en général pas.

## Le protocole

**1. Partir de la cause racine posée par l'analyse.** Si en implémentant tu constates qu'elle est fausse, arrête-toi et dis-le sur le ticket plutôt que de corriger un autre symptôme. Outils : `nextjs_call(get_errors)`, `git log -p <fichier>`, les logs d'un env de review (scrubbés avant citation — `AGENTS.md` § Hygiène git).

**2. Fixer la cause, pas le symptôme.**

```ts
// INTERDIT — masque un undefined qui ne devrait jamais arriver
if (value == null) return "default";

// CORRECT — corriger la fonction en amont qui propage le undefined
```

**3. Exécuter la vérification one-shot** décrite dans `## Analyse du bug` : valeur **avant** (base, sans fix) et **après**. Pour un bug visuel ou CSS, la preuve est une **mesure DOM** (`getBoundingClientRect`, `getComputedStyle`, `Range.getClientRects`), jamais un jugement à l'œil.

**4. Prouver le test par revert-verify.** Reverse-appliquer le diff **source** (`git apply -R`) → le test doit être **RED** ; ré-appliquer → **GREEN**. Un test qui passe sans le fix ne reproduit pas le bug : le retravailler. Commandes → [`workflow.md`](workflow.md) § Bug.

**5. Consigner.** Body de la PR, section « Vérification » : ce qui a été fait → valeur **avant** / valeur **après**, plus la preuve du revert-verify. Sans cette trace, personne ne distingue un fix vérifié d'un fix plausible.

**6. Commit** : `fix(<scope>): <description courte> (#NNN)`. Le test de reproduction est commité séparément (`test(<scope>): …`).

## Bug de pipeline ou de déploiement

CI/CD, Docker, Kubernetes n'ont pas forcément de test automatisable. Alors : documenter la reproduction manuelle (commandes exactes) sur le ticket, tester le fix dans un environnement de review, joindre les logs avant/après (scrubbés), et si possible ajouter une assertion de monitoring qui rattrapera la régression.

## Écart visuel Figma ↔ app

Pas de test unitaire du pixel-perfect, mais mieux qu'une revue à l'œil. Corriger selon [`conventions/figma.md`](conventions/figma.md) (mapping token → DSFR), puis **re-mesurer le rendu** contre le node — c'est la vérification one-shot. Quatre écrans seulement portent un **contrat de fidélité** E2E permanent (`src/e2e/{breadcrumb-spacing,stepper-spacing,declaration-header-alignment,second-declaration-info-styling}.e2e.ts`) : si le bug tombe sur l'un d'eux, c'est le contrat qui verrouille — soit le code s'y conforme, soit le contrat est mis à jour avec le nouveau node en référence. Sinon, joindre les screenshots dev server (desktop + mobile) au body de la PR. La revue `gates` re-mesure ensuite ([`design-fidelity.md`](../../review/references/design-fidelity.md)).
