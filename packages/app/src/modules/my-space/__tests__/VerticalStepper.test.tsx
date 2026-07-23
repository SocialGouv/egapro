import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DeclarationDisplayContext } from "~/modules/domain";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import type { PanelVariant } from "../DeclarationProcessPanel";
import { DeclarationProcessPanel } from "../DeclarationProcessPanel";

const FUTURE_YEAR = 2099;
const PAST_YEAR = 2020;

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

function makeDisplayContext(
	first: CompliancePath | null = null,
	second: CompliancePath | null = null,
): DeclarationDisplayContext {
	const paths: Array<CompliancePath | null> = [first, second];
	return {
		firstDeclarationPathChoice: first,
		secondDeclarationPathChoice: second,
		shouldShowGapJustification: paths.includes("justify"),
		shouldShowCorrectiveActions: paths.includes("corrective_action"),
		shouldShowJointEvaluation: paths.includes("joint_evaluation"),
		shouldShowCseOpinion: false,
	};
}

const BASE_PROPS = {
	campaignDeadlines: getDefaultCampaignDeadlines(FUTURE_YEAR),
	cseApplicable: true,
	year: FUTURE_YEAR,
	indicatorGRequired: true,
	lastActionDate: null as string | null,
	displayContext: makeDisplayContext(),
	hasSubmittedSecondDeclaration: false,
	siren: "532847196",
	ctaHref: "/declaration-remuneration?siren=532847196",
	lockedByOther: false,
	lockHolder: null,
};

function renderPanel(
	variant: PanelVariant,
	overrides: Partial<typeof BASE_PROPS> = {},
) {
	const { container } = render(
		<DeclarationProcessPanel
			{...BASE_PROPS}
			{...overrides}
			variant={variant}
		/>,
	);
	const dialog = container.querySelector("dialog");
	if (!dialog)
		throw new Error(
			"DeclarationProcessPanel did not render a <dialog> element",
		);
	return { panel: within(dialog), dialog, container };
}

