import { expect, test } from "@playwright/test";
import { MY_SPACE, remunerationStepHref } from "~/modules/routes";
import {
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	resetDeclarationToDraft,
} from "./helpers/db";
import {
	clearDeclarationLockFixture,
	OTHER_LOCK_HOLDER_ID,
	OTHER_LOCK_HOLDER_NAME,
	readDeclarationLockOwner,
	releaseDeclarationLock,
	seedOtherDeclarantLock,
	seedReadableWorkforce,
} from "./helpers/db-lock";
import { clickAndExpectDialogOpen, waitForDsfrModal } from "./helpers/dsfr";

const STEP_1 = remunerationStepHref(1);
const PANEL_ID = "declaration-process-panel";
const WOMEN = "Rémunération annuelle — Nombre de femmes";
const LOCK_TITLE = "Déclaration en cours de modification";
const LOCK_TIMEOUT_MINUTES = 45;
const LOCK_DELAY_TEXT = `au plus tard ${LOCK_TIMEOUT_MINUTES} minutes après qu'elle aura quitté la déclaration`;

test.describe("Declaration editing lock", () => {
	test.describe.configure({ mode: "serial" });
	test.setTimeout(90_000);
	let year: number;

	test.beforeEach(async () => {
		year = await getCurrentDbYear();
		await ensureCurrentYearDeclaration(year);
		await clearDeclarationLockFixture(year);
		await resetDeclarationToDraft();
	});

	test.afterEach(async () => {
		try {
			await clearDeclarationLockFixture(year);
		} finally {
			await resetDeclarationToDraft();
		}
	});

	test("acquires a free lock and lets the declarant edit", async ({ page }) => {
		await page.goto(STEP_1);
		const input = page.getByRole("textbox", { name: WOMEN });
		await expect(input).toBeEnabled();
		await expect(
			page.getByText("Déclaration en cours de modification"),
		).toHaveCount(0);
		await expect.poll(() => readDeclarationLockOwner(year)).not.toBeNull();
		await input.fill("10");
		await expect(input).toHaveValue("10");
	});

	test("shows the other declarant and blocks editing on both surfaces", async ({
		page,
	}) => {
		await seedReadableWorkforce(year);
		await seedOtherDeclarantLock(year, {
			timeoutMinutes: LOCK_TIMEOUT_MINUTES,
		});
		await page.goto(MY_SPACE);
		await waitForDsfrModal(page, PANEL_ID);
		await clickAndExpectDialogOpen(
			page,
			page.getByRole("button", { name: "Rémunération" }).first(),
			PANEL_ID,
		);
		const panel = page.locator(`#${PANEL_ID}`);
		const panelAlert = panel.getByRole("alert");
		await expect(panelAlert).toContainText(OTHER_LOCK_HOLDER_NAME);
		await expect(panelAlert).toContainText(LOCK_DELAY_TEXT);
		await expect(panelAlert).toContainText(
			"Ouvrez la déclaration pour être prévenu dès qu'elle sera libérée.",
		);
		const readOnlyLink = panel.getByRole("link", {
			name: /Consulter en lecture seule/,
		});
		await expect(readOnlyLink).toBeVisible();
		await readOnlyLink.click();
		await expect(page).toHaveURL(new RegExp(`${STEP_1}$`));
		const stepAlert = page.getByRole("alert").filter({ hasText: LOCK_TITLE });
		await expect(stepAlert).toContainText(OTHER_LOCK_HOLDER_NAME);
		await expect(stepAlert).toContainText(LOCK_DELAY_TEXT);
		await expect(stepAlert).toContainText(
			"Cette page vérifie automatiquement si la déclaration se libère",
		);
		const input = page.getByRole("textbox", { name: WOMEN });
		await expect(input).toHaveValue("10");
		await expect(input).toHaveAttribute("readonly", "");
		await expect(page.getByRole("button", { name: "Suivant" })).toHaveCount(0);
		await expect(page.getByRole("link", { name: "Suivant" })).toHaveAttribute(
			"href",
			remunerationStepHref(2),
		);
		await expect
			.poll(() => readDeclarationLockOwner(year))
			.toBe(OTHER_LOCK_HOLDER_ID);
	});

	test("offers to resume editing with fresh data once the other declarant leaves", async ({
		page,
	}) => {
		await seedReadableWorkforce(year);
		await seedOtherDeclarantLock(year);
		await page.goto(STEP_1);
		const input = page.getByRole("textbox", { name: WOMEN });
		await expect(input).toHaveAttribute("readonly", "");
		await expect(input).toHaveValue("10");
		const retakeButton = page.getByRole("button", {
			name: "Modifier la déclaration",
		});
		await expect(retakeButton).toHaveCount(0);

		await seedReadableWorkforce(year, 12);
		await releaseDeclarationLock(year);

		const status = page.getByRole("status").filter({
			hasText: "La déclaration n'est plus en cours de modification.",
		});
		// Availability is polled every LOCK_HEARTBEAT_INTERVAL_MS (10 s).
		await expect(status).toBeVisible({ timeout: 25_000 });
		await expect(input).toHaveAttribute("readonly", "");
		await expect(input).toHaveValue("10");
		await retakeButton.click();

		await expect(
			page.getByText("Vous pouvez maintenant modifier la déclaration."),
		).toBeVisible();
		await expect(retakeButton).toHaveCount(0);
		await expect(page.getByText(LOCK_TITLE)).toHaveCount(0);
		const freshInput = page.getByRole("textbox", { name: WOMEN });
		await expect(freshInput).not.toHaveAttribute("readonly", "");
		await expect(freshInput).toHaveValue("12");
		await expect.poll(() => readDeclarationLockOwner(year)).not.toBeNull();
		await expect
			.poll(() => readDeclarationLockOwner(year))
			.not.toBe(OTHER_LOCK_HOLDER_ID);
		await freshInput.fill("13");
		await expect(freshInput).toHaveValue("13");
	});

	test("releases the lock when the owning page closes and reacquires it", async ({
		context,
		page,
	}) => {
		await page.goto(STEP_1);
		await expect(page.getByRole("textbox", { name: WOMEN })).toBeEnabled();
		await expect.poll(() => readDeclarationLockOwner(year)).not.toBeNull();
		const owner = await readDeclarationLockOwner(year);
		await page.close();
		await expect.poll(() => readDeclarationLockOwner(year)).toBeNull();
		const reopened = await context.newPage();
		try {
			await reopened.goto(STEP_1);
			await expect(
				reopened.getByRole("textbox", { name: WOMEN }),
			).toBeEnabled();
			await expect.poll(() => readDeclarationLockOwner(year)).toBe(owner);
		} finally {
			await reopened.close();
		}
	});

	test("takes over an expired lock without entering read-only mode", async ({
		page,
	}) => {
		await seedOtherDeclarantLock(year, { expired: true });
		await page.goto(STEP_1);
		await expect(page.getByRole("textbox", { name: WOMEN })).toBeEnabled();
		await expect(
			page.getByText("Déclaration en cours de modification"),
		).toHaveCount(0);
		await expect
			.poll(() => readDeclarationLockOwner(year))
			.not.toBe(OTHER_LOCK_HOLDER_ID);
	});
});
