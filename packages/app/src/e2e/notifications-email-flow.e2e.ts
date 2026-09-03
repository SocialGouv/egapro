import type { ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { TEST_USER_EMAIL } from "./constants";
import {
	associateCseContentTypes,
	COMPLIANCE_PATH,
	completeSecondDeclaration,
	fillCseStep1,
	selectCompliancePath,
	submitCseOpinion,
	uploadCseFiles,
} from "./helpers/compliance-flows";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";
import {
	clearMailpit,
	listEmailsTo,
	mailpitReachable,
	waitForEmail,
} from "./helpers/mailpit";
import {
	clearNotificationQueue,
	isMailFlowEnabled,
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "./helpers/notifications-worker";
import {
	CSE_TO_DEPOSIT_WORDING,
	expectCompletionReceipt,
	PATH_TO_SELECT_WORDING,
} from "./helpers/receipts";

const CSE_OPINION_RECEIPT = /Dépôt d'avis CSE et fin de démarche/i;

async function countCseOpinionReceipts(): Promise<number> {
	const emails = await listEmailsTo(TEST_USER_EMAIL);
	return emails.filter((m) => CSE_OPINION_RECEIPT.test(m.subject)).length;
}

test.describe("notifications email flow (publisher → pg-boss → worker → SMTP → mailpit)", () => {
	let worker: ChildProcess | null = null;

	test.beforeAll(async () => {
		if (!(await mailpitReachable())) {
			test.skip(true, "Mailpit unreachable — start docker-compose or skipping");
		}
		if (!isMailFlowEnabled()) {
			test.skip(
				true,
				"MAIL_ENABLED!=true on the app server — publisher is no-op, skipping",
			);
		}
		await clearNotificationQueue();
		worker = spawnNotificationsWorker();
		await waitForWorkerReady(worker);
	});

	test.afterAll(async () => {
		if (worker) await killWorker(worker);
	});

	test.beforeEach(async () => {
		await clearNotificationQueue();
		await clearMailpit();
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(60);
	});

	test("declaration submission delivers a confirmation email to Mailpit", async ({
		page,
	}) => {
		test.slow();
		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: false });

		const email = await waitForEmail(
			TEST_USER_EMAIL,
			(m) => /Transmission de déclaration/i.test(m.subject),
			{ since: startedAt },
		);

		expect(email.subject).toMatch(/Transmission de déclaration/i);
		expect(email.to.some((r) => r.address === TEST_USER_EMAIL)).toBe(true);
		expect(email.html).toMatch(/accuse réception de cette transmission/i);
	});

	test("CSE opinion receipt is sent once at submission, never on a file deposit (#4300)", async ({
		page,
	}) => {
		test.slow();
		// A gap declaration settled on the "justify" path opens two matrix columns,
		// which is what lets two deposited files both be associated: a column holds
		// exactly one file.
		await setCompanyWorkforce(200);
		await setCompanyHasCse(true);
		await clearMailpit();

		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-justify");
		await page.waitForURL("**/avis-cse/**", { timeout: 10_000 });
		await fillCseStep1(page, { firstDeclGapConsulted: true });

		const accuracyFile = "avis-cse-exactitude.pdf";
		const gapFile = "avis-cse-justification.pdf";

		await test.step("depositing two files sends no receipt", async () => {
			await uploadCseFiles(page, [accuracyFile, gapFile]);
			// The receipt announces "votre démarche est désormais terminée"; a deposit
			// must never claim it. Settle past the worker poll so a mail wrongly
			// enqueued on upload would have been delivered before we assert none.
			await page.waitForTimeout(10_000);
			expect(await countCseOpinionReceipts()).toBe(0);
		});

		await test.step("submitting sends exactly one receipt", async () => {
			await associateCseContentTypes(page, [
				{
					column: { declarationNumber: 1, type: "accuracy" },
					fileName: accuracyFile,
				},
				{ column: { declarationNumber: 1, type: "gap" }, fileName: gapFile },
			]);
			await submitCseOpinion(page);

			const receipt = await waitForEmail(
				TEST_USER_EMAIL,
				(m) => CSE_OPINION_RECEIPT.test(m.subject),
				{ since: startedAt },
			);
			expect(receipt.to.some((r) => r.address === TEST_USER_EMAIL)).toBe(true);
			expect(receipt.html).toMatch(/démarche est désormais terminée/i);

			// Any deposit-time receipt would have been queued before this one, so it
			// would already have been delivered — the total is the real assertion.
			expect(await countCseOpinionReceipts()).toBe(1);
		});
	});

	test("second declaration submission (corrective action) delivers a second-declaration receipt", async ({
		page,
	}) => {
		test.slow();
		// Corrective action requires a CSE-eligible company (>= 100 employees)
		// and a first declaration with a gap >= 5% so the compliance choice
		// page appears. Switching state here keeps the default beforeEach
		// (workforce=60, no CSE) intact for the other test.
		await setCompanyWorkforce(200);
		await setCompanyHasCse(true);
		await clearMailpit();

		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: true });

		await test.step("first-declaration receipt states the round-1 path-choice deadline in French (#4207)", async () => {
			const firstReceipt = await waitForEmail(
				TEST_USER_EMAIL,
				(m) => /Transmission de la déclaration/i.test(m.subject),
				{ since: startedAt },
			);
			// Round 1 is July 1st, not the round-2 January deadline.
			expect(firstReceipt.html).toMatch(/1ᵉʳ juillet/);
			expect(firstReceipt.html).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
		});

		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: false });

		const email = await waitForEmail(
			TEST_USER_EMAIL,
			(m) => /Transmission de la seconde déclaration/i.test(m.subject),
			{ since: startedAt },
		);

		expect(email.subject).toMatch(/Transmission de la seconde déclaration/i);
		expect(email.to.some((r) => r.address === TEST_USER_EMAIL)).toBe(true);
		expect(email.html).toMatch(/seconde déclaration/i);
		// #4293 — CAS-08: an avis CSE is still owed, so the receipt is the
		// `cse_to_deposit` variant. It shares its subject with `path_to_select`,
		// which is what this used to be, so only the body pins the variant.
		await test.step("CAS-08 — the receipt asks for the avis CSE, not for a path choice (#4293)", async () => {
			expect(email.html).toMatch(CSE_TO_DEPOSIT_WORDING);
			expect(email.html).not.toMatch(PATH_TO_SELECT_WORDING);
		});
	});

	test("CAS-03 — justify without CSE ends the démarche and delivers its receipt (#4293)", async ({
		page,
	}) => {
		test.slow();
		// The path-choice screen only exists from the >= 100 tier up, which is
		// where the grid places CAS-03; the beforeEach default (60) never reaches it.
		await setCompanyWorkforce(200);

		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-justify");

		await expectCompletionReceipt({ round: "first", since: startedAt });
	});

	test("CAS-09 — round-2 justify without CSE ends the démarche and delivers its receipt (#4293)", async ({
		page,
	}) => {
		test.slow();
		await setCompanyWorkforce(200);

		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: true });
		await selectCompliancePath(page, "path-corrective");
		await completeSecondDeclaration(page, { hasGap: true });
		await page.waitForURL(`**${COMPLIANCE_PATH}`, { timeout: 10_000 });
		await selectCompliancePath(page, "path-justify");

		await expectCompletionReceipt({ round: "second", since: startedAt });
	});
});
