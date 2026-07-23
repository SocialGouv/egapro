import { expect, test } from "@playwright/test";
import { TEST_SIREN } from "./constants";
import { resetDeclarationToDraft } from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

/**
 * End-to-end test for the SUIT declarations export contract
 * (`GET /api/v1/export/declarations`).
 *
 * Non-regression guard for #3942: the indicator G (indicateur 7) categories
 * used to serialize only the raw declared amounts, never the computed pay
 * gaps. This exercises the full HTTP + gateway auth + DB + serialization
 * chain against a real running server to prove the six `*_ecart` fields are
 * now emitted per category — something the DB-mocking unit tests cannot.
 *
 * A declaration is submitted through the real 6-step funnel so the indicator
 * G category carries known base amounts (women 1000 / men 1100), then read
 * back through the SUIT branch (triggered by the `X-Gateway-Forwarded`
 * header, the same edge-auth path covered by `fileUpload.e2e.ts`).
 */

test.describe.configure({ mode: "serial" });

// Dev gateway shared secret — the deterministic local value from
// `.env.example`, injected in prod by the APISIX `proxy-rewrite` plugin into
// the `X-Gateway-Forwarded` header. Not a secret.
const DEV_GATEWAY_SHARED_SECRET = "dev-gateway-shared-secret-minimum-32-chars";

// The six computed gap fields the export must expose per indicator G category.
const ECART_KEYS = [
	"Rem_annuelle_base_ecart",
	"Rem_annuelle_variable_ecart",
	"Rem_annuelle_total_ecart",
	"Taux_horaire_base_ecart",
	"Taux_horaire_variable_ecart",
	"Taux_horaire_total_ecart",
] as const;

// updatedAt (submission date) is filtered in UTC; a [yesterday, tomorrow)
// window brackets "now" regardless of the UTC day boundary.
function isoDate(offsetDays: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

test.describe("SUIT declarations export — indicator G computed gaps", () => {
	test.beforeAll(async () => {
		await resetDeclarationToDraft();
	});

	test.afterAll(async () => {
		await resetDeclarationToDraft();
	});

	test("emits the six *_ecart fields per indicator G category with the signed (H−F)/H convention", async ({
		page,
		browser,
	}) => {
		test.slow(); // Full 6-step declaration funnel + submission.
		await completeDeclaration(page, { hasGap: true });

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(
				`/api/v1/export/declarations?date_begin=${isoDate(-1)}&date_end=${isoDate(1)}`,
				{ headers: { "X-Gateway-Forwarded": DEV_GATEWAY_SHARED_SECRET } },
			);
			expect(response.status()).toBe(200);

			const body = await response.json();
			const declaration = body.Declarations.find(
				(d: { SIREN: string }) => d.SIREN === TEST_SIREN,
			);
			expect(declaration).toBeDefined();

			const categories = declaration.Indicateurs.G;
			expect(Array.isArray(categories)).toBe(true);
			expect(categories.length).toBeGreaterThan(0);

			// Every category must carry the six computed-gap fields (the bug: absent).
			for (const category of categories) {
				for (const key of ECART_KEYS) {
					expect(category).toHaveProperty(key);
				}
			}

			// The funnel fills category 1's annual base at women 1000 / men 1100,
			// leaving variable and hourly amounts empty. Numeric strings keep their
			// DB scale ("1100.00"), so compare on the parsed value.
			const filled = categories.find(
				(c: { Rem_annuelle_base_H: string | null }) =>
					c.Rem_annuelle_base_H !== null &&
					Number(c.Rem_annuelle_base_H) === 1100,
			);
			expect(filled).toBeDefined();

			// (1100 − 1000) / 1100 = 0.0909, rounded to 4 decimals.
			expect(filled.Rem_annuelle_base_ecart).toBe(0.0909);
			// No variable amount → total equals base.
			expect(filled.Rem_annuelle_total_ecart).toBe(0.0909);
			// Null-safe: variable and hourly amounts were never entered.
			expect(filled.Rem_annuelle_variable_ecart).toBeNull();
			expect(filled.Taux_horaire_base_ecart).toBeNull();
			expect(filled.Taux_horaire_variable_ecart).toBeNull();
			expect(filled.Taux_horaire_total_ecart).toBeNull();
		} finally {
			await anonCtx.close();
		}
	});
});
