import { expect, test } from "@playwright/test";
import { getReferenceYearFor } from "~/modules/domain";
import {
	adminDeclarationHref,
	CGU,
	mySpaceRepresentationHref,
	referentHref,
} from "~/modules/routes";
import { TEST_SIREN } from "../constants";
import {
	ensureCurrentYearDeclaration,
	getCurrentDbYear,
	getTestDeclarationId,
	resetRepresentationDeclaration,
	seedSubmittedRepresentationDeclaration,
} from "../helpers/db";
import { deleteReferents, seedReferents } from "../helpers/db-campaign";
import { snapshotCurrentPage, snapshotRoute } from "./snapshot";

// A fixed UUID: `publicReferents.getById` validates the id, and the sample declares this URL.
const SAMPLE_REFERENT = {
	id: "44444444-4444-4444-8444-444444444444",
	region: "11",
	county: "75",
	name: "Référent de démonstration",
	type: "email" as const,
	value: "referent@example.fr",
	principal: true,
	substituteName: "Suppléant de démonstration",
	substituteEmail: "suppleant@example.fr",
};

/**
 * The pages whose URL carries a dynamic segment.
 *
 * The sweep cannot visit them: their URL contains an id that only exists in the database. An
 * invented id would render a 404, and the sheet would describe the error page under a real
 * page's name — exactly what this tier exists to prevent. So each one seeds the record it
 * shows, or resolves its id from the application and skips itself when the data does not
 * exist in this environment. The URL `.ultra11yrc.json` declares for them is a description,
 * never a visit.
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

	test("snapshot la consultation d'une déclaration de représentation", async ({
		page,
	}) => {
		const campaignYear = await getCurrentDbYear();
		const referenceYear = getReferenceYearFor(campaignYear);
		await seedSubmittedRepresentationDeclaration(referenceYear);

		try {
			await snapshotRoute(page, {
				path: mySpaceRepresentationHref(campaignYear),
				id: "representation-consultation",
				name: "Consultation d'une déclaration de représentation",
				sources: [
					"src/app/mon-espace/representation/[year]/page.tsx",
					"src/modules/declaration-representation/RepresentationConsultation.tsx",
				],
				auth: true,
				notes: `Déclaration de représentation transmise par l'entreprise de test pour la campagne ${campaignYear}.`,
			});
		} finally {
			await resetRepresentationDeclaration();
		}
	});

	test("snapshot le détail d'une déclaration au backoffice", async ({
		page,
	}) => {
		// The test company's own declaration, never the first row listed: the observatory seeds
		// carry ids that are not UUIDs, which the detail query rejects as « introuvable ».
		const year = await getCurrentDbYear();
		await ensureCurrentYearDeclaration(year);
		const declarationId = await getTestDeclarationId(year);
		test.skip(
			declarationId === null,
			"aucune déclaration de l'entreprise de test — rien à échantillonner",
		);

		const detailHref = adminDeclarationHref(declarationId as string);
		// Client-rendered: « Chargement... » until the declaration arrives, then a second request
		// for the recap. A snapshot before both audits a loading message, not the page.
		const recapAnswered = page.waitForResponse((response) =>
			response.url().includes("adminDeclarations.getRecap"),
		);
		await page.goto(detailHref);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByText("Chargement...")).toHaveCount(0);
		await recapAnswered;

		await snapshotCurrentPage(page, {
			path: detailHref,
			id: "admin-declaration-detail",
			name: "Backoffice — détail d'une déclaration",
			sources: [
				"src/app/admin/declarations/[declarationId]/page.tsx",
				"src/modules/admin/declarations/AdminDeclarationDetailPage.tsx",
			],
			auth: true,
			notes:
				"Déclaration de l'entreprise de test, capturée une fois la déclaration et son récapitulatif chargés.",
		});
	});

	test("snapshot la fiche d'un référent", async ({ page }) => {
		await seedReferents([SAMPLE_REFERENT]);

		try {
			await snapshotRoute(page, {
				path: referentHref(SAMPLE_REFERENT.id),
				id: "referent-detail",
				name: "Fiche d'un référent",
				sources: [
					"src/app/referents/[id]/page.tsx",
					"src/modules/referents/PublicReferentDetail.tsx",
				],
				notes:
					"Référent publié avec un contact principal par e-mail et un suppléant.",
			});
		} finally {
			await deleteReferents([SAMPLE_REFERENT.id]);
		}
	});

	test("snapshot une version archivée des CGU", async ({ page }) => {
		await page.goto(CGU);
		await page.waitForLoadState("networkidle");

		// The version in force is never linked from its own history: its dated URL redirects to /cgu.
		const archived = page.locator('main a[href^="/cgu/"]');
		test.skip(
			(await archived.count()) === 0,
			"aucune version archivée des CGU — seule la version en vigueur existe, et son adresse datée redirige vers /cgu",
		);

		const archivedHref = await archived.first().getAttribute("href");
		await snapshotRoute(page, {
			path: archivedHref as string,
			id: "cgu-version",
			name: "Conditions générales d'utilisation — version archivée",
			sources: [
				"src/app/cgu/[version]/page.tsx",
				"src/modules/legal/TermsOfUsePage/index.tsx",
			],
			notes:
				"Version archivée la plus récente, listée dans l'historique des CGU.",
		});
	});
});
