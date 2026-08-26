import { describe, expect, it } from "vitest";

import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	OFFLINE_PUBLICATION,
	SINGLE_EXECUTIVE,
	VALID_REFERENCE_PERIOD,
	WEBSITE_PUBLICATION,
} from "~/modules/declaration-representation/__tests__/fixtures";
import type { RepresentationDeclarationSnapshot } from "../submittedDraft";
import { representationDraftFromDeclaration } from "../submittedDraft";

const STEP = 5;

function submitted(
	overrides: Partial<RepresentationDeclarationSnapshot> = {},
): RepresentationDeclarationSnapshot {
	return {
		status: "submitted",
		currentStep: STEP,
		draft: null,
		referencePeriodStart: VALID_REFERENCE_PERIOD.referencePeriodStart,
		referencePeriodEnd: VALID_REFERENCE_PERIOD.referencePeriodEnd,
		executiveWomenPercent: String(COMPUTABLE_EXECUTIVES.executiveWomenPercent),
		executiveMenPercent: String(COMPUTABLE_EXECUTIVES.executiveMenPercent),
		notComputableReasonExecutives: null,
		memberWomenPercent: String(COMPUTABLE_MEMBERS.memberWomenPercent),
		memberMenPercent: String(COMPUTABLE_MEMBERS.memberMenPercent),
		notComputableReasonMembers: null,
		publishDate: WEBSITE_PUBLICATION.publishDate,
		publishUrl: WEBSITE_PUBLICATION.publishUrl,
		publishModalities: null,
		...overrides,
	};
}

describe("representationDraftFromDeclaration", () => {
	it("returns an empty draft at the requested step when nothing is stored", () => {
		expect(representationDraftFromDeclaration(null, 2)).toEqual({
			currentStep: 2,
		});
	});

	it("keeps a valid in-progress draft as-is", () => {
		const draft = {
			currentStep: 3,
			...VALID_REFERENCE_PERIOD,
			...COMPUTABLE_EXECUTIVES,
		};
		expect(
			representationDraftFromDeclaration(
				{
					...submitted({ status: "draft", draft, currentStep: 3 }),
					executiveWomenPercent: null,
					executiveMenPercent: null,
				},
				3,
			),
		).toEqual(draft);
	});

	it("falls back when the stored draft cannot be parsed", () => {
		expect(
			representationDraftFromDeclaration(
				submitted({ status: "draft", draft: { currentStep: 99 } }),
				3,
			),
		).toEqual({ currentStep: 3 });
	});

	// Reopening after a not-subject choice must start blank, not from leftover columns.
	it("returns an empty draft for a declaration closed as not subject", () => {
		expect(
			representationDraftFromDeclaration(
				submitted({ status: "not_subject", draft: null, currentStep: 0 }),
				0,
			),
		).toEqual({ currentStep: 0 });
	});

	it("rebuilds the recap from submitted columns even when the JSON draft was cleared", () => {
		expect(representationDraftFromDeclaration(submitted(), STEP)).toEqual({
			currentStep: STEP,
			...VALID_REFERENCE_PERIOD,
			...COMPUTABLE_EXECUTIVES,
			...COMPUTABLE_MEMBERS,
			hasWebsite: true,
			publishDate: WEBSITE_PUBLICATION.publishDate,
			publishUrl: WEBSITE_PUBLICATION.publishUrl,
			publishModalities: undefined,
		});
	});

	it("prefers the submitted columns over a leftover JSON draft", () => {
		const leftover = { currentStep: 4, executiveWomenPercent: 1 };
		expect(
			representationDraftFromDeclaration(submitted({ draft: leftover }), STEP)
				.executiveWomenPercent,
		).toBe(COMPUTABLE_EXECUTIVES.executiveWomenPercent);
	});

	it("rebuilds a declaration without a website", () => {
		const draft = representationDraftFromDeclaration(
			submitted({
				publishUrl: null,
				publishModalities: OFFLINE_PUBLICATION.publishModalities,
			}),
			STEP,
		);

		expect(draft.hasWebsite).toBe(false);
		expect(draft.publishUrl).toBeUndefined();
		expect(draft.publishModalities).toBe(OFFLINE_PUBLICATION.publishModalities);
	});

	it("rebuilds non-computable executives and members", () => {
		const draft = representationDraftFromDeclaration(
			submitted({
				executiveWomenPercent: null,
				executiveMenPercent: null,
				notComputableReasonExecutives: "aucun_cadre_dirigeant",
				memberWomenPercent: null,
				memberMenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
				publishDate: null,
				publishUrl: null,
				publishModalities: null,
			}),
			STEP,
		);

		expect(draft).toMatchObject({
			executivesCount: NO_EXECUTIVES.executivesCount,
			hasManagementBody: NO_MANAGEMENT_BODY.hasManagementBody,
			executiveWomenPercent: undefined,
			memberWomenPercent: undefined,
			hasWebsite: undefined,
		});
	});

	it("rebuilds a single-executive declaration", () => {
		expect(
			representationDraftFromDeclaration(
				submitted({
					executiveWomenPercent: null,
					executiveMenPercent: null,
					notComputableReasonExecutives: "un_seul_cadre_dirigeant",
				}),
				STEP,
			).executivesCount,
		).toBe(SINGLE_EXECUTIVE.executivesCount);
	});

	it("parses numeric percents stored as decimals", () => {
		expect(
			representationDraftFromDeclaration(
				submitted({
					executiveWomenPercent: "20.40",
					executiveMenPercent: 79.6,
				}),
				STEP,
			),
		).toMatchObject({
			executiveWomenPercent: 20.4,
			executiveMenPercent: 79.6,
		});
	});
});
