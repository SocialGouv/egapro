import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	getCurrentYear,
	getDefaultRepresentationCampaign,
} from "~/modules/domain";
import { DeclarationsSection } from "../DeclarationsSection";
import type { DeclarationItem } from "../types";

const currentYear = getCurrentYear();

const finalisedRemuneration: DeclarationItem = {
	type: "remuneration",
	siren: "532847196",
	year: currentYear,
	status: "done",
	fsmStatus: "demarche_completed",
	currentStep: 6,
	updatedAt: new Date("2026-03-15"),
	firstDeclarationPathChoice: null,
	secondDeclarationPathChoice: null,
	hasSubmittedSecondDeclaration: false,
	secondDeclarationStep: null,
	hasSubmittedJointEvaluation: false,
	hasSubmittedCseOpinion: false,
	cseRequired: false,
	hasJointEvaluationFile: false,
	formalNoticeAvailable: false,
	hasSubmittedFormalNoticeJointEvaluation: false,
	hasPrefillData: false,
	deadline: null,
	notSubject: false,
};

const transmittedRepresentation: DeclarationItem = {
	...finalisedRemuneration,
	type: "representation",
	fsmStatus: null,
};

function deadlineCellText(declaration: DeclarationItem): string | null {
	render(
		<DeclarationsSection
			cseApplicable={true}
			declarations={[declaration]}
			hasCse={true}
			representationCampaign={getDefaultRepresentationCampaign(currentYear)}
			userPhone="0122334455"
		/>,
	);
	const [, row] = screen.getAllByRole("row");
	const cells = within(row as HTMLElement).getAllByRole("cell");
	return (cells[3] as HTMLElement).textContent;
}

describe("DeclarationsSection — Échéance of a finalised démarche", () => {
	it("shows '-' for a finalised remuneration of the current campaign", () => {
		expect(deadlineCellText(finalisedRemuneration)).toBe("-");
	});

	it("shows '-' for a transmitted representation of the current campaign", () => {
		expect(deadlineCellText(transmittedRepresentation)).toBe("-");
	});

	it("keeps the campaign deadline on a representation still in draft", () => {
		expect(
			deadlineCellText({
				...transmittedRepresentation,
				status: "in_progress",
				currentStep: 2,
			}),
		).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
	});

	it("leaves a finalised remuneration of a previous year untouched", () => {
		expect(
			deadlineCellText({ ...finalisedRemuneration, year: currentYear - 1 }),
		).toBe("Clôturée");
	});
});
