import type { ChildProcess } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";

import { getCurrentYear } from "~/modules/domain";
import {
	API_UPLOAD,
	FORMAL_NOTICE_JOINT_EVALUATION,
	MY_SPACE,
	mySpaceHistoryHref,
} from "~/modules/routes";
import { SUBMIT_LABEL } from "~/modules/shared/submitLabels";
import { TEST_SIREN, TEST_USER_EMAIL, TEST_USER_PHONE } from "./constants";
import { DUMMY_PDF } from "./helpers/compliance-flows";
import {
	countFormalNoticeFiles,
	deleteCseOpinions,
	deleteFormalNoticeFiles,
	ensureCurrentYearDeclaration,
	resetDeclarationToDraft,
	setCompanyHasCse,
	setDeclarationComplianceState,
	setGapCseOpinion,
	setUserPhone,
} from "./helpers/db";
import { waitForEmail } from "./helpers/mailpit";
import {
	clearNotificationQueue,
	killWorker,
	spawnNotificationsWorker,
	waitForWorkerReady,
} from "./helpers/notifications-worker";
import { openPanneauDemarche } from "./helpers/process-panel";
import { mailChainAvailable } from "./helpers/receipts";
import { urlGlob } from "./helpers/routes";

const CURRENT_YEAR = getCurrentYear();
const FORMAL_NOTICE_TEXT = /Si votre entreprise a été mise en demeure/;
const FORMAL_NOTICE_LINK = /Dépôt du rapport de l.évaluation conjointe/;
const RECEIPT_SUBJECT =
	"Egapro - Dépôt rapport de l'évaluation conjointe des rémunérations suite à mise en demeure";

async function closeJustifiedDemarche(cseRequired: boolean) {
	await setDeclarationComplianceState({
		status: "demarche_completed",
		firstDeclarationPathChoice: "justify",
		cseRequired,
		demarcheCompletedAt: new Date(),
		cseOpinionCompletedAt: cseRequired ? new Date() : null,
	});
}

async function openClosedDemarchePanel(page: Page) {
	const panel = await openPanneauDemarche(page);
	await expect(panel.getByText("Démarche close")).toBeVisible();
	return panel;
}

test.describe("Formal notice — joint evaluation report deposit", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);

	let notificationsWorker: ChildProcess | null = null;

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await ensureCurrentYearDeclaration();
		await setUserPhone(TEST_USER_PHONE);
		await setCompanyHasCse(true);
		await deleteCseOpinions();
		await deleteFormalNoticeFiles();
		await closeJustifiedDemarche(true);
		await setGapCseOpinion(CURRENT_YEAR, "unfavorable");
		if (await mailChainAvailable()) {
			await clearNotificationQueue();
			notificationsWorker = spawnNotificationsWorker();
			await waitForWorkerReady(notificationsWorker);
		}
	});

	test.afterAll(async () => {
		if (notificationsWorker) await killWorker(notificationsWorker);
		await deleteFormalNoticeFiles();
		await deleteCseOpinions();
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
	});

	test("a closed démarche whose justification got an unfavourable CSE opinion offers the report deposit", async ({
		page,
	}) => {
		const panel = await openClosedDemarchePanel(page);
		await expect(panel.getByText(FORMAL_NOTICE_TEXT)).toBeVisible();

		await panel.getByRole("link", { name: FORMAL_NOTICE_LINK }).click();
		await page.waitForURL(urlGlob(FORMAL_NOTICE_JOINT_EVALUATION));
		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "En cas de mise en demeure",
			}),
		).toBeVisible();
		await expect(page.getByText("Rapport déjà déposé")).toHaveCount(0);
	});

	test("deposits and transmits the report, then records it without reopening the démarche", async ({
		page,
	}) => {
		const since = new Date();

		await test.step("dépôt et transmission du rapport", async () => {
			await page.goto(FORMAL_NOTICE_JOINT_EVALUATION);
			await page
				.locator("#formal-notice-joint-evaluation-file-upload")
				.setInputFiles(DUMMY_PDF);
			await page
				.getByRole("button", { exact: true, name: SUBMIT_LABEL })
				.click();
			await page
				.getByText(/Je certifie que le rapport transmis est conforme/)
				.click();
			await page.getByRole("button", { name: "Valider" }).click();
			await page.waitForURL(urlGlob(MY_SPACE), { timeout: 30_000 });
		});

		await test.step("la démarche reste close", async () => {
			await expect(page.getByText("Effectué").first()).toBeVisible();
			expect(await countFormalNoticeFiles()).toBe(1);
		});

		await test.step("l'historique porte le dépôt", async () => {
			await page.goto(mySpaceHistoryHref(TEST_SIREN, CURRENT_YEAR));
			await expect(
				page.locator("main ul > li").first().getByRole("link", {
					name: "Évaluation conjointe - mise en demeure",
				}),
			).toHaveAttribute("href", FORMAL_NOTICE_JOINT_EVALUATION);
		});

		await test.step("la page affiche le rapport déposé", async () => {
			await page.goto(FORMAL_NOTICE_JOINT_EVALUATION);
			await expect(page.getByText("Rapport déjà déposé")).toBeVisible();
		});

		if (notificationsWorker) {
			await test.step("accusé de réception", async () => {
				const email = await waitForEmail(
					TEST_USER_EMAIL,
					(m) => m.subject === RECEIPT_SUBJECT,
					{ since },
				);
				expect(email.html).toContain(TEST_SIREN);
			});
		}
	});

	test("a justified démarche without a CSE also offers the report deposit", async ({
		page,
	}) => {
		await deleteCseOpinions();
		await closeJustifiedDemarche(false);

		const panel = await openClosedDemarchePanel(page);
		await expect(
			panel.getByRole("link", { name: FORMAL_NOTICE_LINK }),
		).toBeVisible();
	});

	test.describe("a démarche whose justification got a favourable CSE opinion", () => {
		test.beforeAll(async () => {
			await deleteFormalNoticeFiles();
			await closeJustifiedDemarche(true);
			await setGapCseOpinion(CURRENT_YEAR, "favorable");
		});

		test("offers no deposit, and its URL sends back to Mon espace", async ({
			page,
		}) => {
			const panel = await openClosedDemarchePanel(page);
			await expect(panel.getByText(FORMAL_NOTICE_TEXT)).toHaveCount(0);

			await page.goto(FORMAL_NOTICE_JOINT_EVALUATION);
			await page.waitForURL(urlGlob(MY_SPACE));
		});

		test("refuses a direct upload without storing anything", async ({
			page,
		}) => {
			const response = await page.request.post(API_UPLOAD, {
				headers: {
					"Content-Type": "application/pdf",
					"X-Filename": "dummy.pdf",
					"X-Flow-Type": "formal_notice_joint_evaluation",
				},
				data: await readFile(DUMMY_PDF),
			});

			expect(response.status()).toBeGreaterThanOrEqual(400);
			expect(response.status()).toBeLessThan(500);
			expect((await response.json()).reason).toBe("formal_notice_unavailable");
			expect(await countFormalNoticeFiles()).toBe(0);
		});
	});
});
