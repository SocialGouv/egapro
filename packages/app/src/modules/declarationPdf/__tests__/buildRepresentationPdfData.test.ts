import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	rows: [] as unknown[][],
	selectCalls: 0,
	workforceHistory: [] as { year: number; workforceEma: number }[],
}));

vi.mock("~/server/db", () => ({
	db: {
		select: () => {
			const index = mocks.selectCalls++;
			return {
				from: () => ({
					where: () => ({
						limit: () => Promise.resolve(mocks.rows[index] ?? []),
					}),
				}),
			};
		},
	},
}));

vi.mock("~/server/db/getRepresentationWorkforceHistory", () => ({
	getRepresentationWorkforceHistory: () =>
		Promise.resolve(mocks.workforceHistory),
}));

import {
	buildRepresentationPdfData,
	RepresentationDeclarationNotFoundError,
} from "../buildRepresentationPdfData";

const SIREN = "123456789";
const YEAR = 2025;
const CAMPAIGN_YEAR = YEAR + 1;
const NOW = new Date("2026-06-15T09:30:00.000Z");
const SUBMITTED_AT = new Date("2026-03-10T08:00:00.000Z");

const COMPANY = {
	name: "Société Représentation",
	nafCode: "62.02A",
	nafLabel: "Conseil en systèmes et logiciels informatiques",
	address: "12 rue des Innovateurs",
	countryCode: null,
	countryLabel: null,
	departmentLabel: "75011 Paris",
};

const DECLARANT = {
	firstName: "Marie",
	lastName: "Dupont",
	email: "marie.dupont@exemple.fr",
	phone: "06 01 02 03 04",
};

const SUBMITTED_DECLARATION = {
	status: "submitted",
	currentStep: 5,
	declarantId: "user-1",
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
	executiveWomenPercent: "60",
	executiveMenPercent: "40",
	notComputableReasonExecutives: null,
	memberWomenPercent: "55",
	memberMenPercent: "45",
	notComputableReasonMembers: null,
	publishDate: "2026-03-01",
	publishUrl: "https://exemple.fr/egalite-professionnelle",
	publishModalities: null,
	submittedAt: SUBMITTED_AT,
};

function stubDb(
	declaration: Record<string, unknown> | null,
	company: Record<string, unknown> | null = COMPANY,
	declarant: Record<string, unknown> | null = DECLARANT,
) {
	mocks.rows = [
		company ? [company] : [],
		declaration ? [declaration] : [],
		declarant ? [declarant] : [],
	];
	mocks.selectCalls = 0;
}

function build() {
	return buildRepresentationPdfData(SIREN, YEAR, NOW);
}

