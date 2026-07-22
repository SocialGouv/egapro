import { describe, expect, it } from "vitest";

import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import {
	computeCtaHref,
	computePanelVariant,
} from "../declarationProcessState";
import type { DeclarationItem } from "../types";

const SIREN = "532847196";

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
