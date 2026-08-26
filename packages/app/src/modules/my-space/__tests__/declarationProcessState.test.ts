import { describe, expect, it } from "vitest";

import {
	REPRESENTATION_FUNNEL_ROOT,
	stepHref,
	TOTAL_REPRESENTATION_STEPS,
} from "~/modules/declaration-representation";
import {
	REPRESENTATION_FUNNEL_ROOT as FUNNEL_ROOT_FROM_SUBMODULE,
	stepHref as stepHrefFromSubmodule,
} from "~/modules/declaration-representation/steps";
import { TOTAL_REPRESENTATION_STEPS as TOTAL_STEPS_FROM_SUBMODULE } from "~/modules/declaration-representation/types";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import {
	computeCtaHref,
	computePanelVariant,
	computeRepresentationCtaHref,
	computeRepresentationPanelVariant,
} from "../declarationProcessState";
import type { DeclarationItem } from "../types";

const SIREN = "532847196";
const RECAP_HREF = stepHref(TOTAL_REPRESENTATION_STEPS);
const CAMPAIGN_OPEN = true;
const CAMPAIGN_CLOSED = false;

function makeDeclaration(
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return {
		type: "remuneration",
		siren: SIREN,
		year: 2026,
		status: "done",
		fsmStatus: "draft",
		currentStep: 6,
		updatedAt: new Date(),
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,

		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
		notSubject: false,
		...overrides,
	};
}

describe("computePanelVariant", () => {
	it('returns "start" when declaration is undefined', () => {
		expect(computePanelVariant(undefined)).toBe("start");
	});

	it('returns "start" when fsmStatus is null', () => {
		expect(computePanelVariant(makeDeclaration({ fsmStatus: null }))).toBe(
			"start",
		);
	});

	// Per-status variants live in fsmMirrors.conformance.test.ts (#3975);
	// only the inputs outside the FSM vocabulary (undefined / null) are owned here.
});

describe("computeCtaHref", () => {
	it("returns declaration URL when no declaration", () => {
		expect(computeCtaHref(undefined, SIREN)).toBe(
			`/declaration-remuneration?siren=${SIREN}`,
		);
	});

	it("returns declaration URL when fsmStatus is null", () => {
		expect(computeCtaHref(makeDeclaration({ fsmStatus: null }), SIREN)).toBe(
			`/declaration-remuneration?siren=${SIREN}`,
		);
	});

	// Per-status destinations live in fsmMirrors.conformance.test.ts (#3975), which
	// strips the query — the company-scoping contract is pinned here, across every
	// branch since the implementation repeats the siren template per status.
	it("keeps every destination scoped to the company via the siren query parameter", () => {
		for (const fsmStatus of DECLARATION_FSM_STATUSES) {
			expect(computeCtaHref(makeDeclaration({ fsmStatus }), SIREN)).toContain(
				`?siren=${SIREN}`,
			);
		}
	});
});

function makeRepresentation(
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return makeDeclaration({
		type: "representation",
		fsmStatus: null,
		status: "to_complete",
		currentStep: 0,
		...overrides,
	});
}

// The funnel resets a not-subject row to step 0 while the router still maps it
// to "done": the discriminant, not the progression, settles the démarche.
const NOT_SUBJECT = {
	status: "done" as const,
	currentStep: 0,
	notSubject: true,
};

