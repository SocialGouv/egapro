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
			"parcours initial non requis (écart G sous le seuil) → jamais de révision",
		gap: GAP_ALERT_THRESHOLD - 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD + 1,
		expected: false,
	},
	{
		label:
			"parcours requis mais aucune seconde déclaration soumise → pas de révision",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit"),
		correctionGap: GAP_ALERT_THRESHOLD + 1,
		expected: false,
	},
	{
		label:
			"seconde déclaration soumise mais écart corrigé inconnu (null) → pas de révision",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: null,
		expected: false,
	},
	{
		label:
			"seconde déclaration soumise + écart corrigé pile au seuil → révision requise",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD,
		expected: true,
	},
	{
		label:
			"seconde déclaration soumise + écart corrigé au-dessus du seuil → révision requise",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD + 1,
		expected: true,
	},
	{
		label:
			"seconde déclaration soumise + écart corrigé sous le seuil → résolu, pas de révision",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: GAP_ALERT_THRESHOLD - 1,
		expected: false,
	},
	{
		label:
			"seconde déclaration soumise + écart corrigé négatif → pas de révision (unidirectionnel)",
		gap: GAP_ALERT_THRESHOLD + 1,
		events: events("submit", "second_declaration_submit"),
		correctionGap: -GAP_ALERT_THRESHOLD,
		expected: false,
	},
];

describe("isComplianceProcessRevisionRequired — frontières de la seconde déclaration", () => {
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

describe("computeDeclarationStatus — projection du statut FSM vers le statut utilisateur", () => {
	it.each(
		DECLARATION_FSM_STATUSES,
	)("statut FSM « %s » (en cours de saisie) → done seulement si terminal", (status) => {
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

	it("déclaration absente → to_complete", () => {
		expect(computeDeclarationStatus(undefined)).toBe("to_complete");
	});

	it("brouillon à l'étape 0 → to_complete ; brouillon entamé → in_progress", () => {
		expect(computeDeclarationStatus({ status: "draft", currentStep: 0 })).toBe(
			"to_complete",
		);
		expect(computeDeclarationStatus({ status: "draft", currentStep: 3 })).toBe(
			"in_progress",
		);
	});

	it("annulation → to_complete même si le FSM est terminal", () => {
		expect(
			computeDeclarationStatus({
				status: "demarche_completed",
				currentStep: 6,
				cancelledAt: new Date(INDICATOR_G_TRIENNIAL_BASE_YEAR, 0, 1),
			}),
		).toBe("to_complete");
	});
});
