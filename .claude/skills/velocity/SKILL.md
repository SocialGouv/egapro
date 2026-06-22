---
name: velocity
description: "Calcule la vélocité des sprints terminés (Σ points des tickets feuilles livrés) et recommande la capacité du prochain sprint. À lancer en fin de sprint. Thin wrapper bash sur sprint_velocity.sh, zéro LLM lourd. Usage: /velocity [<titre-sprint>]"
---

# /velocity — Vélocité de sprint & capacité conseillée

## Usage

- `/velocity` — tableau de tous les sprints (engagé / réalisé / complétion) + recommandation pour le prochain sprint
- `/velocity "Sprint 8"` — idem + détail ticket-par-ticket du sprint nommé (utile pour expliquer un écart engagé↔réalisé)

À lancer **en fin de sprint**, une fois que les tickets livrés sont passés en `Done` ou `In review`.

## Modèle de calcul

| Notion | Définition |
|---|---|
| **Périmètre** | Feuilles uniquement — issues de type **Task** / **Bug**. L'epic (**Feature**) est exclu : sa charge = la somme de ses enfants (sinon double comptage). |
| **Vélocité (réalisé)** | Σ `Estimate` des feuilles d'un sprint dont le `Status` ∈ **{Done, In review}**. `In review` compte : l'IA a fini, la PR est ouverte. |
| **Engagé** | Σ `Estimate` de **toutes** les feuilles planifiées sur le sprint. |
| **Complétion** | réalisé / engagé. Le reste = carry-over. |
| **Recommandation** | moyenne glissante de la vélocité des **3 derniers sprints terminés**. |

Les points viennent du champ `Estimate`, alimenté par le sizing t-shirt en fin d'analyse (`/analyse` → `set_ticket_size.sh`). Convention Fibonacci : **XS=1 S=2 M=3 L=5 XL=8** (cf. `rules/complexity-estimation.md`).

## Exécution

```bash
bash scripts/orchestration/sprint_velocity.sh "$ARGUMENTS"
```

Le script (pur bash + `gh` + `jq`) pagine les items du project **EGAPRO V2**, agrège par sprint via le champ iteration `Sprint`, et rend le tableau + la reco. Aucun LLM dans la chaîne de calcul.

## Format du rapport

Re-rendre la sortie du script en chat sous forme de **tableau markdown propre** (ne pas coller le brut ASCII), puis ajouter une courte **analyse** :

- Tendance de la vélocité sur les derniers sprints (stable / en hausse / volatile).
- Signaler les sprints avec beaucoup de **tickets non sizés** (`⚠ N non sizé(s)`) — leur vélocité est sous-estimée tant que `/analyse` n'a pas sizé tout le backlog.
- Rappeler la **capacité conseillée** et, si pertinent, nuancer (ex. « la moyenne est tirée vers le bas par S6/S7 sans sizing — fie-toi plutôt au dernier sprint complet »).

## Notes

- Le sizing du backlog historique est partiel : les sprints antérieurs à l'adoption du t-shirt sizing afficheront `0` en réalisé tant qu'ils n'ont pas de `Estimate`. La reco devient fiable une fois ≥ 1 sprint entièrement sizé via la pipeline.
- Aucune écriture board : skill **read-only**. Le sizing, lui, est écrit par `/analyse`.
