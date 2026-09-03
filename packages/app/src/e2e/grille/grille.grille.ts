import type { ChildProcess } from "node:child_process";
import { test } from "@playwright/test";
import { withCampaignYear } from "../helpers/campaign-year";
import { setCompanyHasCse } from "../helpers/db";
import {
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "../helpers/notifications-worker";
import { mailChainAvailable } from "../helpers/receipts";
import { buildGrid } from "./coordinates";
import { FICHE_SCENARIOS } from "./scenarios";

test.describe.configure({ mode: "serial" });

// #4293 — CAS-03 and CAS-09 close the démarche on the path choice itself, with no
// upload screen after it: their acknowledgement is only observable in the mail
// chain. The grid workflow already runs Mailpit and sets MAIL_ENABLED, but no
// service starts the notifications worker, so the grid spawns it exactly like
// `notifications-email-flow.e2e.ts` does. Off that environment the coordinates
// still run — see `expectCompletionReceiptWhenMailChainUp`.
let notificationsWorker: ChildProcess | null = null;

test.beforeAll(async () => {
	if (!(await mailChainAvailable())) return;
	notificationsWorker = spawnNotificationsWorker();
	await waitForWorkerReady(notificationsWorker);
});

test.afterAll(async () => {
	if (notificationsWorker) await killWorker(notificationsWorker);
});

for (const coordinate of buildGrid()) {
	test.describe(`[${coordinate.id}][${coordinate.fiche}] ${coordinate.rappel}`, () => {
		const scenario =
			FICHE_SCENARIOS[coordinate.fiche as keyof typeof FICHE_SCENARIOS];
		test(coordinate.rappel, async ({ page }) => {
			await withCampaignYear(
				{ page, year: coordinate.year, workforce: coordinate.workforce },
				async () => {
					await setCompanyHasCse(coordinate.hasCse);
					await scenario({ page, coordinate });
				},
			);
		});
	});
}
