---
name: plan-sprint
description: "Planifie le prochain sprint : calcule la capacité (vélocité glissante 3 sprints), reporte les tickets non livrés du sprint courant, puis complète depuis le backlog par priorité jusqu'à la capacité. Présente le plan, attend validation, puis assigne les tickets au sprint. Usage: /plan-sprint [<titre-sprint-cible>]"
---

# /plan-sprint — Planification du prochain sprint

## Usage

- `/plan-sprint` — planifie le sprint qui suit le sprint courant (auto-détecté)
- `/plan-sprint "Sprint 11"` — planifie un sprint cible nommé

À lancer **en début de planification** (typiquement à la fin du sprint courant, après avoir lancé `/velocity` pour voir la tendance).

## Ce que fait le skill

1. **Capacité** = moyenne glissante de la vélocité des **3 derniers sprints terminés** (Σ `Estimate` des feuilles Task/Bug livrées : Done ∪ In review).
2. **Report** des tickets **non livrés** du sprint courant (`Status ∉ {Done, In review}`) → vers le sprint cible. Ils consomment la capacité en premier.
3. **Complétion** depuis le backlog : tickets `Status ∈ {Backlog, To Do}`, **sizés**, sans sprint, triés par **Priorité** (P0→P1→P2) puis **petits points d'abord** (remplit les trous), ajoutés **sans jamais dépasser la capacité**.

## Limite GitHub — création de sprint

L'API GitHub **régénère tous les `iterationId`** quand on édite la config d'un champ iteration → cela **orphaniserait toutes les assignations Sprint existantes** du board (vérifié par test). Donc `/plan-sprint` **ne crée jamais l'itération**.

Si le sprint cible n'existe pas encore (`exit 4`), le skill s'arrête et indique :

> Project EGAPRO V2 → ⚙ Settings → champ « Sprint » → « Add iteration » (dates auto-remplies depuis la durée de 14 j), puis relancer `/plan-sprint`.

**Garde donc ~1 sprint d'avance** (comme aujourd'hui : Sprint 10 pré-créé) → le skill tourne alors en entièrement automatique.

## Exécution

**Étape 1 — Plan (lecture seule).** Toujours d'abord :

```bash
bash scripts/orchestration/plan_sprint.sh "$ARGUMENTS"
```

Re-rendre la sortie en chat sous forme de **tableaux markdown propres** (reportés / ajoutés / total vs capacité) + une courte analyse :
- Signaler les tickets reportés **non sizés** (`⚠`) — leur charge n'est pas comptée ; suggérer de les sizer (`/analyse`) si la capacité semble fausse.
- Si beaucoup de reports saturent déjà la capacité → le sprint est en dette, peu/pas de backlog ajouté : le dire explicitement.

**Étape 2 — Validation utilisateur EXPLICITE.** Demander : « Je valide ce plan et j'assigne les tickets à *<sprint cible>* ? » **Attendre un oui clair.** Ne jamais écrire sans validation (les assignations modifient le board partagé).

**Étape 3 — Appliquer (écriture).** Sur accord seulement :

```bash
bash scripts/orchestration/plan_sprint.sh --apply "$ARGUMENTS"
```

La sélection est **déterministe** → le plan appliqué est identique à celui montré. Le script assigne chaque ticket (reportés + ajoutés) au sprint cible via `updateProjectV2ItemFieldValue` (1 item à la fois, sûr).

## Notes

- **Le champ `Status` n'est pas touché** — `/plan-sprint` ne déplace pas les tickets sur le board (Backlog/To Do/In progress restent gérés par `/implement` et toi). Il ne pose que l'assignation **Sprint**.
- Prérequis pour une capacité fiable : les tickets passent par `/analyse` qui les size (`Size` + `Estimate`). Sans sizing, la vélocité est sous-estimée.
- Voir aussi `/velocity` (mesure rétrospective) et `rules/complexity-estimation.md` (rubrique t-shirt).
