---
paths:
  - "src/**/*.tsx"
  - "src/**/*.scss"
---

> **Used by**: `code-dev` (écriture composants + styles), `rgaa-auditor` (gate a11y), `review-fixer`, `design-validator` (déféré). Auto-chargé via `paths:`. **Règle canonique d'accessibilité du projet** — les autres docs (`CLAUDE.md`, `packages/app/CLAUDE.md`, `automation.md`) y renvoient.

# Accessibilité — RGAA 4.1.2 / WCAG 2.2 AA

egapro est une plateforme de l'État : le niveau de conformité visé est **RGAA 4.1.2** (13 thématiques / 106 critères), socle technique **WCAG 2.2 niveau AA**. C'est une **exigence first-class**, au même titre que la sécurité ou les règles métier — pas une amélioration optionnelle.

## Le système a11y du projet : ultra11y

L'outil d'accessibilité du projet est **ultra11y**, vendoré dans le repo à **`.claude/skills/ultra11y/`** — committé pour que **tous les devs** l'aient automatiquement (skill projet-scopé + moteur CLI zéro-dép, pas d'install par dev). Source : `github.com/maxgfr/ultra11y` (v2.14.0, MIT).

Division du travail : le **moteur** (`node .claude/skills/ultra11y/scripts/ultra11y.mjs`) fait la détection mécanique WCAG et rattache chaque non-conformité au bon critère ; **l'IA adjuge** les critères de jugement (pertinence des `alt`, intitulé de lien en contexte, ordre de lecture, logique clavier/focus) et route les critères « au rendu » vers le tier `scan`. Jamais de statut « conforme » sans verdict enregistré et gaté.

| Besoin | Commande (depuis `packages/app`) |
|---|---|
| Gate CI statique (bloquant) | `pnpm --filter app test:a11y` |
| Rapport RGAA complet | `pnpm --filter app a11y:report` → `audits/rgaa-*.md` |
| Tier rendu (zoom/reflow/contraste/focus/live) — local | `pnpm --filter app a11y:scan` (dev server + `.auth/*.json`) |
| Sens d'un critère | `node ../../.claude/skills/ultra11y/scripts/ultra11y.mjs criteria --standard rgaa 8.3` |

Voir la doc du skill : `.claude/skills/ultra11y/SKILL.md` + `references/*.md` (`judgment.md`, `focus-and-logic.md`, `false-positives.md`).

## Vérification (socle)

1. **`pnpm --filter app test:a11y`** — gate statique ultra11y (`--fail-on blocking`), lancé en CI (`.github/workflows/a11y.yaml`) et en local. Aucune NC bloquante ne doit passer.
2. **`rgaa-auditor`** — gate agent après chaque tâche sur les `.tsx` modifiés (pilote ultra11y + adjuge le jugement). Read-only.
3. **Lighthouse a11y = 100 %** — `pnpm --filter app test:lighthouse` (seuil bloquant CI dans `.lighthouserc.json`).
4. **Tier rendu** — `a11y:scan` pour les critères non statiquement décidables (à lancer sur les tickets qui touchent ces critères).
5. **Hook `block-bad-patterns.sh`** — bloque à l'écriture les anti-patterns (`<img>` brut, `style={}`, `role` redondant, `<svg>` inline…).

## Règles while-writing (natif d'abord, ARIA en dernier)

**Structure & landmarks**
- Landmarks sémantiques : `<header>`, `<nav>`, `<main id="content" tabindex="-1">`, `<footer>`. Un seul `<main>` par page. **Jamais** de `role` redondant (`role="navigation"` sur `<nav>` interdit).
- Liens d'évitement : `SkipLinks` en premier enfant du `<body>` ; toute ancre (`#content`, `#footer`) doit avoir une cible valide, sinon ne pas proposer le lien.
- Hiérarchie de titres continue (pas de saut h1→h3). Apparence via classes `fr-h*`, pas via le niveau de titre. Section sans titre visible → titre `fr-sr-only`.
- Listes de couples intitulé/valeur → `<dl><dt><dd>`.

**Tableaux**
- Tableau de données → `<caption>` (masquable `fr-sr-only` / `fr-table--no-caption`) ou `aria-labelledby` vers un titre existant ; en-têtes `<th scope="col|row">`.
- Cellule de donnée vide restituée « vide » → texte `fr-sr-only` (ou tiret significatif). Ne pas vider un `<th>`.

**Formulaires**
- Chaque `<input>` a un `<label>` associé (`htmlFor`/`id`). Champs de même nature regroupés → `<fieldset>` + `<legend>` (masquable `fr-sr-only`).
- Champ obligatoire → `aria-required="true"` (placé **avant** le spread `{...register()}`), pas seulement « (obligatoire) » visuel.
- Erreur → `aria-invalid="true"` conditionnel + `aria-describedby` vers l'id du message ; pas d'`aria-invalid` en l'absence d'erreur.
- Autocomplétion : renseigner `autocomplete` selon la finalité (`tel`, `email`, `name`…).
- Lecture seule : `<label>` + `<input readonly>` (pas `<span>`/`<div>`). Éviter `<fieldset disabled>` qui masque le contenu aux AT (NC 10.8) — préférer des `readOnly`/`aria-disabled` par champ.

**Scripts / états dynamiques**
- Nom/rôle/valeur exposés : `aria-sort` sur `<th>` triables (glyphe `aria-hidden`), `aria-expanded` sur les déclencheurs, `aria-modal="true"` + `role="dialog"` + `aria-labelledby` sur les modales.
- Régions live : **erreur d'action serveur** → `role="alert"` **seul** (implique `assertive`) ; **info / validation / async** → `aria-live="polite"` + `aria-atomic="true"`. Jamais les deux déclarations en même temps.
- Une valeur mise à jour à distance du focus (total recalculé, statut) → région `aria-live` stable présente au chargement.
- Aucun focusable sous `aria-hidden="true"` (piège pour lecteur d'écran). Focus visible et ordre de tabulation logique (pas de `tabindex > 0`).

**Liens & images**
- Intitulés de liens explicites et distincts ; lien de téléchargement → format dans le nom accessible (ex. « … (PDF) »). `target="_blank"` → `<NewTabNotice />`.
- Images via `import Image from "next/image"` (`<img>` brut bloqué par hook), `alt` descriptif (ou `alt=""` si décoratif). Icônes décoratives `aria-hidden="true"`. Graphique porteur d'information → `<div role="img" aria-label={…}>`.

**Présentation**
- Pas de `style={}` (bloqué par hook) ni couleur en dur ; classes DSFR / custom properties / SCSS module. Contenu lisible et non tronqué à 200 % de zoom, en reflow 320 px, et sous surcharge d'espacement (attention aux inputs dans des cellules de tableau).

## Périmètre & pérennité

Ce dispositif remplace l'ancienne suite `pnpm test:rgaa` (Playwright + `@axe-core/playwright`, harnais de collecte qui n'assertait rien) et les workflows `rgaa-audit.yaml` (audit quotidien → wiki) + `claude-revue-rgaa.yml`, tous supprimés. Le socle est : **ultra11y (statique CI + rendu local) + `rgaa-auditor` + Lighthouse 100 % + hook**. Resync du moteur vendoré : `cp ~/.agents/skills/ultra11y/scripts/ultra11y.mjs .claude/skills/ultra11y/scripts/` (ou `npx skills add maxgfr/ultra11y` puis copie).
