import { test } from "@playwright/test";

import { TEST_SIREN } from "../constants";
import { getCurrentDbYear } from "../helpers/db";
import { snapshotCurrentPage, snapshotRoute } from "./snapshot";

/**
 * The pages whose URL carries a dynamic segment.
 *
 * They cannot be declared in the sample: their URL contains an id that only exists in the
 * database. An invented id would render a 404, and the sheet would describe the error page
 * under a real page's name — exactly what this tier exists to prevent. So each one resolves
 * its id from the application, and skips itself when the data does not exist in this
 * environment.
 */
test.describe("RGAA — pages à segment dynamique", () => {
	test("snapshot l'historique d'une déclaration", async ({ page }) => {
		const year = await getCurrentDbYear();

		await snapshotRoute(page, {
			path: `/mon-espace/historique/${TEST_SIREN}/${year}`,
			id: "historique-declaration",
			name: "Historique d'une déclaration",
			sources: ["src/app/mon-espace/historique/[siren]/[year]/page.tsx"],
			auth: true,
			notes: `Déclaration de l'entreprise de test pour l'année ${year}.`,
		});
	});

	test("snapshot le détail d'une déclaration au backoffice", async ({
		page,
	}) => {
		await page.goto("/admin/declarations");
		await page.waitForLoadState("networkidle");

		// `count()` resolves immediately on an empty match, where `getAttribute()` would
		// auto-wait for an element that never comes and burn the whole test timeout.
		const links = page.locator('a[href^="/admin/declarations/"]');
		test.skip(
			(await links.count()) === 0,
			"aucune déclaration listée au backoffice — rien à échantillonner",
		);

		const detailHref = await links.first().getAttribute("href");
		await page.goto(detailHref as string);
		await snapshotCurrentPage(page, {
			path: detailHref as string,
			id: "admin-declaration-detail",
			name: "Backoffice — détail d'une déclaration",
			sources: ["src/app/admin/declarations/[declarationId]/page.tsx"],
			auth: true,
			notes: "Première déclaration listée au backoffice.",
		});
	});

	test("snapshot la fiche d'un référent", async ({ page }) => {
		await page.goto("/referents");
		await page.waitForLoadState("networkidle");

		const links = page.locator('a[href^="/referents/"]');
		test.skip(
			(await links.count()) === 0,
			"aucun référent publié — rien à échantillonner",
		);

		const referentHref = await links.first().getAttribute("href");
		await page.goto(referentHref as string);
		await snapshotCurrentPage(page, {
			path: referentHref as string,
			id: "referent-detail",
			name: "Fiche d'un référent",
			sources: ["src/app/referents/[id]/page.tsx"],
			notes: "Premier référent listé.",
		});
	});
});
