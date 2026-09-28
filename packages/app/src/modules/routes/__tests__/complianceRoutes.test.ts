import { describe, expect, it } from "vitest";
import {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	COMPLIANCE_STEP_NUMBERS,
	CSE_OPINION,
	CSE_OPINION_CONFIRMATION,
	CSE_OPINION_STEP_NUMBERS,
	complianceStepHref,
	cseOpinionStepHref,
	toComplianceStep,
	toCseOpinionStep,
} from "../shared/complianceRoutes";

describe("parcours de mise en conformité", () => {
	it("spells the entry points", () => {
		expect(COMPLIANCE_PATH).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
		expect(COMPLIANCE_JOINT_EVALUATION).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
		expect(COMPLIANCE_CONFIRMATION).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("builds one href per step of the second declaration", () => {
		expect(COMPLIANCE_STEP_NUMBERS).toEqual([1, 2, 3]);
		expect(complianceStepHref(1)).toBe(
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
		expect(complianceStepHref(3)).toBe(
			"/declaration-remuneration/parcours-conformite/etape/3",
		);
	});

	it("narrows an untrusted step", () => {
		expect(toComplianceStep(2)).toBe(2);
		expect(toComplianceStep(0)).toBeNull();
		expect(toComplianceStep(4)).toBeNull();
	});
});

describe("avis du CSE", () => {
	it("spells the entry points", () => {
		expect(CSE_OPINION).toBe("/avis-cse");
		expect(CSE_OPINION_CONFIRMATION).toBe("/avis-cse/confirmation");
	});

	it("builds one href per step", () => {
		expect(CSE_OPINION_STEP_NUMBERS).toEqual([1, 2]);
		expect(cseOpinionStepHref(1)).toBe("/avis-cse/etape/1");
		expect(cseOpinionStepHref(2)).toBe("/avis-cse/etape/2");
	});

	it("narrows an untrusted step", () => {
		expect(toCseOpinionStep(1)).toBe(1);
		expect(toCseOpinionStep(3)).toBeNull();
	});
});