describe("buildRepresentationPdfData", () => {
	beforeEach(() => {
		mocks.workforceHistory = [{ year: CAMPAIGN_YEAR, workforceEma: 2256 }];
		stubDb(SUBMITTED_DECLARATION);
	});

	it("assembles the last transmitted declaration of the reference year (S20)", async () => {
		const data = await build();

		expect(data).toMatchObject({
			siren: SIREN,
			year: YEAR,
			campaignYear: CAMPAIGN_YEAR,
			referencePeriod: "01/01/2025 - 31/12/2025",
			submittedAt: SUBMITTED_AT,
			transmittedAt: "10/03/2026",
			generatedAt: NOW,
		});
	});

	it("marks an unfilled reference period boundary as not provided", async () => {
		stubDb({
			...SUBMITTED_DECLARATION,
			referencePeriodStart: null,
			referencePeriodEnd: null,
		});

		const data = await build();

		expect(data.referencePeriod).toBe("— - —");
	});

	it("reads the two indicators as percentages and grades them against the campaign target", async () => {
		const data = await build();

		expect(data.indicators).toEqual([
			{
				title: "Cadres dirigeants",
				notComputableReason: null,
				womenPercent: 60,
				menPercent: 40,
				verdict: "compliant",
			},
			{
				title: "Membres des instances dirigeantes",
				notComputableReason: null,
				womenPercent: 55,
				menPercent: 45,
				verdict: "compliant",
			},
		]);
	});

	it("grades an indicator below the target as non compliant", async () => {
		stubDb({
			...SUBMITTED_DECLARATION,
			executiveWomenPercent: "80",
			executiveMenPercent: "20",
		});

		const data = await build();

		expect(data.indicators[0]).toMatchObject({
			womenPercent: 80,
			menPercent: 20,
			verdict: "non_compliant",
		});
	});

	it.each([
		["aucun_cadre_dirigeant", "Aucun cadre dirigeant"],
		["un_seul_cadre_dirigeant", "Un cadre dirigeant"],
	])("spells out the %s motive on the executives indicator", async (reason, label) => {
		stubDb({
			...SUBMITTED_DECLARATION,
			executiveWomenPercent: null,
			executiveMenPercent: null,
			notComputableReasonExecutives: reason,
		});

		const data = await build();

		expect(data.indicators[0]).toMatchObject({
			notComputableReason: label,
			womenPercent: null,
			menPercent: null,
			verdict: "not_applicable",
		});
	});

	it("spells out the missing management body on the members indicator", async () => {
		stubDb({
			...SUBMITTED_DECLARATION,
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
		});

		const data = await build();

		expect(data.indicators[1]).toMatchObject({
			notComputableReason: "Aucune instance dirigeante",
			womenPercent: null,
			menPercent: null,
			verdict: "not_applicable",
		});
	});

	it("carries the website publication when one was declared", async () => {
		const data = await build();

		expect(data).toMatchObject({
			publicationApplicable: true,
			publishDate: "2026-03-01",
			hasWebsite: true,
			publishUrl: "https://exemple.fr/egalite-professionnelle",
			publishModalities: null,
		});
	});

	it("carries the offline modalities when no website was declared", async () => {
		stubDb({
			...SUBMITTED_DECLARATION,
			publishUrl: null,
			publishModalities: "Affichage dans les locaux.",
		});

		const data = await build();

		expect(data).toMatchObject({
			publicationApplicable: true,
			hasWebsite: false,
			publishUrl: null,
			publishModalities: "Affichage dans les locaux.",
		});
	});

	it("keeps the publication applicable when only the management body is computable", async () => {
		stubDb({
			...SUBMITTED_DECLARATION,
			executiveWomenPercent: null,
			executiveMenPercent: null,
			notComputableReasonExecutives: "aucun_cadre_dirigeant",
		});

		const data = await build();

		expect(data.publicationApplicable).toBe(true);
	});

	it("drops the publication when no gap is computable at all", async () => {
		stubDb({
			...SUBMITTED_DECLARATION,
			executiveWomenPercent: null,
			executiveMenPercent: null,
			notComputableReasonExecutives: "aucun_cadre_dirigeant",
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
			publishDate: null,
			publishUrl: null,
			publishModalities: null,
		});

		const data = await build();

		expect(data.publicationApplicable).toBe(false);
	});

	it("falls back on the siren when the company row is missing", async () => {
		stubDb(SUBMITTED_DECLARATION, null);

		await expect(build()).resolves.toMatchObject({
			company: { name: `Entreprise ${SIREN}` },
		});
	});

	it("builds the company block from the company row — location, NAF, siren and workforce", async () => {
		const data = await build();

		expect(data.company).toMatchObject({
			name: "Société Représentation",
			siren: "123 456 789",
			location: { label: "Adresse", value: "12 rue des Innovateurs" },
			naf: "62.02A - Conseil en systèmes et logiciels informatiques",
			workforceLabel: `Effectif annuel moyen en ${YEAR}`,
			workforceDisplay: "2 256",
		});
	});

	it("reads the declarant through the declaration's declarant id", async () => {
		const data = await build();

		expect(data.declarantRows).toEqual([
			{ label: "Nom Prénom", value: "Marie Dupont" },
			{ label: "Adresse email", value: "marie.dupont@exemple.fr" },
			{ label: "Numéro de téléphone", value: "06 01 02 03 04" },
		]);
	});

	it("leaves the declarant rows empty when the declaration has no declarant id", async () => {
		stubDb({ ...SUBMITTED_DECLARATION, declarantId: null }, COMPANY, null);

		const data = await build();

		expect(data.declarantRows).toEqual([]);
	});

	it("omits an unfilled declarant field instead of showing it empty", async () => {
		stubDb(SUBMITTED_DECLARATION, COMPANY, { ...DECLARANT, phone: null });

		const data = await build();

		expect(data.declarantRows).toEqual([
			{ label: "Nom Prénom", value: "Marie Dupont" },
			{ label: "Adresse email", value: "marie.dupont@exemple.fr" },
		]);
	});

	it("reads the workforce of the campaign year, not of the reference year", async () => {
		mocks.workforceHistory = [
			{ year: CAMPAIGN_YEAR - 1, workforceEma: 999 },
			{ year: CAMPAIGN_YEAR, workforceEma: 2256 },
		];

		const data = await build();

		expect(data.company.workforceDisplay).toBe("2 256");
	});

	it.each([
		"draft",
		"not_subject",
	])("refuses to build a recap for a %s declaration, which transmitted no gap", async (status) => {
		stubDb({ ...SUBMITTED_DECLARATION, status, submittedAt: null });

		await expect(build()).rejects.toBeInstanceOf(
			RepresentationDeclarationNotFoundError,
		);
	});

	it("refuses to build a recap when no declaration exists for the year", async () => {
		stubDb(null);

		await expect(build()).rejects.toBeInstanceOf(
			RepresentationDeclarationNotFoundError,
		);
	});
});
