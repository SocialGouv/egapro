import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
	FirstRoundOptions,
	getCompliancePathHref,
	JustifyOption,
	SecondRoundOptions,
} from "../CompliancePathOptions";

const JUSTIFICATION_DEADLINE = new Date("2027-03-01");
const JOINT_EVALUATION_DEADLINE = new Date("2027-05-01");
const CORRECTIVE_ACTION_DEADLINE = new Date("2027-09-01");

const JUSTIFY_CSE_CONSULT =
	"Informer et consulter votre CSE sur cette justification";
const JUSTIFY_CSE_OPINION = "Transmettre l'avis du CSE";
const CORRECTIVE_CSE_CONSULT =
	/Informer et consulter votre CSE sur l'exactitude/;
const CORRECTIVE_CSE_OPINION = "Transmettre l'avis ou les avis du CSE";
const CORRECTIVE_ACTION_TITLE =
	"Effectuer des actions correctives et une seconde déclaration";

// An option whose only list items are CSE-gated must drop the whole <ul>:
// an empty list is invalid content for assistive technologies (RGAA 9.3).
function expectNoEmptyList(container: HTMLElement) {
	const emptyLists = Array.from(container.querySelectorAll("ul")).filter(
		(list) => list.children.length === 0,
	);
	expect(emptyLists).toHaveLength(0);
}

