import { expect, test } from "@playwright/test";
import { COMPLIANCE_PATH, selectCompliancePath } from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";
import { TEST_SIREN } from "./constants";

/**
 * End-to-end contract test for the SUIT declarations export
 * (`GET /api/v1/export/declarations`), the machine API consumed by the SUIT
 * gateway (bug #3950 — « choix justification écart sans CSE »).
 *
 * The A–F stepper records internal `step_change` rows in the status history;
 * these must never surface in the exported `Historique_statuts`, and every
 * exported entry must carry a human-readable `Libelle_statut`. Unit tests cover
 * the assembly in isolation; this spec proves the full chain — real UI
 * declaration → real Postgres → SQL projection → gateway auth → JSON contract —
 * against a running server, which is the only place the `eventType != 'step_change'`
 * SQL filter actually runs.
 */

test.describe.configure({ mode: "serial" });

// Dev gateway shared secret — the deterministic local value from `.env.example`.
// Not a secret. In prod the value is injected into the `X-Gateway-Forwarded`
// header by the APISIX `proxy-rewrite` plugin; the E2E server runs with the same
// value so the middleware's constant-time check passes.
const DEV_GATEWAY_SHARED_SECRET = "dev-gateway-shared-secret-minimum-32-chars";
const EXPORT_PATH = "/api/v1/export/declarations";

// Mirror of DECLARATION_EVENT_TYPE_LABELS keys — the only status values the
// public contract is allowed to emit. `step_change` is deliberately absent.
const PUBLIC_STATUTS = new Set([
	"submit",
	"path_choice",
	"second_declaration_submit",
	"joint_evaluation_submit",
	"cse_opinion_submit",
	"cancel",
	"demarche_complete",
]);

const DAY_MS = 86_400_000;
function dayString(offsetDays: number): string {
	return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}
function exportUrl(): string {
	return `${EXPORT_PATH}?date_begin=${dayString(-1)}&date_end=${dayString(1)}`;
}

test.describe("SUIT export declarations — status history contract (bug #3950)", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("completes a declaration with a gap and records the justify path choice", async ({
		page,
	}) => {
		test.slow(); // Full 6-step declaration + compliance choice
		await completeDeclaration(page, { hasGap: true });
		// Gap → compliance choice page; the justify option records a path_choice
		// event and, once the A–F stepper has run, the history carries internal
		// step_change rows that the export must strip.
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/etape/1", { timeout: 10_000 });
	});

	test("gateway request without the shared secret is rejected with 403", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(exportUrl());
			expect(response.status()).toBe(403);
		} finally {
			await anonCtx.close();
		}
	});

	test("Historique_statuts excludes internal step_change events and always carries a Libelle_statut", async ({
		browser,
	}) => {
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(exportUrl(), {
				headers: { "X-Gateway-Forwarded": DEV_GATEWAY_SHARED_SECRET },
			});
			expect(response.status()).toBe(200);

			const body = await response.json();
			const declaration = body.Declarations.find(
				(entry: { SIREN: string }) => entry.SIREN === TEST_SIREN,
			);
			expect(
				declaration,
				"the freshly completed test declaration is present in the export",
			).toBeTruthy();

			const history = declaration.Historique_statuts as Array<{
				Statut: string;
				Libelle_statut: unknown;
			}>;
			expect(Array.isArray(history)).toBe(true);
			expect(history.length).toBeGreaterThan(0);

			// The internal step_change rows recorded by the A–F stepper must not leak.
			expect(history.some((entry) => entry.Statut === "step_change")).toBe(
				false,
			);

			for (const entry of history) {
				expect(PUBLIC_STATUTS.has(entry.Statut)).toBe(true);
				expect(typeof entry.Libelle_statut).toBe("string");
				expect((entry.Libelle_statut as string).length).toBeGreaterThan(0);
			}

			// The submission and the justify path choice are materialised in the
			// machine contract with their public labels.
			const statuts = history.map((entry) => entry.Statut);
			expect(statuts).toContain("submit");
			expect(statuts).toContain("path_choice");

			const pathChoice = history.find((entry) => entry.Statut === "path_choice");
			expect(pathChoice?.Libelle_statut).toBe(
				"Choix du parcours — Justification de l'écart",
			);
		} finally {
			await anonCtx.close();
		}
	});
});
