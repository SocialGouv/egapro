import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrdinalLongDate } from "~/modules/declaration-remuneration/shared/OrdinalLongDate";
import type {
	CampaignDeadlines,
	DeclarationDisplayContext,
	DeclarationFsmStatus,
} from "~/modules/domain";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { civilDate } from "~/modules/domain/shared/civilDate";
import {
	DECLARATION_REMUNERATION,
	DECLARATION_REMUNERATION_RECAP,
	DECLARATION_REMUNERATION_RECAP_CORRECTION,
} from "~/modules/routes";
import type { PanelVariant } from "../DeclarationProcessPanel";
import { DeclarationProcessPanel } from "../DeclarationProcessPanel";

const FUTURE_YEAR = 2099;
const PAST_YEAR = 2020;

const FUTURE_DEADLINE_LABELS = {
	decl1ModificationDeadline: "1er juin 2099",
	decl1JointEvaluationDeadline: "1er septembre 2099",
	decl2ModificationDeadline: "1er janvier 2100",
	decl2JointEvaluationDeadline: "1er janvier 2100",
	decl2CseOpinionDeadline: "1er mars 2100",
	pathChoiceDeadline: "1er janvier 2100",
	pathChoiceRound1Deadline: "1er juillet 2099",
} satisfies Partial<Record<keyof CampaignDeadlines, string>>;

// decl2ModificationDeadline, pathChoiceDeadline and decl2JointEvaluationDeadline all default to January 1st N+1: override each to a distinct date so a case below cannot pass by reading the wrong key.
function distinctDeadlines(year: number) {
	return {
		...getDefaultCampaignDeadlines(year),
		decl2ModificationDeadline: civilDate(year + 1, 0, 2),
		pathChoiceDeadline: civilDate(year + 1, 0, 3),
		decl2JointEvaluationDeadline: civilDate(year + 1, 0, 4),
	};
}

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
const DECL1_VIEW = `a[href="${DECLARATION_REMUNERATION_RECAP}"]`;
const RECAP_VIEW = 'a[title="Voir le récapitulatif de la déclaration"]';

