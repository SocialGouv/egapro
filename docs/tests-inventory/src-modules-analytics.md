# Inventaire des tests — src/modules/analytics

> Fichier généré — ne pas éditer à la main. Régénérer avec `pnpm test:inventory` (depuis `packages/app/`) ou le skill `/test-inventory`. [← Retour à l'index](../tests-inventory.md)

_Généré le 2026-07-22 — 5 fichier(s), 25 test(s)._

- **`src/modules/analytics/__tests__/elapsedSeconds.test.ts`** — 3 test(s)
  - elapsedSeconds > returns 0 for identical timestamps
  - elapsedSeconds > returns the gap between two timestamps rounded to whole seconds
  - elapsedSeconds > rounds to the nearest second
- **`src/modules/analytics/__tests__/MatomoAnalytics.test.tsx`** — 3 test(s)
  - MatomoAnalytics > does not track when Matomo is not configured
  - MatomoAnalytics > honours Do Not Track and disables heatmaps/session recording on init
  - MatomoAnalytics > tracks with cleanUrl so query strings (possible PII) never reach Matomo
- **`src/modules/analytics/__tests__/TrackedLink.test.tsx`** — 5 test(s)
  - TrackedLink > emits the slug, never the URL (CNIL/PII guard)
  - TrackedLink > forwards className to the rendered link
  - TrackedLink > renders an external href as a plain anchor keeping rel and target
  - TrackedLink > renders an internal href as a link and emits help_link_click with the slug on click
  - TrackedLink > still calls a passed onClick after emitting the event
- **`src/modules/analytics/__tests__/trackEvent.test.ts`** — 6 test(s)
  - buildFunnelStepKeys > derives one stable, untranslated key per step, indexed by step number
  - buildFunnelStepKeys > returns a single key for a zero-step funnel
  - trackEvent > emits a typed event via sendEvent when Matomo is configured
  - trackEvent > is a silent no-op when Matomo is not configured
  - trackEvent > omits name and value when they are not provided
  - trackEvent > sets each custom dimension before emitting the event
- **`src/modules/analytics/__tests__/useFunnelTracking.test.ts`** — 8 test(s)
  - trackFunnelComplete > emits funnel_complete with the total duration and clears the funnel state
  - trackFunnelComplete > is a no-op when no funnel is in progress
  - useFunnelTracking > does not emit any PII (only category, action, name, value, anonymised dimensions)
  - useFunnelTracking > does not re-emit funnel_start on a fresh mount at the first step (anti-double via sessionStorage)
  - useFunnelTracking > emits funnel_abandon with the current step key and total duration on beforeunload
  - useFunnelTracking > emits funnel_start once on entering the first step, with the campaign-year dimension
  - useFunnelTracking > emits step_complete with the step key, duration in seconds and both dimensions on a forward transition
  - useFunnelTracking > keeps two funnels independent via distinct storage keys
