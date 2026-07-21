---
name: test-inventory
description: "Régénère l'inventaire des tests (`docs/tests-inventory.md`) à partir de l'état courant du code (TU + intégration + E2E), puis commit local sur la branche courante. Usage : /test-inventory"
---

# /test-inventory

**Régénération de l'inventaire des tests** du repo. Produit `docs/tests-inventory.md` : la liste intelligible de tous les tests (unitaires, intégration, E2E), groupés par domaine fonctionnel avec libellés français, totaux et date. `docs/` est synchronisé vers le wiki GitHub par la CI — la liste est donc visible par toute l'équipe (dev et non-dev).

C'est l'entrée **humaine** de régénération. L'entrée orchestrée (fin d'epic) passe par l'agent `doc-writer` (étape 3-bis), et un rappel non bloquant vit dans `.claude/rules/automation.md`. **Aucune gate CI** ne vérifie la fraîcheur — l'inventaire se régénère à la demande.

---

## Step 0 — Pré-conditions

- Si le working tree contient déjà des changements non commités **hors** `docs/tests-inventory.md`, prévenir l'utilisateur (le commit ne doit embarquer que l'inventaire).
- La stack de développement (base de données) doit idéalement tourner pour lister les tests d'intégration ; sinon la section intégration sera marquée indisponible dans le fichier (best-effort, non bloquant).

## Step 1 — Régénérer

```bash
pnpm --filter app test:inventory
```

Le script `packages/app/scripts/generate-test-inventory.mjs` exécute `vitest list` (TU), `vitest list --config vitest.integration.config.ts` (intégration) et `playwright test --list` (E2E), parse les titres et écrit `docs/tests-inventory.md`. Sortie déterministe : deux exécutions à code constant produisent le même fichier (la date de génération est la seule ligne qui varie au jour le jour).

## Step 2 — Montrer le diff

```bash
git --no-pager diff --stat docs/tests-inventory.md
git --no-pager diff docs/tests-inventory.md | head -60
```

Résumer à l'utilisateur : nombre de tests ajoutés/retirés par type (TU / intégration / E2E), fichiers de test nouveaux ou disparus.

## Step 3 — Commit local (pas de push)

```bash
git add docs/tests-inventory.md
git commit -m "docs: régénère l'inventaire des tests"
```

**Ne jamais push** — comme `/doc` sans argument, laisser le commit local ; l'utilisateur pousse lui-même quand il a relu. Si le diff est vide (aucun changement de test depuis la dernière génération), le signaler et ne rien commiter.

---

## Notes

- Le fichier est **généré** — ne pas l'éditer à la main (un en-tête le rappelle).
- Régénérer après toute PR qui **ajoute, renomme ou supprime** des tests, pour garder l'inventaire à jour.
- Backing : `packages/app/scripts/generate-test-inventory.mjs` · script npm `test:inventory`.
