# Design assets — Epic 3349

Static HTML mockups + screenshots produced during the design phase of
[Epic #3349 — Refonte étape 4 (proportion F/H par quartile)](https://github.com/SocialGouv/egapro/issues/3349).

These assets are referenced by:

- The `## Designer: proposition d'écrans` comment on the epic (raw GitHub URLs).
- The sub-tickets created by the architect (visual reference + acceptance criteria).
- The `design-validator` quality gate during implementation.

## Contents

```
epic-3349/
  screens/                  static HTML mockups (DSFR via CDN, no React)
    _shared.css
    screen-1-prefilled.html       prefilled state (matches Figma 7548:74899)
    screen-2-empty.html           empty state (matches Figma 7548:75845)
    screen-3-error-noncrescent.html   non-strictly-increasing thresholds (S3)
    screen-4-error-empty.html         missing required fields (S4 + S5)
  screenshots/
    screen-{1..4}-{desktop,mobile}.png
```

## Source frames

- **Figma frame**: `7529-112547` (canvas)
- **Prerempli reference**: `7548-74899`
- **Non-prerempli reference**: `7548-75845`
