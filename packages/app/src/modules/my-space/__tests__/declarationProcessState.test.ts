import { describe, expect, it } from "vitest";

import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import {
	DECLARATION_REMUNERATION,
	DECLARATION_REPRESENTATION,
	LAST_REPRESENTATION_STEP,
	representationStepHref,
} from "~/modules/routes";
import {
	computeCtaHref,
	computePanelVariant,
	computeRepresentationCtaHref,
	computeRepresentationPanelVariant,
	isRepresentationDeclarationTransmitted,
} from "../declarationProcessState";
import type { DeclarationItem } from "../types";

const SIREN = "532847196";
const RECAP_HREF = representationStepHref(LAST_REPRESENTATION_STEP);
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
		expect(computeCtaHref(undefined)).toBe(DECLARATION_REMUNERATION);
	});

	it("returns declaration URL when fsmStatus is null", () => {
		expect(computeCtaHref(makeDeclaration({ fsmStatus: null }))).toBe(
			DECLARATION_REMUNERATION,
		);
	});

	// Per-status destinations live in fsmMirrors.conformance.test.ts. What
	// is pinned here is an absence: the mirror used to append `?siren=` on every
	// branch and no page ever read it, so the query must not creep back in
	// one status at a time.
	it("emits a bare path for every status — the pages read the SIREN from the session", () => {
		for (const fsmStatus of DECLARATION_FSM_STATUSES) {
			expect(computeCtaHref(makeDeclaration({ fsmStatus }))).not.toContain("?");
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

// A not-subject row is reset to step 0 yet mapped "done": the flag settles it.
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
			DECLARATION_REPRESENTATION,
		);
	});

	it("sends a listed-but-unopened démarche to the funnel entry point", () => {
		expect(
			computeRepresentationCtaHref(makeRepresentation(), CAMPAIGN_OPEN),
		).toBe(DECLARATION_REPRESENTATION);
	});

	it("resumes a draft on the step it stopped at", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation({ status: "in_progress", currentStep: 3 }),
				CAMPAIGN_OPEN,
			),
		).toBe(representationStepHref(3));
	});

	it("resumes on the first step when an in-progress draft has no step yet", () => {
		expect(
			computeRepresentationCtaHref(
				makeRepresentation({ status: "in_progress", currentStep: 0 }),
				CAMPAIGN_OPEN,
			),
		).toBe(representationStepHref(1));
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
		).toBe(DECLARATION_REPRESENTATION);
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
});

describe("isRepresentationDeclarationTransmitted", () => {
	it("returns false when no démarche exists yet", () => {
		expect(isRepresentationDeclarationTransmitted(undefined)).toBe(false);
	});

	it("returns false for a démarche that is only listed, never opened", () => {
		expect(isRepresentationDeclarationTransmitted(makeRepresentation())).toBe(
			false,
		);
	});

	it("returns false for a démarche in progress", () => {
		expect(
			isRepresentationDeclarationTransmitted(
				makeRepresentation({ status: "in_progress", currentStep: 3 }),
			),
		).toBe(false);
	});

	it("returns true once the démarche is transmitted", () => {
		expect(
			isRepresentationDeclarationTransmitted(
				makeRepresentation({ status: "done", currentStep: 5 }),
			),
		).toBe(true);
	});

	// A not-subject row is reset to step 0 yet mapped "done" (see NOT_SUBJECT
	// above) — `status === "done"` alone would wrongly read it as transmitted.
	it('returns false — not true — for a settled non-subject démarche despite status "done"', () => {
		expect(
			isRepresentationDeclarationTransmitted(makeRepresentation(NOT_SUBJECT)),
		).toBe(false);
	});
});
