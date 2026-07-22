import { describe, expect, it } from "vitest";
import {
	computeDeclarationStatus,
	DECLARATION_FSM_STATUSES,
	type DeclarationEventType,
	type DeclarationStatusEvent,
	GAP_ALERT_THRESHOLD,
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_BASE_YEAR,
	isComplianceProcessRequired,
	isComplianceProcessRevisionRequired,
} from "~/modules/domain";

function events(...types: DeclarationEventType[]): DeclarationStatusEvent[] {
	return types.map((eventType, index) => ({
		eventType,
		value: null,
		round: null,
		createdAt: new Date(INDICATOR_G_TRIENNIAL_BASE_YEAR, 0, index + 1),
		actorUserId: null,
	}));
}

const COMPLIANCE_BASE = {
	workforce: INDICATOR_G_ANNUAL_MIN,
	hasIndicatorG: true,
	gap: GAP_ALERT_THRESHOLD + 1,
};

type RevisionRow = {
	label: string;
	gap: number;
	events: DeclarationStatusEvent[];
	correctionGap: number | null;
	expected: boolean;
};

const REVISION_ROWS: RevisionRow[] = [
	{
		label:
			"initial compliance path not required (G gap below threshold) → never a revision",
		gap: GAP_ALERT_THRESHOLD - 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD + 1,
		expected: false,
	},
	{
		label: "path required but no second declaration submitted → no revision",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit"),
		correctionGap: GAP_ALERT_THRESHOLD + 1,
		expected: false,
	},
	{
		label:
			"second declaration submitted but corrected gap unknown (null) → no revision",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: null,
		expected: false,
	},
	{
		label:
			"second declaration submitted + corrected gap exactly at the threshold → revision required",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD,
		expected: true,
	},
	{
		label:
			"second declaration submitted + corrected gap above the threshold → revision required",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD + 1,
		expected: true,
	},
	{
		label:
			"second declaration submitted + corrected gap below the threshold → resolved, no revision",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD - 1,
		expected: false,
	},
	{
		label:
			"second declaration submitted + negative corrected gap → no revision (one-directional)",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: -GAP_ALERT_THRESHOLD,
		expected: false,
	},
];

describe("isComplianceProcessRevisionRequired — second-declaration boundaries", () => {
	it.each(REVISION_ROWS)("$label", ({
		gap,
		events: evts,
		correctionGap,
		expected,
	}) => {
		const result = isComplianceProcessRevisionRequired({
			...COMPLIANCE_BASE,
			gap,
			events: evts,
			correctionGap,
		});
		expect(result).toBe(expected);
		// Cross-consistency: a revision is only ever required when the initial
		// compliance process itself was required.
		if (result) {
			expect(isComplianceProcessRequired({ ...COMPLIANCE_BASE, gap })).toBe(
				true,
			);
		}
	});
});

describe("computeDeclarationStatus — FSM status projection to the user-facing status", () => {
	it.each(
		DECLARATION_FSM_STATUSES,
	)("FSM status %s (filling in progress) → done only when terminal", (status) => {
		const result = computeDeclarationStatus({
			status,
			currentStep: 6,
			cancelledAt: null,
		});
		// currentStep 6 = started: even "draft" is in_progress — only draft at step 0 is to_complete (see the dedicated test below).
		if (status === "demarche_completed") {
			expect(result).toBe("done");
		} else {
			expect(result).toBe("in_progress");
		}
	});

	it("missing declaration → to_complete", () => {
		expect(computeDeclarationStatus(undefined)).toBe("to_complete");
	});

	it("draft at step 0 → to_complete; started draft → in_progress", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 0 })).toBe(
			"to_complete",
		);
		expect(computeDeclarationStatus({ status: "draft", currentStep: 3 })).toBe(
			"in_progress",
		);
	});

	it("cancellation → to_complete even when the FSM is terminal", () => {
		expect(
			computeDeclarationStatus({
				status: "demarche_completed",
				currentStep: 6,
				cancelledAt: new Date(INDICATOR_G_TRIENNIAL_BASE_YEAR, 0, 1),
			}),
		).toBe("to_complete");
	});
});
