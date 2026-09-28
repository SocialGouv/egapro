import { type Page, test } from "@playwright/test";
import { checkA11y } from "ultra11y/playwright";

export type A11yRoute = {
	/** Path to visit, relative to the config's baseURL. */
	path: string;
	/**
	 * Stable snapshot id. It becomes the directory name under `.ultra11y/pages/`, the column
	 * header of the RGAA per-page grid and the file name of the page sheet, so it must match
	 * the `sample.pages[].id` declared in `.ultra11yrc.json` for the pages that are part of
	 * the normative échantillon.
	 */
	id: string;
	/** Human page name shown in the report. */
	name: string;
	/**
	 * Source files that render the page. Findings raised on the snapshot are then reported
	 * against our components instead of against `dom.html`.
	 */
	sources: string[];
	/** The page sits behind ProConnect — renders an auth badge in the report. */
	auth?: boolean;
	/** Reproduction steps / required state, carried into the auditor ticket. */
	notes?: string;
};

/**
 * Wait for the page to be settled enough that a snapshot describes what a user sees.
 *
 * DSFR flags its own boot with `data-fr-js` on `<html>`, then initializes each widget
 * (`data-fr-js-modal`, `data-fr-js-navigation`…). Serializing before that records a
 * half-mounted DOM and would manufacture non-conformities about markup the user never meets.
 *
 * Every wait past `load` is **bounded and best-effort**, on purpose. An unbounded
 * `networkidle` hung every anonymous page for the full test timeout on CI — a client request
 * that never completes there (nothing answers the analytics/monitoring hosts) means the
 * network is never idle, and Playwright's own documentation discourages the state for exactly
 * this reason. A snapshot taken a beat early is a slightly less settled page; a snapshot that
 * never happens is a missing page in a conformance report.
 */
export async function settle(page: Page) {
	await page.waitForLoadState("load");
	await page
		.waitForLoadState("networkidle", { timeout: 5_000 })
		.catch(() => undefined);
	await page
		.waitForFunction(
			() => document.documentElement.hasAttribute("data-fr-js"),
			undefined,
			{ timeout: 5_000 },
		)
		.catch(() => undefined);
	// DSFR binds its widget handlers a tick after setting the attribute; the repo's own
	// `helpers/dsfr.ts` yields the same 300 ms for the same race.
	await page.waitForTimeout(300);
}

/**
 * Record one page of the RGAA sample.
 *
 * `checkA11y` collects the document in the browser (DOM + computed styles + boxes +
 * stylesheets + a viewport screenshot), pipes it to `ultra11y snapshot write`, which persists
 * `.ultra11y/pages/<id>/` and audits it.
 *
 * `failOn: false` records without ever failing — phase 1 measures the real backlog before the
 * gate is turned on. The durable output is the snapshot, not the assertion: the Action
 * re-ingests `.ultra11y/pages/` as soon as the directory exists and re-audits it with no
 * browser, and that re-audit is what CI reports on.
 *
 * `probes: true` runs the measurements a recorded snapshot can never settle — 200% zoom,
 * 320px reflow, the text-spacing override, focus visibility, content on hover. They have to
 * happen HERE, on this page: `scan --runtime local` opens its own browser, which never gets
 * past the login or the state machine, so every criterion that depends on them came back
 * « à évaluer » run after run with the adjudicator correctly answering that nobody had
 * measured anything. The probes run after the collection, so what is recorded is the page as
 * this test built it, and they restore the viewport and remove their stylesheet before
 * returning — the assertions that follow must not be measuring their leftovers.
 */
export async function snapshotRoute(page: Page, route: A11yRoute) {
	const response = await page.goto(route.path);
	await settle(page);

	// A démarche screen is gated by the state machine: ask for one the current state does not
	// open and the app quietly redirects elsewhere. Recording that page under the requested
	// name would produce a sheet describing one screen under the identity of another — a
	// fabricated attribution, and the single worst failure mode of an accessibility report.
	// Better a visibly missing page than a confidently wrong one.
	//
	// `expectPath` below makes `checkA11y` refuse the same page. Both, deliberately: the
	// fixture is the backstop that also protects `snapshotCurrentPage` and anyone who forgets
	// this helper, while a `test.skip` is a VISIBLE line in the Playwright report — "this
	// screen was not sampled, and here is why" — which is what a reader of the sweep needs.
	const landed = new URL(page.url()).pathname;
	test.skip(
		landed !== route.path,
		`${route.path} a redirigé vers ${landed} — l'état courant n'ouvre pas cet écran, rien à échantillonner sous « ${route.name} »`,
	);

	// The other half, and the one an address comparison cannot see: a route that answers
	// `notFound()` renders the 404 page AT the requested URL. `/recapitulatif` does exactly
	// that on a draft declaration. Without this check the sweep records Next's not-found page
	// under « Déclaration — récapitulatif » — same fabricated attribution, arrived at by a
	// door the redirect check does not watch.
	const status = response?.status();
	test.skip(
		status !== undefined && status >= 400,
		`${route.path} a répondu HTTP ${status} — page d'erreur rendue à la même adresse, rien à échantillonner sous « ${route.name} »`,
	);

	await checkA11y(page, {
		as: route.id,
		name: route.name,
		sources: route.sources,
		auth: route.auth,
		notes: route.notes,
		expectPath: route.path,
		failOn: false,
		probes: true,
	});
}

/**
 * Record the page as the test currently left it — a funnel step, an open modal, a filled
 * form. Unlike {@link snapshotRoute} it does not navigate: the state is the caller's.
 */
export async function snapshotCurrentPage(page: Page, route: A11yRoute) {
	await settle(page);

	await checkA11y(page, {
		as: route.id,
		name: route.name,
		sources: route.sources,
		auth: route.auth,
		notes: route.notes,
		failOn: false,
		probes: true,
	});
}