describe("VerticalStepper — bouton œil (viewHref)", () => {
	describe("1ère déclaration — deadline future", () => {
		it("renders the view link with correct href", () => {
			const { dialog } = renderPanel("compliance");
			const link = dialog.querySelector<HTMLAnchorElement>(
				'a[title="Voir le récapitulatif de la déclaration"]',
			);
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute(
				"href",
				"/declaration-remuneration/recapitulatif?siren=532847196",
			);
		});

		it("renders the sr-only text for accessibility", () => {
			const { panel } = renderPanel("compliance");
			expect(
				panel.getByText("Voir le récapitulatif de la déclaration"),
			).toBeInTheDocument();
		});
	});

	describe("1ère déclaration — deadline passée", () => {
		it("view link stays present after deadline", () => {
			const { dialog } = renderPanel("compliance", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
			});
			const link = dialog.querySelector<HTMLAnchorElement>(
				'a[title="Voir le récapitulatif de la déclaration"]',
			);
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute(
				"href",
				"/declaration-remuneration/recapitulatif?siren=532847196",
			);
		});

		it("Modifier link is hidden after deadline but view link remains", () => {
			const { panel, dialog } = renderPanel("compliance", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
			});
			expect(panel.queryByText("Modifier")).not.toBeInTheDocument();
			expect(
				dialog.querySelector(
					'a[title="Voir le récapitulatif de la déclaration"]',
				),
			).toBeInTheDocument();
		});
	});

	describe("2nde déclaration — variant evaluation", () => {
		it("renders view link on the second declaration row (with type=correction)", () => {
			const { dialog } = renderPanel("evaluation", {
				hasSubmittedSecondDeclaration: true,
			});
			const correctionLink = dialog.querySelector<HTMLAnchorElement>(
				'a[href*="type=correction"][title="Voir le récapitulatif de la déclaration"]',
			);
			expect(correctionLink).toBeInTheDocument();
			expect(correctionLink?.getAttribute("href")).toContain(
				"recapitulatif?siren=532847196",
			);
			expect(correctionLink?.getAttribute("href")).toContain("type=correction");
		});
	});

	describe("2nde déclaration — variant compliance_choice (révision)", () => {
		it("renders the Modifier link for second declaration when awaiting_revision_choice", () => {
			const { panel, dialog } = renderPanel("compliance_choice", {
				displayContext: makeDisplayContext("corrective_action"),
				hasSubmittedSecondDeclaration: true,
			});
			expect(
				panel.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
			const modifyLink = dialog.querySelector<HTMLAnchorElement>(
				'a[href*="/declaration-remuneration/parcours-conformite/etape/1"]',
			);
			expect(modifyLink).toBeInTheDocument();
			expect(modifyLink?.textContent).toContain("Modifier");
		});

		it("does not render second-declaration row when not yet submitted (initial path choice)", () => {
			const { panel } = renderPanel("compliance_choice", {
				hasSubmittedSecondDeclaration: false,
			});
			expect(
				panel.queryByText("Votre seconde déclaration a été transmise"),
			).not.toBeInTheDocument();
		});
	});

	describe("2nde déclaration — variant cse avec secondDeclarationSubmitted", () => {
		it("renders view link on the second declaration row (with type=correction)", () => {
			const { dialog } = renderPanel("cse", {
				hasSubmittedSecondDeclaration: true,
			});
			const correctionLink = dialog.querySelector<HTMLAnchorElement>(
				'a[href*="type=correction"][title="Voir le récapitulatif de la déclaration"]',
			);
			expect(correctionLink).toBeInTheDocument();
			expect(correctionLink?.getAttribute("href")).toContain(
				"recapitulatif?siren=532847196",
			);
			expect(correctionLink?.getAttribute("href")).toContain("type=correction");
		});
	});

	describe("rendu conditionnel des étapes selon le parcours (#3939)", () => {
		const STEP2_TITLE = /Parcours de mise en conformité/;
		const STEP3_TITLE = "Déposer le ou les avis du CSE";
		const STEP1_TITLE = "Déclaration des indicateurs de rémunération";

		it("renders steps 2 and 3 when both indicatorGRequired and cseApplicable are true", () => {
			const { panel } = renderPanel("start");
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.getByText(STEP2_TITLE)).toBeInTheDocument();
			expect(panel.getByText(STEP3_TITLE)).toBeInTheDocument();
		});

		it("hides step 2 when indicatorGRequired is false", () => {
			const { panel } = renderPanel("start", { indicatorGRequired: false });
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.queryByText(STEP2_TITLE)).not.toBeInTheDocument();
			expect(panel.getByText(STEP3_TITLE)).toBeInTheDocument();
		});

		it("hides step 3 when cseApplicable is false", () => {
			const { panel } = renderPanel("start", { cseApplicable: false });
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.getByText(STEP2_TITLE)).toBeInTheDocument();
			expect(panel.queryByText(STEP3_TITLE)).not.toBeInTheDocument();
		});

		it("hides both steps 2 and 3 for a company without CSE and without indicator G", () => {
			const { panel } = renderPanel("start", {
				cseApplicable: false,
				indicatorGRequired: false,
			});
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.queryByText(STEP2_TITLE)).not.toBeInTheDocument();
			expect(panel.queryByText(STEP3_TITLE)).not.toBeInTheDocument();
		});
	});

	describe("ClosedMessage — texte selon cseApplicable (#3939)", () => {
		it("mentions the CSE opinions still being modifiable when cseApplicable is true", () => {
			const { panel } = renderPanel("closed", { cseApplicable: true });
			expect(
				panel.getByText(/Les avis du CSE restent modifiables/),
			).toBeInTheDocument();
		});

		it("shows the plain closed message when cseApplicable is false", () => {
			const { panel } = renderPanel("closed", { cseApplicable: false });
			expect(
				panel.getByText("Cette démarche est terminée."),
			).toBeInTheDocument();
			expect(
				panel.queryByText(/Les avis du CSE restent modifiables/),
			).not.toBeInTheDocument();
		});
	});

	describe("TransmittedRow sans viewHref — pas de bouton œil sur ces lignes", () => {
		it("does not render view link on CSE avis row (closed variant, no decl1 row shown)", () => {
			const { dialog } = renderPanel("closed");
			expect(dialog.querySelector('a[href*="avis-cse"]')).toBeInTheDocument();
			const links = dialog.querySelectorAll(
				'a[title="Voir le récapitulatif de la déclaration"]',
			);
			expect(links).toHaveLength(0);
		});

		it("does not render view link for joint evaluation row (no type=correction link)", () => {
			const { dialog } = renderPanel("cse", {
				displayContext: makeDisplayContext("joint_evaluation"),
				hasSubmittedSecondDeclaration: false,
			});
			const correctionLink = dialog.querySelector('a[href*="type=correction"]');
			expect(correctionLink).not.toBeInTheDocument();
		});

		it("does not render view link for 2nd decl when secondDeclarationSubmitted is false", () => {
			const { dialog } = renderPanel("cse", {
				displayContext: makeDisplayContext("corrective_action"),
				hasSubmittedSecondDeclaration: false,
			});
			const correctionLink = dialog.querySelector('a[href*="type=correction"]');
			expect(correctionLink).not.toBeInTheDocument();
		});
	});
});
