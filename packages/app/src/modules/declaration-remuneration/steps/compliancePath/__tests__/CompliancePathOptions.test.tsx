import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import {
	CompliancePathOptions,
	GapJustificationOptions,
} from "../CompliancePathOptions";

const JOINT_EVALUATION_DEADLINE = new Date("2027-05-01");
const CORRECTIVE_ACTION_DEADLINE = new Date("2027-09-01");

const ALL_TITLE = "Tous les écarts de rémunération ≥ 5 % sont justifiables";
const PARTIAL_TITLE =
	"Une partie des écarts de rémunération ≥ 5 % est justifiable";
const NONE_TITLE = "Aucun écart de rémunération ≥ 5 % n'est justifiable";
const CORRECTIVE_ACTION_TITLE =
	"Effectuer des actions correctives et une seconde déclaration";
const JOINT_EVALUATION_TITLE =
	"Mettre en place une évaluation conjointe des rémunérations";

const CSE_CONSULT =
	"Informer et consulter votre CSE sur la justification des écarts";
const CSE_OPINION = "Transmettre l'avis du CSE";
const NO_CSE_SENTENCE =
	"En l'absence de CSE, aucun avis n'est à transmettre : votre démarche est finalisée dès ce choix.";
const CORRECTIVE_ALTERNATIVE =
	"Soit effectuer des actions correctives et une seconde déclaration";
const JOINT_ALTERNATIVE =
	"Soit mettre en place une évaluation conjointe des rémunérations";
const JOINT_REPORT =
	"Élaborer le rapport de l'évaluation conjointe et le transmettre";
const JOINT_AGREEMENT =
	"Mettre en place un accord collectif ou, à défaut, un plan d'action contenant des actions correctives";

function expectNoEmptyList(container: HTMLElement) {
	const emptyLists = Array.from(container.querySelectorAll("ul")).filter(
		(list) => list.children.length === 0,
	);
	expect(emptyLists).toHaveLength(0);
}

function cardOf(title: string) {
	const option = screen
		.getByLabelText(title)
		.closest<HTMLElement>(".fr-fieldset__element");
	if (!option) throw new Error(`No option card for ${title}`);
	return within(option);
}

function renderJustifications(
	overrides: Partial<ComponentProps<typeof GapJustificationOptions>> = {},
) {
	return render(
		<GapJustificationOptions
			cseOpinionRequired={true}
			jointEvaluationDeadline={JOINT_EVALUATION_DEADLINE}
			onSelect={vi.fn()}
			round={1}
			selected={undefined}
			{...overrides}
		/>,
	);
}

function renderPaths(
	overrides: Partial<ComponentProps<typeof CompliancePathOptions>> = {},
) {
	return render(
		<CompliancePathOptions
			correctiveActionDeadline={CORRECTIVE_ACTION_DEADLINE}
			cseOpinionRequired={true}
			jointEvaluationDeadline={JOINT_EVALUATION_DEADLINE}
			onSelect={vi.fn()}
			paths={["corrective_action", "joint_evaluation"]}
			selectedPath={undefined}
			{...overrides}
		/>,
	);
}

