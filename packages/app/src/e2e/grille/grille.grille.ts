import { test } from "@playwright/test";
import { withCampaignYear } from "../helpers/campaign-year";
import { setCompanyHasCse } from "../helpers/db";
import { buildGrid } from "./coordinates";
import { FICHE_SCENARIOS } from "./scenarios";

test.describe.configure({ mode: "serial" });

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