describe("getCompliancePathHref", () => {
	it.each([
		true,
		false,
		null,
	])("routes corrective_action to the second declaration funnel (hasCse: %s)", (hasCse) => {
		expect(getCompliancePathHref("corrective_action", hasCse)).toBe(
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it.each([
		true,
		false,
		null,
	])("routes joint_evaluation to the joint evaluation form (hasCse: %s)", (hasCse) => {
		expect(getCompliancePathHref("joint_evaluation", hasCse)).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("routes justify to the CSE opinion page when the company has a CSE", () => {
		expect(getCompliancePathHref("justify", true)).toBe("/avis-cse");
	});

	it.each([
		false,
		null,
	])("routes justify to the confirmation page without a CSE (hasCse: %s)", (hasCse) => {
		expect(getCompliancePathHref("justify", hasCse)).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});
});

describe("JustifyOption", () => {
	function renderJustifyOption(cseOpinionRequired: boolean) {
		return render(
			<JustifyOption
				checked={false}
				cseOpinionRequired={cseOpinionRequired}
				deadline={JUSTIFICATION_DEADLINE}
				onChange={vi.fn()}
			/>,
		);
	}

	it("lists the CSE consultation steps when a CSE opinion is required", () => {
		renderJustifyOption(true);

		expect(screen.getByText(JUSTIFY_CSE_CONSULT)).toBeInTheDocument();
		expect(screen.getByText(JUSTIFY_CSE_OPINION)).toBeInTheDocument();
	});

	it("renders no list at all when no CSE opinion is required", () => {
		const { container } = renderJustifyOption(false);

		expect(screen.queryByText(JUSTIFY_CSE_CONSULT)).not.toBeInTheDocument();
		expect(screen.queryByText(JUSTIFY_CSE_OPINION)).not.toBeInTheDocument();
		expect(container.querySelector("ul")).toBeNull();
	});

	it.each([
		true,
		false,
	])("keeps the option title and its justification intro (cseOpinionRequired: %s)", (cseOpinionRequired) => {
		renderJustifyOption(cseOpinionRequired);

		expect(
			screen.getByText("Justifier les écarts de rémunération ≥ 5 %"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Vous avez la possibilité de justifier vos écarts/),
		).toBeInTheDocument();
	});
});

describe("SecondRoundOptions", () => {
	function renderSecondRoundOptions(cseOpinionRequired: boolean) {
		const setSelectedPath = vi.fn();
		return {
			setSelectedPath,
			...render(
				<SecondRoundOptions
					cseOpinionRequired={cseOpinionRequired}
					jointEvaluationDeadline={JOINT_EVALUATION_DEADLINE}
					justificationDeadline={JUSTIFICATION_DEADLINE}
					selectedPath={undefined}
					setSelectedPath={setSelectedPath}
				/>,
			),
		};
	}

	it("reports the picked path to the parent", async () => {
		const user = userEvent.setup();
		const { setSelectedPath } = renderSecondRoundOptions(true);

		await user.click(
			screen.getByLabelText("Justifier les écarts de rémunération ≥ 5 %"),
		);
		expect(setSelectedPath).toHaveBeenCalledWith("justify");

		await user.click(
			screen.getByLabelText(
				"Mettre en place une évaluation conjointe des rémunérations",
			),
		);
		expect(setSelectedPath).toHaveBeenCalledWith("joint_evaluation");
	});

	it("forwards the CSE requirement to the justify option", () => {
		renderSecondRoundOptions(true);

		expect(screen.getByText(JUSTIFY_CSE_CONSULT)).toBeInTheDocument();
		expect(screen.getByText(JUSTIFY_CSE_OPINION)).toBeInTheDocument();
	});

	it("hides the CSE consultation steps when no CSE opinion is required", () => {
		const { container } = renderSecondRoundOptions(false);

		expect(screen.queryByText(JUSTIFY_CSE_CONSULT)).not.toBeInTheDocument();
		expect(screen.queryByText(JUSTIFY_CSE_OPINION)).not.toBeInTheDocument();
		expectNoEmptyList(container);
	});

	it.each([
		true,
		false,
	])("keeps the joint evaluation option and its steps (cseOpinionRequired: %s)", (cseOpinionRequired) => {
		renderSecondRoundOptions(cseOpinionRequired);

		expect(
			screen.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Analyse conjointe et définition des actions correctrices",
			),
		).toBeInTheDocument();
	});
});

describe("FirstRoundOptions", () => {
	function renderFirstRoundOptions(cseOpinionRequired: boolean) {
		return render(
			<FirstRoundOptions
				correctiveActionDeadline={CORRECTIVE_ACTION_DEADLINE}
				cseOpinionRequired={cseOpinionRequired}
				jointEvaluationDeadline={JOINT_EVALUATION_DEADLINE}
				justificationDeadline={JUSTIFICATION_DEADLINE}
				selectedPath={undefined}
				setSelectedPath={vi.fn()}
			/>,
		);
	}

	it("lists every CSE consultation step when a CSE opinion is required", () => {
		renderFirstRoundOptions(true);

		expect(screen.getByText(JUSTIFY_CSE_CONSULT)).toBeInTheDocument();
		expect(screen.getByText(JUSTIFY_CSE_OPINION)).toBeInTheDocument();
		expect(screen.getByText(CORRECTIVE_CSE_CONSULT)).toBeInTheDocument();
		expect(screen.getByText(CORRECTIVE_CSE_OPINION)).toBeInTheDocument();
	});

	it("hides every CSE consultation step when no CSE opinion is required", () => {
		const { container } = renderFirstRoundOptions(false);

		expect(screen.queryByText(JUSTIFY_CSE_CONSULT)).not.toBeInTheDocument();
		expect(screen.queryByText(JUSTIFY_CSE_OPINION)).not.toBeInTheDocument();
		expect(screen.queryByText(CORRECTIVE_CSE_CONSULT)).not.toBeInTheDocument();
		expect(screen.queryByText(CORRECTIVE_CSE_OPINION)).not.toBeInTheDocument();
		expectNoEmptyList(container);
	});

	it.each([
		true,
		false,
	])("keeps the non-CSE corrective action steps (cseOpinionRequired: %s)", (cseOpinionRequired) => {
		renderFirstRoundOptions(cseOpinionRequired);

		expect(screen.getByText(CORRECTIVE_ACTION_TITLE)).toBeInTheDocument();
		expect(
			screen.getByText(
				"Mettre en place des actions correctives par accord ou par plan d'action",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Redéclarer l'indicateur dans un délai de 6 mois après votre première déclaration",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Si des écarts non justifiés persistent/),
		).toBeInTheDocument();
	});

	it("renders the learn more links at body size, like the reference link above the options", () => {
		renderFirstRoundOptions(true);

		const learnMoreLinks = screen.getAllByRole("link", {
			name: /En savoir plus/,
		});

		expect(learnMoreLinks).toHaveLength(2);
		for (const link of learnMoreLinks) {
			expect(link).toHaveClass("fr-link");
			expect(link).not.toHaveClass("fr-text--sm");
		}
	});

	it("keeps « de salariés » on a single line with a non-breaking space", () => {
		renderFirstRoundOptions(true);

		expect(
			screen.getByText(/Vous souhaitez mettre en place des actions correctives/)
				.textContent,
		).toContain("par catégorie de\u00A0salariés");
	});
});