const BASE_PROPS = {
	campaignDeadlines: getDefaultCampaignDeadlines(FUTURE_YEAR),
	compliancePathApplicable: true,
	cseOpinionRequired: true,
	year: FUTURE_YEAR,
	hasPrefillData: true,
	indicatorGRequired: true,
	lastActionDate: null as string | null,
	displayContext: makeDisplayContext(),
	hasSubmittedSecondDeclaration: false,
	hasSubmittedJointEvaluation: false,
	hasSubmittedCseOpinion: false,
	siren: "532847196",
	ctaHref: DECLARATION_REMUNERATION,
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
			expect(link).toHaveAttribute("href", DECLARATION_REMUNERATION_RECAP);
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
			expect(link).toHaveAttribute("href", DECLARATION_REMUNERATION_RECAP);
		});

		it("Modifier link stays offered after deadline, next to the view link", () => {
			const { dialog } = renderPanel("compliance", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
			});
			expect(dialog.querySelector(DECL1_MODIFY)).toBeInTheDocument();
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
				DECLARATION_REMUNERATION_RECAP_CORRECTION,
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
				`Échéance : ${FUTURE_DEADLINE_LABELS.pathChoiceRound1Deadline}`,
			);
			expect(deadlineRow).not.toHaveTextContent(
				FUTURE_DEADLINE_LABELS.decl2ModificationDeadline,
			);
		});

		it("shows the round-2 path-choice deadline once the second declaration is submitted", () => {
			const deadlines = distinctDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance_choice", {
				campaignDeadlines: deadlines,
				displayContext: makeDisplayContext("corrective_action"),
				hasSubmittedSecondDeclaration: true,
			});

			const deadlineRow = panel.getByText(/^Échéance :/);
			expect(deadlineRow).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.pathChoiceDeadline)}`,
			);
			expect(deadlineRow).not.toHaveTextContent(
				longDateText(deadlines.decl2ModificationDeadline),
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
			const { panel, dialog } = renderPanel(variant);
			expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeInTheDocument();
			expect(dialog.querySelector(DECL1_VIEW)).toBeInTheDocument();
		});

		it("keeps the view link on a closed démarche once the deadline has passed", () => {
			const { dialog } = renderPanel("closed", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
				year: PAST_YEAR,
			});
			expect(dialog.querySelector(DECL1_VIEW)).toBeInTheDocument();
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
				`Échéance : ${FUTURE_DEADLINE_LABELS.pathChoiceRound1Deadline}`,
			);
		});

		it("names the pending path choice again after the second declaration", () => {
			const deadlines = distinctDeadlines(FUTURE_YEAR);
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
			const deadlines = distinctDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("compliance", {
				campaignDeadlines: deadlines,
				displayContext: makeDisplayContext("corrective_action"),
			});

			expect(
				panel.getByText("Actions correctives et seconde déclaration"),
			).toBeInTheDocument();
			const deadlineRow = panel.getByText(/^Échéance :/);
			expect(deadlineRow).toHaveTextContent(
				`Échéance : ${longDateText(deadlines.decl2ModificationDeadline)}`,
			);
			expect(deadlineRow).not.toHaveTextContent(
				longDateText(deadlines.pathChoiceDeadline),
			);
		});

		it.each([
			{
				label: "first round",
				displayContext: makeDisplayContext("justify"),
			},
			{
				label: "revised choice",
				displayContext: makeDisplayContext("corrective_action", "justify"),
			},
		])("names the $label justification with no deadline", ({
			displayContext,
		}) => {
			const { panel } = renderPanel("cse", {
				displayContext,
				hasSubmittedSecondDeclaration: false,
			});

			const step2 = panel.getByText(
				/^Parcours de mise en conformité/,
			).parentElement;
			if (!step2) throw new Error("Step 2 content did not render");
			expect(step2).toHaveTextContent(
				"Justification des écarts de rémunération",
			);
			expect(within(step2).queryByText(/^Échéance :/)).not.toBeInTheDocument();
		});

		it.each([
			{
				label: "first round",
				declarationFsmStatus: "joint_evaluation_chosen" as const,
				displayContext: makeDisplayContext("joint_evaluation"),
				hasSubmittedSecondDeclaration: false,
				deadlineKey: "decl1JointEvaluationDeadline" as const,
			},
			{
				label: "revised choice",
				declarationFsmStatus: "revised_joint_evaluation_chosen" as const,
				displayContext: makeDisplayContext(
					"corrective_action",
					"joint_evaluation",
				),
				hasSubmittedSecondDeclaration: true,
				deadlineKey: "decl2JointEvaluationDeadline" as const,
			},
		])("names the $label joint evaluation with the applicable deadline", ({
			declarationFsmStatus,
			displayContext,
			hasSubmittedSecondDeclaration,
			deadlineKey,
		}) => {
			const deadlines = distinctDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("evaluation", {
				campaignDeadlines: deadlines,
				declarationFsmStatus,
				displayContext,
				hasSubmittedSecondDeclaration,
			});

			expect(
				panel.getByText("Évaluation conjointe des rémunérations"),
			).toBeInTheDocument();
			const deadlineRow = panel.getByText(/^Échéance :/);
			expect(deadlineRow).toHaveTextContent(
				`Échéance : ${longDateText(deadlines[deadlineKey])}`,
			);
			const otherKey =
				deadlineKey === "decl1JointEvaluationDeadline"
					? "decl2JointEvaluationDeadline"
					: "decl1JointEvaluationDeadline";
			expect(deadlineRow).not.toHaveTextContent(
				longDateText(deadlines[otherKey]),
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
				DECLARATION_REMUNERATION_RECAP_CORRECTION,
			);
			expect(correctionLink?.getAttribute("href")).toContain("type=correction");
		});
	});

	describe("rendu conditionnel des étapes selon le parcours (#3939)", () => {
		const STEP2_TITLE = /Parcours de mise en conformité/;
		const STEP3_TITLE = "Dépôt du ou des avis du CSE";
		const STEP1_TITLE = "Déclaration des indicateurs de rémunération";

		it("renders steps 2 and 3 when both compliancePathApplicable and cseOpinionRequired are true", () => {
			const { panel } = renderPanel("start");
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.getByText(STEP2_TITLE)).toBeInTheDocument();
			expect(panel.getByText(STEP3_TITLE)).toBeInTheDocument();
		});

		it("hides step 2 when compliancePathApplicable is false", () => {
			const { panel } = renderPanel("start", {
				compliancePathApplicable: false,
			});
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

		it("hides both steps 2 and 3 when neither compliance nor a CSE opinion applies", () => {
			const { panel } = renderPanel("start", {
				cseOpinionRequired: false,
				compliancePathApplicable: false,
			});
			expect(panel.getByText(STEP1_TITLE)).toBeInTheDocument();
			expect(panel.queryByText(STEP2_TITLE)).not.toBeInTheDocument();
			expect(panel.queryByText(STEP3_TITLE)).not.toBeInTheDocument();
		});
	});

	describe("puces de l'étape 1 selon indicatorGRequired (#4267)", () => {
		const PREFILLED_BULLET = /Indicateurs pré-remplis à vérifier/;
		const CATEGORY_BULLET =
			/Indicateur de rémunération par catégories de salariés à remplir/;

		it("renders both bullets on the start variant when indicator G applies", () => {
			const { panel } = renderPanel("start", { indicatorGRequired: true });
			expect(panel.getByText(PREFILLED_BULLET)).toBeInTheDocument();
			expect(panel.getByText(CATEGORY_BULLET)).toBeInTheDocument();
		});

		it("drops the category bullet but keeps the prefilled one when indicator G does not apply", () => {
			const { panel } = renderPanel("start", { indicatorGRequired: false });
			expect(panel.getByText(PREFILLED_BULLET)).toBeInTheDocument();
			expect(panel.queryByText(CATEGORY_BULLET)).not.toBeInTheDocument();
		});

		it("keeps the step 1 deadline row when the category bullet is dropped", () => {
			const deadlines = getDefaultCampaignDeadlines(FUTURE_YEAR);
			const { panel } = renderPanel("start", {
				campaignDeadlines: deadlines,
				indicatorGRequired: false,
			});
			expect(panel.getByText(/^Échéance :/)).toHaveTextContent(
				`Échéance : ${FUTURE_DEADLINE_LABELS.decl1ModificationDeadline}`,
			);
		});

		it("renders no step 1 bullet outside the start variant", () => {
			const { panel } = renderPanel("compliance_choice", {
				indicatorGRequired: true,
			});
			expect(panel.queryByText(PREFILLED_BULLET)).not.toBeInTheDocument();
			expect(panel.queryByText(CATEGORY_BULLET)).not.toBeInTheDocument();
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

		it("renumbers the CSE step to 2 when the compliance step is hidden", () => {
			const { dialog } = renderPanel("start", {
				compliancePathApplicable: false,
			});
			expect(stepNumbers(dialog)).toEqual(["1", "2"]);
		});

		it("keeps step 2 numbered 2 when step 3 (CSE) is hidden", () => {
			const { dialog } = renderPanel("start", { cseOpinionRequired: false });
			expect(stepNumbers(dialog)).toEqual(["1", "2"]);
		});

		it("only shows step 1 when both steps 2 and 3 are hidden", () => {
			const { dialog } = renderPanel("start", {
				cseOpinionRequired: false,
				compliancePathApplicable: false,
			});
			expect(stepNumbers(dialog)).toEqual(["1"]);
		});
	});

	describe("étape 3 — échéance de l'avis du CSE (#4217)", () => {
		const DEADLINES = getDefaultCampaignDeadlines(FUTURE_YEAR);

		it("closes the CSE opinion after the round-2 joint evaluation", () => {
			expect(DEADLINES.decl2CseOpinionDeadline).not.toEqual(
				DEADLINES.decl2JointEvaluationDeadline,
			);
			expect(DEADLINES.decl2CseOpinionDeadline.getTime()).toBeGreaterThan(
				DEADLINES.decl2JointEvaluationDeadline.getTime(),
			);
		});

		it("shows the CSE opinion deadline on the cse variant", () => {
			const { panel } = renderPanel("cse");
			const row = panel.getByText(/Échéance :/);
			expect(row).toHaveTextContent(
				FUTURE_DEADLINE_LABELS.decl2CseOpinionDeadline,
			);
			expect(row).not.toHaveTextContent(
				FUTURE_DEADLINE_LABELS.decl2JointEvaluationDeadline,
			);
		});

		it("shows neither a date nor a mention on the transmitted row of the closed variant", () => {
			const { panel } = renderPanel("closed");
			const row = panel.getByText("Vos avis du CSE ont été transmis")
				.parentElement as HTMLElement;
			expect(row).not.toHaveTextContent(/Modifiable jusqu'/);
			expect(row).not.toHaveTextContent(
				FUTURE_DEADLINE_LABELS.decl2CseOpinionDeadline,
			);
		});
	});

	describe("ClosedMessage — texte selon cseOpinionRequired (#3939)", () => {
		it("mentions the CSE opinions still being modifiable when cseOpinionRequired is true", () => {
			const { panel } = renderPanel("closed", { cseOpinionRequired: true });
			expect(
				panel.getByText(
					"Cette démarche est terminée. Vos avis du CSE restent modifiables.",
				),
			).toBeInTheDocument();
		});

		it("says the declaration stays modifiable when there is no CSE opinion and nothing superseded it (S8)", () => {
			const { panel } = renderPanel("closed", { cseOpinionRequired: false });
			expect(
				panel.getByText(
					"Cette démarche est terminée. Votre déclaration reste modifiable.",
				),
			).toBeInTheDocument();
			expect(
				panel.queryByText(/Les avis du CSE restent modifiables/),
			).not.toBeInTheDocument();
		});

		it.each([
			["a second declaration", { hasSubmittedSecondDeclaration: true }],
			["a joint evaluation report", { hasSubmittedJointEvaluation: true }],
		])("shows the plain closed message when there is no CSE opinion and %s superseded the first declaration", (_label, overrides) => {
			const { panel } = renderPanel("closed", {
				cseOpinionRequired: false,
				...overrides,
			});
			expect(
				panel.getByText("Cette démarche est terminée."),
			).toBeInTheDocument();
			expect(panel.queryByText(/reste modifiable/)).not.toBeInTheDocument();
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

		it("carries no mention under any row of a closed panel (superseded first declaration, CSE avis, no Modifier)", () => {
			const { panel } = renderPanel("closed", CLOSED_OVERRIDES);

			expect(panel.queryByText(/Modifiable jusqu'/)).not.toBeInTheDocument();
			expect(
				panel.queryByText(/Modification close depuis/),
			).not.toBeInTheDocument();
		});

		it("carries no mention on the first declaration row of a closed panel where Modifier is still offered", () => {
			const { panel, dialog } = renderPanel("closed", {
				cseOpinionRequired: false,
			});

			expect(dialog.querySelector(DECL1_MODIFY)).toBeInTheDocument();
			expect(panel.queryByText(/Modifiable jusqu'/)).not.toBeInTheDocument();
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
		])("offers Modifier on the second declaration row for the status %s, with its mention", (declarationFsmStatus) => {
			const { panel, dialog } = renderPanel("cse", {
				...SUBMITTED_ROWS,
				declarationFsmStatus,
			});
			expect(dialog.querySelector(DECL2_MODIFY)).toBeInTheDocument();
			expect(
				panel.getByText("Modifiable jusqu'au choix de votre nouveau parcours"),
			).toBeInTheDocument();
		});

		it("gives the joint evaluation row a Modifier but no mention", () => {
			const { panel } = renderPanel("cse", {
				...SUBMITTED_ROWS,
				declarationFsmStatus: "joint_evaluation_chosen",
			});
			expect(panel.queryByText(/Modifiable jusqu'au choix/)).toBeNull();
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
	describe("« Modifier » de la 1ʳᵉ déclaration : supersédée ou non, dans toutes les variantes", () => {
		const VARIANTS: PanelVariant[] = [
			"compliance_choice",
			"compliance",
			"evaluation",
			"cse",
			"closed",
		];
		const SUPERSEDING: Array<[string, PanelOverrides]> = [
			["a second declaration", { hasSubmittedSecondDeclaration: true }],
			["a joint evaluation report", { hasSubmittedJointEvaluation: true }],
			["a CSE opinion", { hasSubmittedCseOpinion: true }],
		];

		it.each(
			VARIANTS,
		)("offers Modifier on variant %s when nothing later was transmitted", (variant) => {
			const { dialog } = renderPanel(variant);
			expect(dialog.querySelector(DECL1_MODIFY)).toBeInTheDocument();
			expect(dialog.querySelector(DECL1_VIEW)).toBeInTheDocument();
		});

		describe.each(
			SUPERSEDING,
		)("once %s was transmitted", (_label, overrides) => {
			it.each(
				VARIANTS,
			)("withholds Modifier but keeps the view link on variant %s", (variant) => {
				const { dialog } = renderPanel(variant, overrides);
				expect(dialog.querySelector(DECL1_MODIFY)).not.toBeInTheDocument();
				expect(dialog.querySelector(DECL1_VIEW)).toBeInTheDocument();
			});
		});

		it.each(
			VARIANTS.filter((variant) => variant !== "closed"),
		)("shows the first declaration mention on variant %s when Modifier is offered", (variant) => {
			const { panel } = renderPanel(variant);
			expect(
				panel.getByText("Modifiable jusqu'à votre prochaine transmission"),
			).toBeInTheDocument();
		});

		it("shows no first declaration mention on the closed variant, even when Modifier is offered", () => {
			const { panel, dialog } = renderPanel("closed");
			expect(dialog.querySelector(DECL1_MODIFY)).toBeInTheDocument();
			expect(
				panel.queryByText("Modifiable jusqu'à votre prochaine transmission"),
			).not.toBeInTheDocument();
		});

		it.each(
			SUPERSEDING,
		)("shows no first declaration mention once %s was transmitted", (_label, overrides) => {
			const { panel } = renderPanel("compliance", overrides);
			expect(
				panel.queryByText("Modifiable jusqu'à votre prochaine transmission"),
			).not.toBeInTheDocument();
		});

		it("does not let the path choice supersede the first declaration", () => {
			const { dialog } = renderPanel("evaluation", {
				displayContext: makeDisplayContext("joint_evaluation"),
			});
			expect(dialog.querySelector(DECL1_MODIFY)).toBeInTheDocument();
		});

		it.each([
			{ label: "no CSE opinion due, no gap", cseOpinionRequired: false },
			{
				label: "150 employees without CSE, justification path",
				cseOpinionRequired: false,
				displayContext: makeDisplayContext("justify"),
			},
			{
				label: "CSE opinion due but not transmitted",
				cseOpinionRequired: true,
			},
		])("offers Modifier again on a closed démarche with $label", ({
			cseOpinionRequired,
			displayContext,
		}) => {
			const { dialog } = renderPanel("closed", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
				cseOpinionRequired,
				displayContext: displayContext ?? makeDisplayContext(),
				year: PAST_YEAR,
			});
			expect(dialog.querySelector(DECL1_MODIFY)).toBeInTheDocument();
		});
	});

	describe("« Modifier » de la seconde déclaration : selon isSecondDeclarationWritable, dans toutes les variantes", () => {
		const WRITABLE: DeclarationFsmStatus[] = [
			"corrective_actions_chosen",
			"awaiting_revision_choice",
		];
		const NOT_WRITABLE: DeclarationFsmStatus[] = [
			"awaiting_compliance_path_choice",
			"joint_evaluation_chosen",
			"revised_joint_evaluation_chosen",
			"awaiting_cse_opinion",
			"demarche_completed",
		];
		const VARIANTS: PanelVariant[] = [
			"compliance_choice",
			"evaluation",
			"cse",
			"closed",
		];

		describe.each(VARIANTS)("variant %s", (variant) => {
			it.each(
				WRITABLE,
			)("offers Modifier for the status %s", (declarationFsmStatus) => {
				const { dialog } = renderPanel(variant, {
					declarationFsmStatus,
					displayContext: makeDisplayContext("corrective_action"),
					hasSubmittedSecondDeclaration: true,
				});
				expect(dialog.querySelector(DECL2_MODIFY)).toBeInTheDocument();
			});

			it.each(
				NOT_WRITABLE,
			)("withholds Modifier for the status %s", (declarationFsmStatus) => {
				const { dialog } = renderPanel(variant, {
					declarationFsmStatus,
					displayContext: makeDisplayContext("corrective_action"),
					hasSubmittedSecondDeclaration: true,
				});
				expect(dialog.querySelector(DECL2_MODIFY)).not.toBeInTheDocument();
				expect(
					dialog.querySelector('a[href*="type=correction"]'),
				).toBeInTheDocument();
			});
		});

		it("withholds Modifier when the revised joint evaluation was chosen after the second declaration", () => {
			const { dialog } = renderPanel("evaluation", {
				declarationFsmStatus: "revised_joint_evaluation_chosen",
				displayContext: makeDisplayContext(
					"corrective_action",
					"joint_evaluation",
				),
				hasSubmittedSecondDeclaration: true,
			});
			expect(dialog.querySelector(DECL2_MODIFY)).not.toBeInTheDocument();
		});

		it("keeps Modifier on the second declaration past its date while the status allows it", () => {
			const { dialog } = renderPanel("compliance_choice", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
				declarationFsmStatus: "awaiting_revision_choice",
				displayContext: makeDisplayContext("corrective_action"),
				hasSubmittedSecondDeclaration: true,
				year: PAST_YEAR,
			});
			expect(dialog.querySelector(DECL2_MODIFY)).toBeInTheDocument();
		});
	});

	describe("« Modifier » des avis du CSE en démarche close, échéance passée", () => {
		it("offers Modifier past the CSE opinion deadline", () => {
			const { dialog } = renderPanel("closed", {
				campaignDeadlines: getDefaultCampaignDeadlines(PAST_YEAR),
				hasSubmittedCseOpinion: true,
				year: PAST_YEAR,
			});
			expect(dialog.querySelector(CSE_MODIFY)).toBeInTheDocument();
			expect(dialog.querySelector(CSE_MODIFY)?.textContent).toContain(
				"Modifier",
			);
		});
	});
});