describe("GapJustificationOptions", () => {
	it("renders the three qualifications as native radios with stable ids", () => {
		renderJustifications();

		expect(screen.getByLabelText(ALL_TITLE)).toHaveAttribute(
			"id",
			"gap-justification-all",
		);
		expect(screen.getByLabelText(PARTIAL_TITLE)).toHaveAttribute(
			"id",
			"gap-justification-partial",
		);
		expect(screen.getByLabelText(NONE_TITLE)).toHaveAttribute(
			"id",
			"gap-justification-none",
		);
		for (const radio of screen.getAllByRole("radio")) {
			expect(radio).toHaveAttribute("name", "gap-justification");
		}
	});

	it("checks the selected qualification", () => {
		renderJustifications({ selected: "partial" });

		expect(screen.getByLabelText(PARTIAL_TITLE)).toBeChecked();
		expect(screen.getByLabelText(ALL_TITLE)).not.toBeChecked();
	});

	it("reports each qualification the user picks", async () => {
		const onSelect = vi.fn();
		renderJustifications({ onSelect });

		await userEvent.click(screen.getByLabelText(NONE_TITLE));
		expect(onSelect).toHaveBeenCalledWith("none");
		await userEvent.click(screen.getByLabelText(ALL_TITLE));
		expect(onSelect).toHaveBeenCalledWith("all");
		await userEvent.click(screen.getByLabelText(PARTIAL_TITLE));
		expect(onSelect).toHaveBeenCalledWith("partial");
	});

	it("disables every qualification when asked", () => {
		renderJustifications({ disabled: true });

		for (const radio of screen.getAllByRole("radio")) {
			expect(radio).toBeDisabled();
		}
	});

	it("describes each qualification with the objective criteria wording", () => {
		renderJustifications();

		expect(
			cardOf(ALL_TITLE).getByText(
				"Tous les écarts sont justifiables par des critères objectifs et non fondés sur le sexe.",
			),
		).toBeInTheDocument();
		expect(
			cardOf(PARTIAL_TITLE).getByText(
				"Certains écarts sont justifiables par des critères objectifs et non fondés sur le sexe.",
			),
		).toBeInTheDocument();
		expect(
			cardOf(NONE_TITLE).getByText(
				"Aucun des écarts n'est justifiable par des critères objectifs et non fondés sur le sexe.",
			),
		).toBeInTheDocument();
	});

	describe("with a CSE opinion due", () => {
		it("lists the CSE steps under all and partial, never under none", () => {
			renderJustifications();

			const all = cardOf(ALL_TITLE);
			expect(all.getByText("Vous devrez").tagName).toBe("STRONG");
			expect(all.getByText(CSE_CONSULT)).toBeInTheDocument();
			expect(all.getByText(CSE_OPINION)).toBeInTheDocument();
			expect(all.queryByText(NO_CSE_SENTENCE)).not.toBeInTheDocument();

			const partial = cardOf(PARTIAL_TITLE);
			expect(
				partial.getByText("Pour les écarts justifiables, vous devrez :")
					.tagName,
			).toBe("STRONG");
			expect(partial.getByText(CSE_CONSULT)).toBeInTheDocument();
			expect(partial.getByText(CSE_OPINION)).toBeInTheDocument();

			expect(cardOf(NONE_TITLE).queryByText(CSE_CONSULT)).toBeNull();
		});
	});

	describe("without a CSE opinion due", () => {
		it("drops every CSE step and tells that the justification ends the procedure", () => {
			const { container } = renderJustifications({
				cseOpinionRequired: false,
			});

			expect(screen.queryByText(CSE_CONSULT)).not.toBeInTheDocument();
			expect(screen.queryByText(CSE_OPINION)).not.toBeInTheDocument();
			expect(
				screen.queryByText("Pour les écarts justifiables, vous devrez :"),
			).not.toBeInTheDocument();
			expect(cardOf(ALL_TITLE).getByText(NO_CSE_SENTENCE)).toBeInTheDocument();
			expectNoEmptyList(container);
		});
	});

	describe("at round 1", () => {
		it("offers the choice between corrective actions and joint evaluation for unjustified gaps, without deadline nor link", () => {
			renderJustifications({ round: 1 });

			const partial = cardOf(PARTIAL_TITLE);
			expect(
				partial.getByText(
					"Pour les écarts non justifiables, vous devrez au choix :",
				).tagName,
			).toBe("STRONG");
			expect(partial.getByText(CORRECTIVE_ALTERNATIVE)).toBeInTheDocument();
			expect(partial.getByText(JOINT_ALTERNATIVE)).toBeInTheDocument();

			const none = cardOf(NONE_TITLE);
			expect(none.getByText("Vous devrez au choix").tagName).toBe("STRONG");
			expect(none.getByText(CORRECTIVE_ALTERNATIVE)).toBeInTheDocument();
			expect(none.getByText(JOINT_ALTERNATIVE)).toBeInTheDocument();

			expect(screen.queryByText(/Échéance/)).not.toBeInTheDocument();
			expect(screen.queryByRole("link")).not.toBeInTheDocument();
		});
	});

	describe("at round 2", () => {
		it("leads unjustified gaps to the joint evaluation, with its report deadline and link", () => {
			renderJustifications({ round: 2 });

			const partial = cardOf(PARTIAL_TITLE);
			expect(
				partial.getByText("Pour les écarts non justifiables, vous devrez :")
					.tagName,
			).toBe("STRONG");
			expect(partial.getByText(JOINT_REPORT)).toBeInTheDocument();
			expect(partial.getByText(JOINT_AGREEMENT)).toBeInTheDocument();
			expect(
				partial.getByText("Échéance de dépôt du rapport : 1ᵉʳ mai 2027"),
			).toBeInTheDocument();
			expect(
				partial.getByRole("link", {
					name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
				}),
			).toHaveAttribute("target", "_blank");

			const none = cardOf(NONE_TITLE);
			expect(none.getByText("Vous devrez").tagName).toBe("STRONG");
			expect(none.getByText(JOINT_REPORT)).toBeInTheDocument();
			expect(
				none.getByText("Échéance de dépôt du rapport : 1ᵉʳ mai 2027"),
			).toBeInTheDocument();

			expect(cardOf(ALL_TITLE).queryByText(/Échéance/)).toBeNull();
			expect(
				screen.queryByText(CORRECTIVE_ALTERNATIVE),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/actions correctives et une seconde déclaration/),
			).not.toBeInTheDocument();
		});
	});
});

