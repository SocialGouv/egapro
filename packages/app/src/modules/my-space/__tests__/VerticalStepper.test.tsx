import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrdinalLongDate } from "~/modules/declaration-remuneration/shared/OrdinalLongDate";
import type {
	DeclarationDisplayContext,
	DeclarationFsmStatus,
} from "~/modules/domain";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import type { PanelVariant } from "../DeclarationProcessPanel";
import { DeclarationProcessPanel } from "../DeclarationProcessPanel";

const FUTURE_YEAR = 2099;
const PAST_YEAR = 2020;

// `OrdinalLongDate` formats in UTC, so a hardcoded label would break on other timezones.
function longDateText(date: Date): string {
	const { container } = render(<OrdinalLongDate date={date} />);
	return container.textContent ?? "";
}

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

// Pinning a variant means feeding the FSM status `computePanelVariant` derives it from.
const VARIANT_FSM_STATUS: Record<PanelVariant, DeclarationFsmStatus | null> = {
	start: "draft",
	compliance_choice: "awaiting_compliance_path_choice",
	compliance: "corrective_actions_chosen",
	evaluation: "joint_evaluation_chosen",
	cse: "awaiting_cse_opinion",
	closed: "demarche_completed",
};

const DECL1_MODIFY = 'a[href^="/declaration-remuneration/etape/1"]';
const DECL2_MODIFY =
	'a[href^="/declaration-remuneration/parcours-conformite/etape/1"]';
const JOINT_EVALUATION_MODIFY =
	'a[href^="/declaration-remuneration/parcours-conformite/evaluation-conjointe"]';
const CSE_MODIFY = 'a[href^="/avis-cse/etape/2"]';
const DECL1_VIEW =
	'a[href="/declaration-remuneration/recapitulatif?siren=532847196"]';
const RECAP_VIEW = 'a[title="Voir le récapitulatif de la déclaration"]';

