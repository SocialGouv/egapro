import { expect, test } from "@playwright/test";
import {
	selectCompliancePath,
	uploadJointEvalPdf,
} from "./helpers/compliance-flows";
import {
	deleteJointEvaluationFiles,
	getLatestJointEvaluationFileIdForTestSiren,
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";

/**
 * End-to-end tests for the file upload + view access-control boundary.
 *
 * Coverage:
 *  - Scenario A (session user): upload a file through the real UI pipeline,
 *    then verify the unified download endpoint correctly enforces the
 *    session-auth branch: 200 inline for the authenticated caller, 401 for
 *    anonymous callers, 404 for unknown fileIds (which also exercises the
 *    SIREN filter in `fetchFileBySiren`).
 *  - Scenario B (SUIT API): verify the SUIT branch is triggered by the
 *    `X-Gateway-Forwarded` header (injected by APISIX in prod, simulated
 *    here with the dev shared secret), returns 200 with `attachment`
 *    disposition, rejects a wrong secret with 403, and — critically —
 *    verifies that no gateway-based path lets a caller reach the upload
 *    endpoint (read-only invariant).
 *
 * The strict cross-SIREN isolation case is already covered exhaustively by
 * the unit tests in `src/modules/export/__tests__/filesApi.test.ts`; this
 * spec focuses on the full HTTP + auth + pipeline + S3 chain against a real
 * running server.
 */

// Share state across the steps so the upload happens once and all the view
// checks run fast against the same S3 object.
test.describe.configure({ mode: "serial" });

// Dev gateway shared secret — the deterministic local value from
// `.env.example`. Not a secret. In prod the value is injected into the
// `X-Gateway-Forwarded` header by the APISIX `proxy-rewrite` plugin; the
// E2E server runs with the same `.env`, so this value passes the
// middleware's constant-time check.
const DEV_GATEWAY_SHARED_SECRET = "dev-gateway-shared-secret-minimum-32-chars";

test.describe("file upload + view access control", () => {
	let fileId: string;

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test.afterAll(async () => {
		await deleteJointEvaluationFiles();
		await resetDeclarationToDraft();
	});

	test("uploads a joint evaluation PDF through the real pipeline and returns a fileId", async ({
		page,
	}) => {
		test.slow(); // Full declaration + compliance + joint eval upload
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-joint");
		await uploadJointEvalPdf(page);

		// `uploadJointEvalPdf` clicks the modal's Valider but returns before the
		// async upload + router.push settles. Wait for the post-compliance
		// destination so the S3 commit + DB insert have actually landed.
		await page.waitForURL("**/avis-cse/**", { timeout: 15_000 });

		const uploaded = await getLatestJointEvaluationFileIdForTestSiren();
		expect(uploaded).not.toBeNull();
		fileId = uploaded as string;
	});

	test("session user fetches their own file → 200 attachment (admin user)", async ({
		page,
	}) => {
		// The E2E test user (test@fia1.fr) is in ADMIN_EMAILS, so the unified
		// endpoint treats them as admin: attachment disposition, cached response.
		expect(fileId).toBeTruthy();

		const response = await page.request.get(`/api/v1/files/${fileId}`);

		expect(response.status()).toBe(200);
		const disposition = response.headers()["content-disposition"] ?? "";
		expect(disposition.toLowerCase()).toContain("attachment");
		expect(response.headers()["cache-control"]).toBe("private, max-age=3600");
		// Body is a real PDF from the dummy fixture.
		const body = await response.body();
		expect(body.byteLength).toBeGreaterThan(0);
		expect(body.subarray(0, 4).toString("utf8")).toBe("%PDF");
	});

	test("anonymous request is rejected with 401", async ({ browser }) => {
		expect(fileId).toBeTruthy();

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(`/api/v1/files/${fileId}`);
			expect(response.status()).toBe(401);
		} finally {
			await anonCtx.close();
		}
	});

	test("authenticated request for an unknown fileId returns 404", async ({
		page,
	}) => {
		const unknownId = "00000000-0000-0000-0000-000000000000";
		const response = await page.request.get(`/api/v1/files/${unknownId}`);
		expect(response.status()).toBe(404);
	});

	test("gateway-forwarded request → 200 attachment", async ({ browser }) => {
		expect(fileId).toBeTruthy();

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(`/api/v1/files/${fileId}`, {
				headers: {
					"X-Gateway-Forwarded": DEV_GATEWAY_SHARED_SECRET,
				},
			});
			expect(response.status()).toBe(200);
			const disposition = response.headers()["content-disposition"] ?? "";
			expect(disposition.toLowerCase()).toContain("attachment");
		} finally {
			await anonCtx.close();
		}
	});

	test("invalid gateway shared secret → 403", async ({ browser }) => {
		expect(fileId).toBeTruthy();

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(`/api/v1/files/${fileId}`, {
				headers: {
					"X-Gateway-Forwarded": "definitely-not-the-right-gateway-secret",
				},
			});
			expect(response.status()).toBe(403);
		} finally {
			await anonCtx.close();
		}
	});

	test("gateway header cannot upload via POST /api/upload (read-only invariant)", async ({
		browser,
	}) => {
		// The upload endpoint only trusts NextAuth sessions. This test guards
		// that a caller who somehow reached the app via the gateway cannot
		// use that route to upload — the gateway is configured to only
		// proxy GET /api/v1/* anyway, but the app-side invariant matters.
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.post("/api/upload", {
				headers: {
					"X-Gateway-Forwarded": DEV_GATEWAY_SHARED_SECRET,
					"Content-Type": "application/pdf",
					"X-Filename": "should-be-rejected.pdf",
					"X-Flow-Type": "cse_opinion",
				},
				data: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]),
			});
			expect(response.status()).toBe(401);
		} finally {
			await anonCtx.close();
		}
	});
});