describe("CompliancePathOptions", () => {
	it("keeps the stable ids of the two path radios", () => {
		renderPaths();

		expect(screen.getByLabelText(CORRECTIVE_ACTION_TITLE)).toHaveAttribute(
			"id",
			"path-corrective",
		);
		expect(screen.getByLabelText(JOINT_EVALUATION_TITLE)).toHaveAttribute(
			"id",
			"path-joint",
		);
	});

	it("renders only the offered paths", () => {
		renderPaths({ paths: ["joint_evaluation"] });

		expect(
			screen.queryByLabelText(CORRECTIVE_ACTION_TITLE),
		).not.toBeInTheDocument();
		expect(screen.getByLabelText(JOINT_EVALUATION_TITLE)).toBeInTheDocument();
	});

	it("checks the selected path", () => {
		renderPaths({ selectedPath: "corrective_action" });

		expect(screen.getByLabelText(CORRECTIVE_ACTION_TITLE)).toBeChecked();
		expect(screen.getByLabelText(JOINT_EVALUATION_TITLE)).not.toBeChecked();
	});

	it("reports each path the user picks", async () => {
		const onSelect = vi.fn();
		renderPaths({ onSelect });

		await userEvent.click(screen.getByLabelText(JOINT_EVALUATION_TITLE));
		expect(onSelect).toHaveBeenCalledWith("joint_evaluation");
		await userEvent.click(screen.getByLabelText(CORRECTIVE_ACTION_TITLE));
		expect(onSelect).toHaveBeenCalledWith("corrective_action");
	});

	it("lists the four corrective-action obligations in the mock-up order when a CSE opinion is due", () => {
		renderPaths();

		const corrective = cardOf(CORRECTIVE_ACTION_TITLE);
		expect(
			corrective.getAllByRole("listitem").map((item) => item.textContent),
		).toEqual([
			"Mettre en place des actions correctives par accord ou par plan d'action",
			"Informer et consulter votre CSE sur l'exactitude des données et éventuellement, sur la justification des écarts ≥ 5 %",
			"Redéclarer l'indicateur dans un délai de 6 mois après votre première déclaration",
			"Transmettre l'avis ou les avis du CSE",
		]);
		expect(
			corrective.getByText(
				"Si des écarts non justifiés persistent à l'issue de la seconde déclaration, vous devrez engager une évaluation conjointe des rémunérations.",
			),
		).toBeInTheDocument();
		expect(
			corrective.getByText("Échéance de déclaration : 1ᵉʳ septembre 2027"),
		).toBeInTheDocument();
		expect(
			corrective.getByRole("link", {
				name: /En savoir plus sur les actions correctives et seconde déclaration/,
			}),
		).toBeInTheDocument();
	});

	it("drops the CSE obligations of the corrective actions without a CSE", () => {
		renderPaths({ cseOpinionRequired: false });

		expect(
			cardOf(CORRECTIVE_ACTION_TITLE)
				.getAllByRole("listitem")
				.map((item) => item.textContent),
		).toEqual([
			"Mettre en place des actions correctives par accord ou par plan d'action",
			"Redéclarer l'indicateur dans un délai de 6 mois après votre première déclaration",
		]);
	});

	it("describes the joint evaluation with its report deadline and link", () => {
		renderPaths();

		const joint = cardOf(JOINT_EVALUATION_TITLE);
		expect(joint.getByText("Vous devrez").tagName).toBe("STRONG");
		expect(
			joint.getAllByRole("listitem").map((item) => item.textContent),
		).toEqual([JOINT_REPORT, JOINT_AGREEMENT]);
		expect(
			joint.getByText("Échéance de dépôt du rapport : 1ᵉʳ mai 2027"),
		).toBeInTheDocument();
		expect(
			joint.getByRole("link", {
				name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
			}),
		).toBeInTheDocument();
	});

	it("renders the learn more links at body size, like the reference link above the options", () => {
		renderPaths();

		const learnMoreLinks = screen.getAllByRole("link", {
			name: /En savoir plus/,
		});

		expect(learnMoreLinks).toHaveLength(2);
		for (const link of learnMoreLinks) {
			expect(link).toHaveClass("fr-link");
			expect(link).not.toHaveClass("fr-text--sm");
		}
	});

	it("disables both paths when asked", () => {
		renderPaths({ disabled: true });

		expect(screen.getByLabelText(CORRECTIVE_ACTION_TITLE)).toBeDisabled();
		expect(screen.getByLabelText(JOINT_EVALUATION_TITLE)).toBeDisabled();
	});
});
