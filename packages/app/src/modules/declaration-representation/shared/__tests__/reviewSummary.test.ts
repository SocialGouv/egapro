import { describe, expect, it } from "vitest";

import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	NON_COMPLIANT_EXECUTIVES,
	NON_COMPLIANT_MEMBERS,
	OFFLINE_PUBLICATION,
	REPRESENTATION_CAMPAIGN_YEAR,
	REPRESENTATION_YEAR,
	SINGLE_EXECUTIVE,
	VALID_REFERENCE_PERIOD,
	WEBSITE_PUBLICATION,
} from "~/modules/declaration-representation/__tests__/fixtures";
import { submitRepresentationSchema } from "~/modules/declaration-representation/schemas";
import type { RepresentationDraft } from "~/modules/declaration-representation/types";
import { REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR } from "~/modules/domain";
import type {
	RepresentationIndicatorKey,
	RepresentationIndicatorSummary,
} from "../reviewSummary";
import {
	buildRepresentationSubmitPayload,
	describeNonCompliance,
	EXECUTIVES_TITLE,
	formatRepresentationPercent,
	isPublicationApplicable,
	MEMBERS_TITLE,
	summarizeRepresentationReview,
} from "../reviewSummary";

const REVIEW_STEP = 5;

function draftOf(values: Partial<RepresentationDraft>): RepresentationDraft {
	return { currentStep: REVIEW_STEP, ...VALID_REFERENCE_PERIOD, ...values };
}

function summarize(
	values: Partial<RepresentationDraft>,
	campaignYear = REPRESENTATION_CAMPAIGN_YEAR,
) {
	return summarizeRepresentationReview(draftOf(values), campaignYear);
}

function indicatorOf(
	values: Partial<RepresentationDraft>,
	key: RepresentationIndicatorKey,
): RepresentationIndicatorSummary {
	const indicator = summarize(values).indicators.find(
		(candidate) => candidate.key === key,
	);
	if (indicator === undefined) throw new Error(`Missing indicator ${key}.`);
	return indicator;
}

function parsePayload(values: Partial<RepresentationDraft>) {
	return submitRepresentationSchema(REPRESENTATION_YEAR).safeParse(
		buildRepresentationSubmitPayload(draftOf(values)),
	);
}

const BOTH_COMPUTABLE = { ...COMPUTABLE_EXECUTIVES, ...COMPUTABLE_MEMBERS };