describe("computeRepresentationPanelVariant", () => {
	it('returns "start" when no démarche exists yet', () => {
		expect(computeRepresentationPanelVariant(undefined, CAMPAIGN_OPEN)).toBe(
			"start",
		);
	});

	it('returns "start" for a démarche that is only listed, never opened', () => {
		expect(
			computeRepresentationPanelVariant(makeRepresentation(), CAMPAIGN_OPEN),
		).toBe("start");
	});

	it('returns "draft" for a démarche in progress', () => {
		expect(
			computeRepresentationPanelVariant(
				makeRepresentation({ status: "in_progress", currentStep: 3 }),
				CAMPAIGN_OPEN,
			),
		).toBe("draft");
	});

	it('returns "submitted" once the démarche is transmitted', () => {
		expect(
			computeRepresentationPanelVariant(
				makeRepresentation({ status: "done", currentStep: 5 }),
				CAMPAIGN_OPEN,
			),
		).toBe("submitted");
	});

	it('returns "not_subject" — not "submitted" — for a settled non-subject démarche', () => {
		expect(
			computeRepresentationPanelVariant(
				makeRepresentation(NOT_SUBJECT),
				CAMPAIGN_OPEN,
			),
		).toBe("not_subject");
	});

	it('returns "closed" for a non-subject démarche once the campaign is closed', () => {
		expect(
			computeRepresentationPanelVariant(
				makeRepresentation(NOT_SUBJECT),
				CAMPAIGN_CLOSED,
			),
		).toBe("closed");
	});

	it('returns "closed" for every démarche state once the campaign is closed', () => {
		const declarations = [
			undefined,
			makeRepresentation(),
			makeRepresentation({ status: "in_progress", currentStep: 3 }),
			makeRepresentation({ status: "done", currentStep: 5 }),
		];
		for (const declaration of declarations) {
			expect(
				computeRepresentationPanelVariant(declaration, CAMPAIGN_CLOSED),
			).toBe("closed");
		}
	});
});

describe("computeRepresentationCtaHref", () => {
	it("sends a company with no démarche to the funnel entry point", () => {
		expect(computeRepresentationCtaHref(undefined, CAMPAIGN_OPEN)).toBe(
			REPRESENTATION_FUNNEL_ROOT,
		);
	});

	it("sends a listed-but-unopened démarche to the funnel entry point", () => {
		expect(
			computeRepresentationCtaHref(makeRepresentation(), CAMPAIGN_OPEN),
		).toBe(REPRESENTATION_FUNNEL_ROOT);
	});

	it("resumes a draft on the step it stopped at", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation({ status: "in_progress", currentStep: 3 }),
				CAMPAIGN_OPEN,
			),
		).toBe(stepHref(3));
	});

	it("resumes on the first step when an in-progress draft has no step yet", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation({ status: "in_progress", currentStep: 0 }),
				CAMPAIGN_OPEN,
			),
		).toBe(stepHref(1));
	});

	it("sends a transmitted démarche to its recap", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation({ status: "done", currentStep: 5 }),
				CAMPAIGN_OPEN,
			),
		).toBe(RECAP_HREF);
	});

	it("sends a non-subject démarche back to the funnel entry point, so it stays reversible", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation(NOT_SUBJECT),
				CAMPAIGN_OPEN,
			),
		).toBe(REPRESENTATION_FUNNEL_ROOT);
	});

	it("sends a non-subject démarche to the recap once the campaign is closed", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation(NOT_SUBJECT),
				CAMPAIGN_CLOSED,
			),
		).toBe(RECAP_HREF);
	});

	it("sends every démarche state to the recap once the campaign is closed", () => {
		const declarations = [
			undefined,
			makeRepresentation(),
			makeRepresentation({ status: "in_progress", currentStep: 3 }),
			makeRepresentation({ status: "done", currentStep: 5 }),
		];
		for (const declaration of declarations) {
			expect(computeRepresentationCtaHref(declaration, CAMPAIGN_CLOSED)).toBe(
				RECAP_HREF,
			);
		}
	});

	// The source imports the steps/types submodules, not the barrel, to keep the
	// declaration-remuneration tree out of this client bundle; the hrefs asserted
	// above come from the barrel, so both must stay the same values.
	it("reads the same funnel constants through the barrel and the submodules", () => {
		expect(REPRESENTATION_FUNNEL_ROOT).toBe(FUNNEL_ROOT_FROM_SUBMODULE);
		expect(TOTAL_REPRESENTATION_STEPS).toBe(TOTAL_STEPS_FROM_SUBMODULE);
		expect(stepHref).toBe(stepHrefFromSubmodule);
	});
});