const BASE_PROPS = {
	campaignDeadlines: getDefaultCampaignDeadlines(FUTURE_YEAR),
	cseOpinionRequired: true,
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

type PanelOverrides = Partial<typeof BASE_PROPS> & {
	declarationFsmStatus?: DeclarationFsmStatus | null;
};

function renderPanel(variant: PanelVariant, overrides: PanelOverrides = {}) {
	const { container } = render(
		<DeclarationProcessPanel
			{...BASE_PROPS}
			declarationFsmStatus={VARIANT_FSM_STATUS[variant]}
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
				'a[href*="type=correction"][title="Voir le récapitulatif de la seconde déclaration"]',
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
				declarationFsmStatus: "awaiting_revision_choice",
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

		it("shows the round-1 path-choice deadline while the second declaration is not submitted", () => {
			const deadlines = getDefaultCampaignDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance_choice", {
				campaignDeadlines: deadlines,
				hasSubmittedSecondDeclaration: false,
			});

			const deadlineRow = panel.getByText(/^Échéance :/);
			expect(deadlineRow).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.pathChoiceRound1Deadline)}`,
			);
			expect(deadlineRow).not.toHaveTextContent(
				longDateText(deadlines.decl2ModificationDeadline),
			);
		});

		it("shows the round-2 path-choice deadline once the second declaration is submitted", () => {
			const deadlines = getDefaultCampaignDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance_choice", {
				campaignDeadlines: deadlines,
				displayContext: makeDisplayContext("corrective_action"),
				hasSubmittedSecondDeclaration: true,
			});

			const deadlineRow = panel.getByText(/^Échéance :/);
			expect(deadlineRow).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.pathChoiceDeadline)}`,
			);
		});
	});

	describe("étape 1 transmise sur tous les parcours (#4243)", () => {
		it.each<PanelVariant>([
			"compliance_choice",
			"compliance",
			"evaluation",
			"cse",
			"closed",
		])("announces the transmitted declaration for variant %s", (variant) => {
			const { panel } = renderPanel(variant);
			expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeInTheDocument();
		});

		it("keeps the view link on a closed démarche once the deadline has passed", () => {
			const { panel, dialog } = renderPanel("closed", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
				year: PAST_YEAR,
			});
			expect(
				dialog.querySelector(
					'a[href="/declaration-remuneration/recapitulatif?siren=532847196"]',
				),
			).toBeInTheDocument();
			expect(
				panel.queryByRole("link", { name: "Modifier" }),
			).not.toBeInTheDocument();
		});
	});

	describe("étape 2 — choix du parcours nommé (#4243)", () => {
		it("names the pending path choice on the first declaration", () => {
			const deadlines = getDefaultCampaignDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance_choice", {
				campaignDeadlines: deadlines,
				hasSubmittedSecondDeclaration: false,
			});

			expect(
				panel.getByText("Choix du parcours de mise en conformité"),
			).toBeInTheDocument();
			expect(panel.getByText(/^Échéance :/)).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.pathChoiceRound1Deadline)}`,
			);
		});

		it("names the pending path choice again after the second declaration", () => {
			const deadlines = getDefaultCampaignDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance_choice", {
				campaignDeadlines: deadlines,
				displayContext: makeDisplayContext("corrective_action"),
				hasSubmittedSecondDeclaration: true,
			});

			expect(
				panel.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
			expect(
				panel.getByText("Choix du parcours de mise en conformité"),
			).toBeInTheDocument();
			expect(panel.getByText(/^Échéance :/)).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.pathChoiceDeadline)}`,
			);
		});

		it("names the chosen path and its deadline for corrective actions", () => {
			const deadlines = getDefaultCampaignDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance", {
				campaignDeadlines: deadlines,
				displayContext: makeDisplayContext("corrective_action"),
			});

			expect(
				panel.getByText("Actions correctives et seconde déclaration"),
			).toBeInTheDocument();
			expect(panel.getByText(/^Échéance :/)).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.decl2ModificationDeadline)}`,
			);
		});

		it("names the chosen path with no deadline for the justification", () => {
			const { panel } = renderPanel("cse", {
				displayContext: makeDisplayContext("justify"),
				hasSubmittedSecondDeclaration: false,
			});

			const step2 = panel
				.getByText(/^Parcours de mise en conformité/)
				.closest("div");
			expect(step2).not.toBeNull();
			expect(step2?.parentElement).toHaveTextContent(
				"Justification des écarts de rémunération",
			);
		});
	});

	describe("2nde déclaration — variant cse avec secondDeclarationSubmitted", () => {
		it("renders view link on the second declaration row (with type=correction)", () => {
			const { dialog } = renderPanel("cse", {
				hasSubmittedSecondDeclaration: true,
			});
			const correctionLink = dialog.querySelector<HTMLAnchorElement>(
				'a[href*="type=correction"][title="Voir le récapitulatif de la seconde déclaration"]',
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

		it("renders steps 2 and 3 when both indicatorGRequired and cseOpinionRequired are true", () => {
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

		it("hides step 3 when cseOpinionRequired is false", () => {
			const { panel } = renderPanel("start", { cseOpinionRequired: false });
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.getByText(STEP2_TITLE)).toBeInTheDocument();
			expect(panel.queryByText(STEP3_TITLE)).not.toBeInTheDocument();
		});

		it("hides both steps 2 and 3 for a company without CSE and without indicator G", () => {
			const { panel } = renderPanel("start", {
				cseOpinionRequired: false,
				indicatorGRequired: false,
			});
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.queryByText(STEP2_TITLE)).not.toBeInTheDocument();
			expect(panel.queryByText(STEP3_TITLE)).not.toBeInTheDocument();
		});
	});

	describe("numérotation des étapes visibles (#4000)", () => {
		function stepNumbers(dialog: HTMLElement): string[] {
			return Array.from(
				dialog.querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
			)
				.map((el) => el.textContent ?? "")
				.filter((text) => /^[123]$/.test(text));
		}

		it("numbers steps 1, 2, 3 in sequence when both steps 2 and 3 are visible", () => {
			const { dialog } = renderPanel("start");
			expect(stepNumbers(dialog)).toEqual(["1", "2", "3"]);
		});

		it("renumbers the CSE step to 2 when step 2 (indicator G) is hidden", () => {
			const { dialog } = renderPanel("start", { indicatorGRequired: false });
			expect(stepNumbers(dialog)).toEqual(["1", "2"]);
		});

		it("keeps step 2 numbered 2 when step 3 (CSE) is hidden", () => {
			const { dialog } = renderPanel("start", { cseOpinionRequired: false });
			expect(stepNumbers(dialog)).toEqual(["1", "2"]);
		});

		it("only shows step 1 when both steps 2 and 3 are hidden", () => {
			const { dialog } = renderPanel("start", {
				cseOpinionRequired: false,
				indicatorGRequired: false,
			});
			expect(stepNumbers(dialog)).toEqual(["1"]);
		});
	});

	describe("ClosedMessage — texte selon cseOpinionRequired (#3939)", () => {
		it("mentions the CSE opinions still being modifiable when cseOpinionRequired is true", () => {
			const { panel } = renderPanel("closed", { cseOpinionRequired: true });
			expect(
				panel.getByText(/Les avis du CSE restent modifiables/),
			).toBeInTheDocument();
		});

		it("shows the plain closed message when cseOpinionRequired is false", () => {
			const { panel } = renderPanel("closed", { cseOpinionRequired: false });
			expect(
				panel.getByText("Cette démarche est terminée."),
			).toBeInTheDocument();
			expect(
				panel.queryByText(/Les avis du CSE restent modifiables/),
			).not.toBeInTheDocument();
		});
	});

	describe("TransmittedRow sans viewHref — pas de bouton œil sur ces lignes", () => {
		it("does not render view link on CSE avis row, while the decl1 row keeps its own", () => {
			const { dialog } = renderPanel("closed");
			expect(dialog.querySelector(CSE_MODIFY)).toBeInTheDocument();
			expect(dialog.querySelector(DECL1_VIEW)).toBeInTheDocument();
			expect(dialog.querySelectorAll(RECAP_VIEW)).toHaveLength(1);
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

	describe("démarche close — l'affordance « Modifier » suit la FSM (#4222)", () => {
		const CLOSED_OVERRIDES: PanelOverrides = {
			displayContext: makeDisplayContext("joint_evaluation"),
			hasSubmittedSecondDeclaration: true,
		};

		it("keeps the first declaration transmission notice and its view link, without Modifier", () => {
			const { panel, dialog } = renderPanel("closed", CLOSED_OVERRIDES);

			expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeInTheDocument();
			expect(dialog.querySelector(DECL1_VIEW)).toBeInTheDocument();
			expect(dialog.querySelector(DECL1_MODIFY)).not.toBeInTheDocument();
		});

		it("keeps the second declaration view link but drops its Modifier", () => {
			const { panel, dialog } = renderPanel("closed", CLOSED_OVERRIDES);

			expect(
				panel.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
			expect(
				dialog.querySelector('a[href*="type=correction"]'),
			).toBeInTheDocument();
			expect(dialog.querySelector(DECL2_MODIFY)).not.toBeInTheDocument();
		});

		it("gives each view link a distinct accessible name (RGAA 6.1)", () => {
			const { dialog } = renderPanel("closed", CLOSED_OVERRIDES);

			const titles = Array.from(
				dialog.querySelectorAll("a.fr-icon-eye-line"),
				(a) => a.getAttribute("title"),
			);
			expect(titles.length).toBeGreaterThan(1);
			expect(new Set(titles).size).toBe(titles.length);
		});

		it("keeps the joint evaluation transmission notice, with neither view link nor Modifier", () => {
			const { panel, dialog } = renderPanel("closed", CLOSED_OVERRIDES);

			expect(
				panel.getByText(
					"Votre rapport de l'évaluation conjointe a été transmis",
				),
			).toBeInTheDocument();
			expect(
				dialog.querySelector(
					'a[href^="/api/v1/files/"], a[title^="Visualiser"]',
				),
			).not.toBeInTheDocument();
			expect(
				dialog.querySelector(JOINT_EVALUATION_MODIFY),
			).not.toBeInTheDocument();
		});

		it("keeps Modifier on the CSE avis row, the only action the FSM still allows", () => {
			const { panel, dialog } = renderPanel("closed", CLOSED_OVERRIDES);

			const cseModify = dialog.querySelector(CSE_MODIFY);
			expect(cseModify).toBeInTheDocument();
			expect(cseModify?.textContent).toContain("Modifier");
			expect(panel.getAllByText("Modifier")).toHaveLength(1);
		});

		it("advertises a modification deadline on the CSE avis row only", () => {
			const { panel } = renderPanel("closed", CLOSED_OVERRIDES);

			expect(panel.getAllByText(/Modifiable jusqu'au/)).toHaveLength(1);
			expect(
				panel.queryByText(/Modification close depuis/),
			).not.toBeInTheDocument();
		});
	});

	describe("le « Modifier » suit le statut FSM, pas le variant (#4222)", () => {
		const SUBMITTED_ROWS: PanelOverrides = {
			displayContext: makeDisplayContext("joint_evaluation"),
			hasSubmittedSecondDeclaration: true,
		};

		it.each<DeclarationFsmStatus>([
			"corrective_actions_chosen",
			"awaiting_revision_choice",
		])("offers Modifier on the second declaration row for the status %s", (declarationFsmStatus) => {
			const { dialog } = renderPanel("cse", {
				...SUBMITTED_ROWS,
				declarationFsmStatus,
			});
			expect(dialog.querySelector(DECL2_MODIFY)).toBeInTheDocument();
		});

		it.each<DeclarationFsmStatus>([
			"joint_evaluation_chosen",
			"revised_joint_evaluation_chosen",
		])("offers Modifier on the joint evaluation row for the status %s", (declarationFsmStatus) => {
			const { dialog } = renderPanel("cse", {
				...SUBMITTED_ROWS,
				declarationFsmStatus,
			});
			expect(dialog.querySelector(JOINT_EVALUATION_MODIFY)).toBeInTheDocument();
		});

		it.each<DeclarationFsmStatus>([
			"awaiting_cse_opinion",
			"demarche_completed",
		])("withholds both Modifier links for the status %s", (declarationFsmStatus) => {
			const { dialog } = renderPanel("cse", {
				...SUBMITTED_ROWS,
				declarationFsmStatus,
			});
			expect(dialog.querySelector(DECL2_MODIFY)).not.toBeInTheDocument();
			expect(
				dialog.querySelector(JOINT_EVALUATION_MODIFY),
			).not.toBeInTheDocument();
		});
	});
});
