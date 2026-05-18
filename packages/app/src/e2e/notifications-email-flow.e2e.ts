import type { ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import { completeDeclaration } from "./helpers/declaration-flows";
import {
	clearMaildev,
	maildevReachable,
	waitForEmail,
} from "./helpers/maildev";
import {
	isMailFlowEnabled,
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "./helpers/notifications-worker";

const TEST_USER_EMAIL = "test@fia1.fr";

test.describe("notifications email flow (publisher → pg-boss → worker → SMTP → maildev)", () => {
	let worker: ChildProcess | null = null;

	test.beforeAll(async () => {
		if (!(await maildevReachable())) {
			test.skip(true, "MailDev unreachable — start docker-compose or skipping");
		}
		if (!isMailFlowEnabled()) {
			test.skip(
				true,
				"MAIL_ENABLED!=true on the app server — publisher is no-op, skipping",
			);
		}
		worker = spawnNotificationsWorker();
		await waitForWorkerReady(worker);
	});

	test.afterAll(async () => {
		if (worker) await killWorker(worker);
	});

	test.beforeEach(async () => {
		await clearMaildev();
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(60);
	});

	test("declaration submission delivers a confirmation email to MailDev", async ({
		page,
	}) => {
		test.slow();
		const startedAt = new Date();
		await completeDeclaration(page, { hasGap: false });

		const email = await waitForEmail(
			TEST_USER_EMAIL,
			(m) => /Déclaration des indicateurs/i.test(m.subject),
			{ since: startedAt },
		);

		expect(email.subject).toMatch(/Déclaration des indicateurs/i);
		expect(email.to.some((r) => r.address === TEST_USER_EMAIL)).toBe(true);
		expect(email.html).toMatch(/SIREN/i);
	});
});
