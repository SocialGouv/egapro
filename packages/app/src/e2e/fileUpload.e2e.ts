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
 *    `x-signature` header, returns 200 with `attachment` disposition on a
 *    valid Bearer key, rejects a wrong key with 401, and — critically —
 *    verifies that the SUIT credentials are **not** accepted by the upload
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

// Dev SUIT API key — the deterministic local value from `.env.example`. Not
// a secret. The E2E server runs with the same `.env`, so this Bearer token
// passes the constant-time check. Signature verification is auto-disabled in
// the local dev env because `EGAPRO_SUIT_PUBLIC_KEY_PEM` is unset.
const DEV_SUIT_API_KEY = "dev-suit-api-key-minimum-32-chars-long";

test.describe("file upload + view access control", () => {
	let fileId: string;

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
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

		const uploaded = await getLatestJointEvaluationFileIdForTestSiren();
		expect(uploaded).not.toBeNull();
		fileId = uploaded as string;
	});

	test("session user fetches their own file → 200 inline", async ({ page }) => {
		expect(fileId).toBeTruthy();

		const response = await page.request.get(`/api/v1/files/${fileId}`);

		expect(response.status()).toBe(200);
		const disposition = response.headers()["content-disposition"] ?? "";
		expect(disposition.toLowerCase()).toContain("inline");
		expect(response.headers()["cache-control"]).toBe("private, no-store");
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

	test("SUIT API with valid bearer + x-signature → 200 attachment", async ({
		browser,
	}) => {
		expect(fileId).toBeTruthy();

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(`/api/v1/files/${fileId}`, {
				headers: {
					Authorization: `Bearer ${DEV_SUIT_API_KEY}`,
					"x-signature": "e2e-signature",
					"x-timestamp": `${Math.floor(Date.now() / 1000)}`,
				},
			});
			expect(response.status()).toBe(200);
			const disposition = response.headers()["content-disposition"] ?? "";
			expect(disposition.toLowerCase()).toContain("attachment");
		} finally {
			await anonCtx.close();
		}
	});

	test("SUIT API with wrong bearer key → 401", async ({ browser }) => {
		expect(fileId).toBeTruthy();

		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.get(`/api/v1/files/${fileId}`, {
				headers: {
					Authorization: "Bearer invalid-key-invalid-key-invalid-key-inv",
					"x-signature": "e2e-signature",
				},
			});
			expect(response.status()).toBe(401);
		} finally {
			await anonCtx.close();
		}
	});

	test("SUIT credentials cannot upload via POST /api/upload (read-only invariant)", async ({
		browser,
	}) => {
		// The upload endpoint only trusts NextAuth sessions — SUIT credentials
		// must never be accepted as a write channel. This test guards that
		// invariant so a future refactor of the download router cannot
		// accidentally leak into the upload router.
		const anonCtx = await browser.newContext({ storageState: undefined });
		try {
			const response = await anonCtx.request.post("/api/upload", {
				headers: {
					Authorization: `Bearer ${DEV_SUIT_API_KEY}`,
					"x-signature": "e2e-signature",
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
