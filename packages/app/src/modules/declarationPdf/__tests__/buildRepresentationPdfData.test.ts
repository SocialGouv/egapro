import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	rows: [] as unknown[][],
	selectCalls: 0,
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

import {
	buildRepresentationPdfData,
	RepresentationDeclarationNotFoundError,
} from "../buildRepresentationPdfData";

const SIREN = "123456789";
const YEAR = 2025;
const CAMPAIGN_YEAR = YEAR + 1;
const NOW = new Date("2026-06-15T09:30:00.000Z");
const SUBMITTED_AT = new Date("2026-03-10T08:00:00.000Z");

const COMPANY = { name: "Société Représentation" };

const SUBMITTED_DECLARATION = {
	status: "submitted",
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
) {
	// The builder fires both selects in a single Promise.all: company first.
	mocks.rows = [company ? [company] : [], declaration ? [declaration] : []];
	mocks.selectCalls = 0;
}

function build() {
	return buildRepresentationPdfData(SIREN, YEAR, NOW);
}

describe("buildRepresentationPdfData", () => {
	beforeEach(() => {
		stubDb(SUBMITTED_DECLARATION);
	});

	it("assembles the last transmitted declaration of the reference year (S20)", async () => {
		const data = await build();

		expect(data).toMatchObject({
			companyName: "Société Représentation",
			siren: SIREN,
			year: YEAR,
			campaignYear: CAMPAIGN_YEAR,
			referencePeriodStart: "2025-01-01",
			referencePeriodEnd: "2025-12-31",
			submittedAt: SUBMITTED_AT,
			generatedAt: NOW,
		});
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
			publishDate: null,
			publishUrl: null,
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
			companyName: `Entreprise ${SIREN}`,
		});
	});

	it("refuses to build a recap for a declaration that was never transmitted", async () => {
		stubDb({ ...SUBMITTED_DECLARATION, status: "draft", submittedAt: null });

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