describe("summarizeRepresentationReview — indicators", () => {
	it("lists the two indicators in funnel order", () => {
		const summary = summarize(BOTH_COMPUTABLE);

		expect(summary.indicators.map((indicator) => indicator.key)).toEqual([
			"executives",
			"members",
		]);
		expect(summary.indicators.map((indicator) => indicator.title)).toEqual([
			EXECUTIVES_TITLE,
			MEMBERS_TITLE,
		]);
	});

	it("restitutes the computable executives gap", () => {
		expect(indicatorOf(BOTH_COMPUTABLE, "executives")).toMatchObject({
			menPercent: COMPUTABLE_EXECUTIVES.executiveMenPercent,
			notComputableReason: null,
			verdict: "compliant",
			womenPercent: COMPUTABLE_EXECUTIVES.executiveWomenPercent,
		});
	});

	it("restitutes the computable members gap", () => {
		expect(indicatorOf(BOTH_COMPUTABLE, "members")).toMatchObject({
			menPercent: COMPUTABLE_MEMBERS.memberMenPercent,
			notComputableReason: null,
			verdict: "compliant",
			womenPercent: COMPUTABLE_MEMBERS.memberWomenPercent,
		});
	});

	it.each([
		[NO_EXECUTIVES, "Aucun cadre dirigeant"],
		[SINGLE_EXECUTIVE, "Un cadre dirigeant"],
	])("labels the executives non-computability reason", (executives, label) => {
		expect(indicatorOf({ ...executives }, "executives")).toMatchObject({
			menPercent: undefined,
			notComputableReason: label,
			verdict: "not_applicable",
			womenPercent: undefined,
		});
	});

	it("labels the missing management body as the members reason", () => {
		expect(indicatorOf({ ...NO_MANAGEMENT_BODY }, "members")).toMatchObject({
			menPercent: undefined,
			notComputableReason: "Aucune instance dirigeante",
			verdict: "not_applicable",
			womenPercent: undefined,
		});
	});

	it.each([
		"executives",
		"members",
	] as const)("carries no reason while the %s answer is missing", (key) => {
		expect(indicatorOf({}, key)).toMatchObject({
			notComputableReason: null,
			verdict: "not_applicable",
		});
	});

	it("drops percentages left over from a gap turned non-computable", () => {
		const stale = {
			...NO_EXECUTIVES,
			executiveWomenPercent: COMPUTABLE_EXECUTIVES.executiveWomenPercent,
			executiveMenPercent: COMPUTABLE_EXECUTIVES.executiveMenPercent,
			...NO_MANAGEMENT_BODY,
			memberWomenPercent: COMPUTABLE_MEMBERS.memberWomenPercent,
			memberMenPercent: COMPUTABLE_MEMBERS.memberMenPercent,
		};

		for (const indicator of summarize(stale).indicators) {
			expect(indicator.womenPercent).toBeUndefined();
			expect(indicator.menPercent).toBeUndefined();
		}
	});

	it.each([
		["executives", { executivesCount: "two_or_more" }],
		["members", { hasManagementBody: true }],
	] as const)("stays not applicable while the %s percentages are unfilled", (key, values) => {
		expect(indicatorOf(values, key)).toMatchObject({
			notComputableReason: null,
			verdict: "not_applicable",
		});
	});

	it("keeps the two verdicts independent (S16)", () => {
		const summary = summarize({
			...COMPUTABLE_EXECUTIVES,
			...NON_COMPLIANT_MEMBERS,
		});

		expect(summary.indicators.map((indicator) => indicator.verdict)).toEqual([
			"compliant",
			"non_compliant",
		]);
		expect(
			summary.nonCompliantIndicators.map((indicator) => indicator.key),
		).toEqual(["members"]);
	});

	it("raises the target on the campaign year that tightens the rule", () => {
		const nearMiss = {
			executivesCount: "two_or_more",
			executiveWomenPercent: 35,
			executiveMenPercent: 65,
		} as const;

		expect(indicatorOf(nearMiss, "executives").verdict).toBe("compliant");
		expect(
			summarizeRepresentationReview(
				draftOf(nearMiss),
				REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
			).indicators[0]?.verdict,
		).toBe("non_compliant");
	});
});

describe("summarizeRepresentationReview — submit variant", () => {
	it.each([
		["two_gaps", { ...NON_COMPLIANT_EXECUTIVES, ...NON_COMPLIANT_MEMBERS }],
		["one_gap", { ...COMPUTABLE_EXECUTIVES, ...NON_COMPLIANT_MEMBERS }],
		["one_gap", { ...NON_COMPLIANT_EXECUTIVES, ...NO_MANAGEMENT_BODY }],
		["compliant", BOTH_COMPUTABLE],
		["compliant", { ...NO_EXECUTIVES, ...COMPUTABLE_MEMBERS }],
		["not_computable", { ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY }],
		["not_computable", {}],
	])("picks the %s modal variant", (variant, values) => {
		expect(summarize(values).submitVariant).toBe(variant);
	});
});

describe("isPublicationApplicable", () => {
	it.each([
		[BOTH_COMPUTABLE, true],
		[{ ...COMPUTABLE_EXECUTIVES, ...NO_MANAGEMENT_BODY }, true],
		[{ ...NO_EXECUTIVES, ...COMPUTABLE_MEMBERS }, true],
		[{ ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY }, false],
		[{ ...SINGLE_EXECUTIVE, ...NO_MANAGEMENT_BODY }, false],
		[{ ...NO_EXECUTIVES }, false],
		[{ ...NO_MANAGEMENT_BODY }, false],
	])("answers %o with %s", (values, expected) => {
		expect(isPublicationApplicable(draftOf(values))).toBe(expected);
		expect(summarize(values).publicationApplicable).toBe(expected);
	});
});

describe("describeNonCompliance", () => {
	function nonCompliantOf(values: Partial<RepresentationDraft>) {
		return describeNonCompliance(summarize(values).nonCompliantIndicators);
	}

	it("says nothing while every computable gap is compliant", () => {
		expect(nonCompliantOf(BOTH_COMPUTABLE)).toBeNull();
	});

	it("names the single failing indicator in the singular", () => {
		expect(
			nonCompliantOf({ ...NON_COMPLIANT_EXECUTIVES, ...COMPUTABLE_MEMBERS }),
		).toBe(
			"Vous n'êtes pas conforme concernant l'écart relatif aux cadres dirigeants.",
		);
		expect(
			nonCompliantOf({ ...COMPUTABLE_EXECUTIVES, ...NON_COMPLIANT_MEMBERS }),
		).toBe(
			"Vous n'êtes pas conforme concernant l'écart relatif aux membres des instances dirigeantes.",
		);
	});

	it("joins both failing indicators in the plural", () => {
		expect(
			nonCompliantOf({ ...NON_COMPLIANT_EXECUTIVES, ...NON_COMPLIANT_MEMBERS }),
		).toBe(
			"Vous n'êtes pas conforme concernant les écarts relatifs aux cadres dirigeants et aux membres des instances dirigeantes.",
		);
	});
});

