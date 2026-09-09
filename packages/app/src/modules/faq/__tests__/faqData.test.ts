import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	GAP_ALERT_THRESHOLD,
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_BASE_YEAR,
	INDICATOR_G_TRIENNIAL_MIN,
	INDICATOR_G_UNIVERSAL_YEAR,
	MAX_CSE_FILES,
	QUARTILE_COUNT,
	QUARTILE_THRESHOLD_COUNT,
	REPRESENTATION_SUBJECTION_WINDOW_YEARS,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
	V2_FIRST_CAMPAIGN_YEAR,
} from "~/modules/domain";
import { MAX_FILE_SIZE_LABEL, MAX_FILENAME_LENGTH } from "~/modules/shared";
import { FAQ_SECTIONS } from "../faqData";

const ALL_ITEMS = FAQ_SECTIONS.flatMap((section) =>
	section.subsections.flatMap((subsection) =>
		subsection.items.map((item) => ({
			sectionId: section.id,
			...item,
		})),
	),
);

const ALL_TEXT = ALL_ITEMS.map(
	(item) => `${item.question} ${item.answer}`,
).join("\n");

// The FAQ is written with plain spaces; Intl groups thousands with a narrow
// no-break space, so the two have to be compared on the same footing.
const SUBJECTION_WORKFORCE_LABEL = String(
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function normalizeSpaces(text: string): string {
	return text.replace(/[  ]/g, " ");
}

function answersOf(sectionId: string): string {
	const section = FAQ_SECTIONS.find((candidate) => candidate.id === sectionId);
	if (!section) throw new Error(`No FAQ section with id "${sectionId}"`);
	return section.subsections
		.flatMap((subsection) =>
			subsection.items.map((item) => `${item.question} ${item.answer}`),
		)
		.join("\n");
}

describe("FAQ structure", () => {
	it("gives every section a non-empty anchor id", () => {
		for (const section of FAQ_SECTIONS) {
			expect(section.id.trim()).not.toBe("");
			expect(section.id).toMatch(/^[a-z0-9-]+$/);
		}
	});

	it("keeps every anchor id unique, since the summary links to them", () => {
		const ids = FAQ_SECTIONS.map((section) => section.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("gives every section and subsection a title", () => {
		for (const section of FAQ_SECTIONS) {
			expect(section.title.trim()).not.toBe("");
			expect(section.subsections.length).toBeGreaterThan(0);
			for (const subsection of section.subsections) {
				expect(subsection.title.trim()).not.toBe("");
				expect(subsection.items.length).toBeGreaterThan(0);
			}
		}
	});

	it("leaves no question or answer empty", () => {
		for (const item of ALL_ITEMS) {
			expect(item.question.trim()).not.toBe("");
			expect(item.answer.trim()).not.toBe("");
		}
	});

	it("ends every question with a question mark", () => {
		for (const item of ALL_ITEMS) {
			expect(item.question.trim().endsWith("?")).toBe(true);
		}
	});
});

describe("FAQ describes the scheme the application implements", () => {
	it.each([
		["une note globale sur 100", /sur 100 points|note sur 100|index global/i],
		["un barème de points", /\b\d+\s+points\b/i],
		["l'écart de taux d'augmentations", /taux d('|’)augmentation/i],
		["l'écart de taux de promotions", /taux de promotion/i],
		["le retour de congé maternité", /cong[ée] maternit/i],
		["les hautes rémunérations", /hautes r[ée]mun[ée]rations/i],
		["le seuil de pertinence", /seuil de pertinence/i],
		["la BDESE", /BDESE/i],
	])("never mentions %s, which the abrogated index carried", (_label, pattern) => {
		expect(ALL_TEXT).not.toMatch(pattern);
	});

	it("states the alert threshold the domain defines", () => {
		expect(answersOf("seuil-alerte")).toContain(`${GAP_ALERT_THRESHOLD} %`);
	});

	it("states the workforce tiers the domain defines", () => {
		const dispositif = answersOf("dispositif");

		expect(dispositif).toContain(`${COMPANY_SIZE_VOLUNTARY_MAX} salariés`);
		expect(dispositif).toContain(`${COMPANY_SIZE_ANNUAL_MIN} salariés`);
		expect(dispositif).toContain(String(V2_FIRST_CAMPAIGN_YEAR));
	});

	it("states the indicator G cadence the domain defines", () => {
		const indicatorG = answersOf("indicateur-g");

		expect(indicatorG).toContain(`${INDICATOR_G_ANNUAL_MIN} salariés`);
		expect(indicatorG).toContain(String(INDICATOR_G_TRIENNIAL_MIN));
		expect(indicatorG).toContain(String(INDICATOR_G_UNIVERSAL_YEAR));
		expect(indicatorG).toContain(String(INDICATOR_G_TRIENNIAL_BASE_YEAR));
	});

	it("states the upload limits the shared config defines", () => {
		const depot = answersOf("depot-documents");

		expect(depot).toContain(MAX_FILE_SIZE_LABEL);
		expect(depot).toContain(`${MAX_FILENAME_LENGTH} caractères`);
	});

	it("states the CSE threshold and file cap the domain defines", () => {
		const cse = answersOf("avis-cse");

		expect(cse).toContain(`${COMPANY_SIZE_ANNUAL_MIN} salariés`);
		expect(cse).toContain(`${MAX_CSE_FILES} fichiers`);
	});

	it("states the quartile counts the domain defines", () => {
		const quartiles = answersOf("quartiles");

		expect(quartiles).toContain(`${QUARTILE_COUNT} tranches`);
		expect(quartiles).toContain(`${QUARTILE_THRESHOLD_COUNT} seuils`);
	});

	// The band is parity ± the alert threshold, exactly as `quartile.ts` derives
	// QUARTILE_BALANCE_LOWER/UPPER — so it moves with GAP_ALERT_THRESHOLD.
	it("states the top-quartile parity band the domain derives", () => {
		const quartiles = answersOf("quartiles");

		expect(quartiles).toContain(`${GAP_ALERT_THRESHOLD} %`);
		expect(quartiles).toContain(`${50 - GAP_ALERT_THRESHOLD} %`);
		expect(quartiles).toContain(`${50 + GAP_ALERT_THRESHOLD} %`);
	});

	it("states the representation thresholds the domain defines", () => {
		const representation = answersOf("representation-equilibree");

		expect(normalizeSpaces(representation)).toContain(
			`${SUBJECTION_WORKFORCE_LABEL} salariés`,
		);
		expect(representation).toContain(
			`${REPRESENTATION_SUBJECTION_WINDOW_YEARS} derniers exercices`,
		);
		expect(representation).toContain(`${REPRESENTATION_TARGET_INITIAL} %`);
		expect(representation).toContain(`${REPRESENTATION_TARGET_RAISED} %`);
		expect(representation).toContain(
			String(REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR),
		);
	});
});

describe("FAQ states no deadline the campaign settings can move", () => {
	// Index deadlines live in `campaignDeadlines` and are set per campaign by the
	// DGT, so any fixed day-and-month written here is wrong the year it changes.
	// The representation declaration is the one exception: its deadline is fixed
	// in the domain itself (`getRepresentationDeadline`).
	const DAY_AND_MONTH =
		/\b(1(er|ᵉʳ)|\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i;

	it.each(
		FAQ_SECTIONS.filter(
			(section) => section.id !== "representation-equilibree",
		).map((section) => section.id),
	)("writes no fixed calendar date in the %s section", (sectionId) => {
		expect(answersOf(sectionId)).not.toMatch(DAY_AND_MONTH);
	});

	it("sends the reader to the campaign's own dates rather than naming them", () => {
		expect(answersOf("calendrier-modification")).toMatch(/Mon espace/);
	});
});
