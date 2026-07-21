---
paths:
  - "src/server/rules/**"
  - "src/modules/declaration-remuneration/**"
  - "src/modules/my-space/**"
  - "src/e2e/**"
---

# Moteur d'étapes de la démarche (FSM)

> **Used by**: `code-dev` (dès qu'il touche au parcours de déclaration, au panneau Mon espace ou aux règles serveur), `tu-dev` (tests de progression), `e2e-dev` (scénarios de parcours), `structural-auditor`, `review-fixer`. Auto-chargé via `paths:`. Complète `rules/code-quality.md` (§ Domain layer) et `rules/testing.md`.

La progression de la démarche (passage d'un écran/étape à l'autre, conditions, transitions) est régie par **une seule autorité**. Tout ce qui décide « où va l'utilisateur ensuite » ou « quel est l'état courant de la démarche » **dérive** de cette autorité — jamais d'une copie recodée à la main.

## L'autorité unique

- **Moteur** : `packages/app/src/server/rules/v2027.1.json` (états, transitions, gardes) + `packages/app/src/server/rules/engine.ts` (`loadRules`, `applyAction`). C'est la **seule** source de vérité de la progression : quel état suit quel état, sous quelle condition (effectif, CSE, écarts, année).
- **Vocabulaire des états** : la const `DECLARATION_FSM_STATUSES` dans `packages/app/src/modules/domain/types.ts`, dont l'union `DeclarationFsmStatus` est **dérivée** (`(typeof DECLARATION_FSM_STATUSES)[number]`). C'est l'unique liste des états.
- Depuis #3974, le lien est **imposé par le compilateur** : le schema Zod du moteur (`server/rules/schema.ts`) valide `states[].id` / `transitions[].from` / `.to` via `z.enum(DECLARATION_FSM_STATUSES)` (un état hors union fait échouer le parse), et les miroirs sont typés sur l'union avec des `switch` exhaustifs. Ajouter, renommer ou retirer un état produit donc une **erreur `tsc` ou une erreur de parse Zod**, pas un bug silencieux en production.

## Les deux miroirs — gelés

Le graphe d'états n'est ré-encodé qu'à **deux** endroits, chacun une **projection** de l'autorité (état → écran / variante d'affichage), pas une redéfinition des règles :

1. `packages/app/src/modules/declaration-remuneration/shared/complianceNavigation.ts` — `getCurrentStageHref` (état → URL de l'étape courante).
2. `packages/app/src/modules/my-space/declarationProcessState.ts` — `computePanelVariant` / `computeCtaHref` (état → variante du panneau + CTA).

**Interdiction d'en créer un troisième.** Tout nouveau consommateur qui a besoin de raisonner sur l'état :

- se type sur `DeclarationFsmStatus` (jamais `string`),
- couvre l'état via un `switch` **exhaustif sans `default:`** (le type de retour force l'exhaustivité — ajouter un état casse la compilation tant qu'il n'est pas géré),
- ou, mieux, dérive directement du moteur (`loadRules(...).transitions` / `.states`) plutôt que de recopier la liste.

Un `default:` fourre-tout sur un statut de démarche est un anti-pattern : il masque les états non gérés (c'est ce qui laissait passer les bugs de parcours).

## Écrire les tests de progression

Tout test qui touche à la progression s'écrit **contre les états/transitions du moteur** (itération sur le JSON parsé via `loadRules` / `RulesSchema`), **jamais** contre une copie manuelle des attentes — un test qui recopie l'implémentation la consacre au lieu de la vérifier.

Modèles de référence :

- `packages/app/src/server/rules/__tests__/matrix.v2027.1.test.ts` — matrice des transitions du moteur.
- `packages/app/src/server/rules/__tests__/fsmMirrors.conformance.test.ts` — cohérence sémantique moteur ↔ les deux miroirs (itère sur les états du JSON).
- `packages/app/src/modules/domain/__tests__/demarcheDecisionTable.test.ts` — table de décision combinatoire des prédicats métier (effectif × écart × année), via les constantes nommées du domain.

Un écart de comportement connu mais pas encore corrigé se documente en `it.fails` avec le numéro d'issue (le fix casse le `it.fails` et force la bascule en assertion normale) — jamais en assertion qui consacre le bug.
