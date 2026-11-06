# Estimation de complexité (t-shirt sizing)

> Posée **à la fin de l'analyse** (modes task, bug, epic, rework), quand le contexte technique est connu : fichiers touchés, migration, surface UI.

Le sizing s'écrit sur le board GitHub **EGAPRO V2** dans deux champs : `Size` (single-select XS→XL) **et** `Estimate` (number, points). Une seule commande écrit les deux, et on n'écrit jamais ces champs en GraphQL brut :

```bash
bash scripts/orchestration/set_ticket_size.sh <ticket_number> <XS|S|M|L|XL>
```

Le script est idempotent et ajoute l'issue au project si elle n'y est pas.

---

## Mapping points (Fibonacci)

| Size | Points (`Estimate`) | Sens |
|---|---|---|
| **XS** | 1 | trivial, mécanique |
| **S** | 2 | simple, périmètre net |
| **M** | 3 | standard, plusieurs fichiers |
| **L** | 5 | gros, transverse ou incertain |
| **XL** | 8 | très gros — **signal à découper** |

Fibonacci : l'écart croît avec la taille parce que l'erreur d'estimation croît avec la taille. Un **XL** sur une feuille est un **smell** : se demander d'abord si le ticket ne devrait pas être re-découpé (en mode epic) plutôt que sizé tel quel.

---

## Rubrique — comment trancher

On **ne size pas un effort en heures** : on évalue l'**incertitude + la surface**. Croiser ces axes ; la taille finale = l'axe le plus contraignant (le risque domine).

| Axe | XS | S | M | L | XL |
|---|---|---|---|---|---|
| **Fichiers touchés** | 1 | 2–3 | 4–6 | 7–12 | 12+ |
| **Couche domaine** (`modules/domain`) | aucune | constante/helper existant | 1 fonction pure + tests | plusieurs règles métier | refonte de règles |
| **Schéma / migration Drizzle** | non | non | colonne nullable | migration avec backfill | migration destructive / multi-tables |
| **Surface UI / RGAA** | aucune | 1 composant existant retouché | 1 nouveau composant DSFR | nouvelle page / funnel step | nouveau parcours multi-étapes |
| **tRPC / sécurité** | non | query simple | 1 mutation + ownership | plusieurs procédures + transaction | refonte d'un routeur / authz |
| **Incertitude** | nulle | faible | spec claire | quelques inconnues | beaucoup d'inconnues / spike |

**Règle de dominance** : un ticket « 2 fichiers » mais avec une **migration destructive** est **L/XL**, pas S. Toujours remonter à la taille de l'axe le plus risqué.

---

## Anchors de calibration (exemples concrets egapro)

Comparer le ticket à sizer à l'exemple le plus proche.

- **XS (1)** — corriger un libellé FR, ajuster une constante de seuil déjà nommée, ajouter un `alt` manquant, renommer une variable.
- **S (2)** — ajouter un champ optionnel à un formulaire existant + son schéma Zod ; brancher un helper `domain` déjà écrit dans une nouvelle vue ; fix d'un bug localisé avec test de non-régression.
- **M (3)** — nouveau composant DSFR isolé + tests ; nouvelle query tRPC `read_sensitive` avec audit + Zod ; nouvelle fonction pure `domain` (ex. variante d'un calcul d'indicateur) + couverture.
- **L (5)** — nouvelle étape de funnel de déclaration (UI + state + validation + persistance) ; migration Drizzle avec backfill + adaptation des lectures ; nouvelle mutation avec transaction multi-write + ownership + audit.
- **XL (8)** — nouveau parcours utilisateur complet multi-étapes ; refonte d'un routeur tRPC entier ; migration destructive multi-tables. **→ envisager un re-découpage avant de sizer XL.**

---

## Procédure (fin d'analyse)

1. Déterminer la taille avec la rubrique et les anchors.
2. Écrire le board : `bash scripts/orchestration/set_ticket_size.sh <N> <XS|S|M|L|XL>`.
3. Tracer la justification dans l'artefact d'analyse (commentaire `## Analyse architecte` / `## Analyse du bug`, ou body de la sous-issue), sous une section dédiée :
   ```markdown
   ## Complexité
   **Taille : M (3 pts)** — 1 nouveau composant DSFR + 1 query tRPC, pas de migration, incertitude faible.
   ```
   La taille du texte et celle du board doivent être **identiques**.

**Périmètre** : seules les **feuilles** sont sizées (Task, Bug — ce qui passe dans `/implement`). L'**epic** (type Feature) **n'est jamais sizé** : sa charge est la somme de ses sous-tickets, et le sizer créerait un double comptage.