describe("formatRepresentationPercent", () => {
	it.each([
		[undefined, "—"],
		[0, "0 %"],
		[60, "60 %"],
		[60.5, "60,5 %"],
		[33.333, "33,3 %"],
		[100, "100 %"],
	])("formats %s as %s", (value, expected) => {
		expect(formatRepresentationPercent(value)).toBe(expected);
	});
});

describe("buildRepresentationSubmitPayload", () => {
	it("carries the reference period and both answers", () => {
		expect(
			buildRepresentationSubmitPayload(
				draftOf({ ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY }),
			),
		).toEqual({
			...VALID_REFERENCE_PERIOD,
			...NO_EXECUTIVES,
			...NO_MANAGEMENT_BODY,
		});
	});

	it("sends the percentages of the computable indicator only", () => {
		expect(
			buildRepresentationSubmitPayload(
				draftOf({
					...COMPUTABLE_EXECUTIVES,
					...NO_MANAGEMENT_BODY,
					memberWomenPercent: COMPUTABLE_MEMBERS.memberWomenPercent,
					memberMenPercent: COMPUTABLE_MEMBERS.memberMenPercent,
					...WEBSITE_PUBLICATION,
				}),
			),
		).toEqual({
			...VALID_REFERENCE_PERIOD,
			...COMPUTABLE_EXECUTIVES,
			...NO_MANAGEMENT_BODY,
			...WEBSITE_PUBLICATION,
		});
	});

	it("sends the communication modalities when there is no website", () => {
		const payload = buildRepresentationSubmitPayload(
			draftOf({
				...BOTH_COMPUTABLE,
				...OFFLINE_PUBLICATION,
				publishUrl: WEBSITE_PUBLICATION.publishUrl,
			}),
		);

		expect(payload).toMatchObject(OFFLINE_PUBLICATION);
		expect(payload).not.toHaveProperty("publishUrl");
	});

	it("sends neither channel detail while the website answer is missing", () => {
		const payload = buildRepresentationSubmitPayload(
			draftOf({
				...BOTH_COMPUTABLE,
				publishDate: WEBSITE_PUBLICATION.publishDate,
			}),
		);

		expect(payload).not.toHaveProperty("publishUrl");
		expect(payload).not.toHaveProperty("publishModalities");
		expect(payload.publishDate).toBe(WEBSITE_PUBLICATION.publishDate);
	});

	it("strips the stale publication keys when no gap is computable (S12)", () => {
		const payload = buildRepresentationSubmitPayload(
			draftOf({
				...NO_EXECUTIVES,
				...NO_MANAGEMENT_BODY,
				...WEBSITE_PUBLICATION,
				publishModalities: OFFLINE_PUBLICATION.publishModalities,
			}),
		);

		expect(payload).not.toHaveProperty("publishDate");
		expect(payload).not.toHaveProperty("hasWebsite");
		expect(payload).not.toHaveProperty("publishUrl");
		expect(payload).not.toHaveProperty("publishModalities");
	});

	it.each([
		["a website publication", { ...BOTH_COMPUTABLE, ...WEBSITE_PUBLICATION }],
		["an offline publication", { ...BOTH_COMPUTABLE, ...OFFLINE_PUBLICATION }],
		[
			"a single computable gap",
			{
				...COMPUTABLE_EXECUTIVES,
				...NO_MANAGEMENT_BODY,
				...WEBSITE_PUBLICATION,
			},
		],
		["no computable gap at all", { ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY }],
		[
			"no computable gap and a stale publication",
			{ ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY, ...WEBSITE_PUBLICATION },
		],
	])("builds a payload the submit schema accepts with %s", (_label, values) => {
		expect(parsePayload(values).success).toBe(true);
	});

	it("lets the submit schema reject an incomplete draft", () => {
		expect(parsePayload({ ...COMPUTABLE_EXECUTIVES }).success).toBe(false);
	});
});
