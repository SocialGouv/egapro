import { expect, test } from "@playwright/test";
import { urlGlob } from "~/e2e/helpers/routes";
import { COMPLIANCE_PATH } from "~/modules/routes";
import {
	resetDeclarationToDraft,
	setCompanyHasCse,
	setCompanyWorkforce,
} from "./helpers/db";
import {
	completeDeclaration,
	reachStep6ComplianceRecap,
} from "./helpers/declaration-flows";
import { expectRecapNextSteps } from "./helpers/next-steps";

/**
 * [#3945] CSE opinion mentions gated by the declared CSE existence.
 *
 * A company >= 100 that declared it has no CSE (hasCse false or null) must no longer
 * be told to deposit a CSE opinion: the recap end-of-page box and the
 * compliance-choice options drop every CSE-opinion mention, while the gap actions
 * and the "Mettre à jour l'existence d'un CSE" escape hatch stay.
 *
 * Only the `false` branch is reachable end to end. Since #3952 the funnel layout
 * intercepts a >= 100 company whose CSE answer is still null and sends it back to
 * /mon-espace to answer, so no journey reaches the recap in that state — that bounce
 * is asserted in missing-info-modal.e2e.ts, and the recap's own null-like-false
 * rendering by Step6Review.test.tsx ("CSE consultation section gating (issue #3945)").
 *
 * Extracted from `compliance.e2e.ts` (#4114): its own fixture axis
 * (workforce 200 + an explicit hasCse branch), independent of the fiches.
 */

const CSE_OPINION_RECAP_TEXT = /avis du CSE devra être transmis/;
const CSE_JUSTIFY_PARENTHESIS =
	/avis à transmettre lors de la dernière étape de la démarche/;
const UPDATE_CSE_BUTTON = /Mettre à jour l.existence d.un CSE/;
const CORRECTIVE_CSE_OPINION_BULLET = "Déposer le ou les avis du CSE";

test.describe("[#3945] gap + workforce >= 100 + hasCse=false → no CSE opinion mention", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(false);
		await setCompanyWorkforce(200);
	});

	test("step 6 recap hides the CSE opinion but keeps the gap actions and the update-CSE button", async ({
		page,
	}) => {
		test.slow();
		await reachStep6ComplianceRecap(page);

		// The CSE block keeps only its button; the gap compliance block stays whole.
		await expectRecapNextSteps(page, ["gap-compliance-process"]);
		await expect(page.getByText(CSE_OPINION_RECAP_TEXT)).toHaveCount(0);
		await expect(
			page.getByRole("link", { name: /Voir les modèles d.avis CSE/ }),
		).toHaveCount(0);
		await expect(page.getByText(CSE_JUSTIFY_PARENTHESIS)).toHaveCount(0);
		// Escape hatch for a mis-declared CSE flag stays available
		await expect(
			page.getByRole("button", { name: UPDATE_CSE_BUTTON }),
		).toBeVisible();
	});

	test("compliance choice page drops the CSE opinion bullets", async ({
		page,
	}) => {
		test.slow();
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });

		await expect(
			page.getByText("Justifier les écarts de rémunération ≥ 5 %", {
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByText("Transmettre l'avis du CSE", { exact: true }),
		).toHaveCount(0);
		await expect(page.getByText(CORRECTIVE_CSE_OPINION_BULLET)).toHaveCount(0);
	});
});

test.describe("[#3945] gap + workforce >= 100 + hasCse=true → CSE opinion still shown", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		await resetDeclarationToDraft();
		await setCompanyHasCse(true);
		await setCompanyWorkforce(200);
	});

	test("step 6 recap shows the CSE opinion mention", async ({ page }) => {
		test.slow();
		await reachStep6ComplianceRecap(page);

		await expectRecapNextSteps(page, [
			"cse-inform-and-consult",
			"gap-compliance-process",
		]);
		await expect(page.getByText(CSE_OPINION_RECAP_TEXT)).toBeVisible();
		await expect(
			page.getByText(/informer et consulter le CSE sur cette justification/),
		).toBeVisible();
		await expect(
			page.getByText(
				"Effectuer des actions correctives et une seconde déclaration dans un délai de 6 mois",
				{ exact: true },
			),
		).toBeVisible();
		await expect(
			page.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
				{ exact: true },
			),
		).toBeVisible();
	});

	test("compliance choice page keeps the CSE opinion bullet", async ({
		page,
	}) => {
		test.slow();
		await completeDeclaration(page, { hasGap: true });
		await page.waitForURL(urlGlob(COMPLIANCE_PATH), { timeout: 10_000 });

		await expect(
			page.getByText("Transmettre l'avis du CSE", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText(CORRECTIVE_CSE_OPINION_BULLET, { exact: true }),
		).toBeVisible();
	});
});
