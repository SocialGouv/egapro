/**
 * Who records which page of the RGAA sample.
 *
 * `.ultra11yrc.json` declares the normative sample; three specs record it. The sweep takes
 * every page by default, and this set names the ones it must NOT take because another spec
 * owns them. Split out of `sweep.a11y.ts` so a unit test can hold the two lists against each
 * other without importing a module that declares Playwright tests at import time.
 *
 * A page that no spec records is the failure mode this exists to prevent: it stays declared,
 * produces no snapshot, and the report is silent about it rather than wrong — which is far
 * harder to notice. `declaration-accessibilite` sat in exactly that state, swallowed by a
 * `startsWith("declaration-")` filter meant for the funnel screens.
 */
export const SNAPSHOTTED_ELSEWHERE = new Set([
	// Screens gated by the state machine: they open only from a precise declaration state,
	// which `funnels.a11y.ts` pins before each one. Sweeping them generically would produce a
	// redirect, hence a skip — not a snapshot.
	"declaration-etape-2",
	"declaration-recapitulatif",
	"parcours-conformite",
	"avis-cse-etape-1",
	// Pages with a dynamic segment: their id comes from the database, so `dynamic.a11y.ts`.
	"historique-declaration",
	// Pages that only exist WITHOUT a session: signed in, `/` redirects to the espace and
	// `/login` redirects into the app, so the sweep correctly skipped both rather than filing
	// another screen under their name. `anonymous.a11y.ts` drops the storageState and takes
	// them. They were the two the RGAA report never covered — the first two screens every
	// visitor meets.
	"accueil",
	"login",
]);
