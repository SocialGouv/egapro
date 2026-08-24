import { test } from "@playwright/test";

import { snapshotRoute } from "./snapshot";

/**
 * The pages that exist only for a VISITOR WHO IS NOT SIGNED IN.
 *
 * The sweep runs under the ProConnect storageState, because almost everything worth auditing
 * here is behind it. Two declared pages are the exception, and the session is precisely what
 * hides them: signed in, `/` redirects to the espace and `/login` redirects into the app. The
 * sweep did the right thing both times — it saw the browser leave the requested path and
 * skipped rather than filing another screen under their name — and the result was that the
 * home page and the sign-in page, the two screens every single visitor meets first, were the
 * only ones the RGAA report never covered.
 *
 * Nothing said so. The report was simply two pages shorter, which reads exactly like a
 * complete one; it took `ultra11y check --require-sample` to name them.
 *
 * The override drops the session for this file alone — a fresh context, no cookies — which is
 * the state these two pages are written for.
 *
 * It has to be an EMPTY STATE, never `undefined`. Measured against Playwright 1.62 with a
 * three-case probe: `test.use({ storageState: undefined })` behaves exactly like not overriding
 * at all — the project's own `storageState` still applies and the context still carries the
 * ProConnect cookie. `undefined` reads as «inherit», never as «none», and the first version of
 * this file was skipped on the very redirect it was written to avoid.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("RGAA — pages hors session", () => {
	test("snapshot la page d'accueil", async ({ page }) => {
		await snapshotRoute(page, {
			path: "/",
			id: "accueil",
			name: "Page d'accueil",
			sources: ["src/app/page.tsx", "src/modules/home/HomePage.tsx"],
			notes:
				"Anonymous visitor: signed in, `/` redirects to `/mon-espace`, so this page is only reachable without a session.",
		});
	});

	test("snapshot la page d'authentification", async ({ page }) => {
		await snapshotRoute(page, {
			path: "/login",
			id: "login",
			name: "Authentification",
			sources: ["src/app/login/page.tsx"],
			notes:
				"Anonymous visitor: a live session redirects away from the sign-in screen.",
		});
	});
});
