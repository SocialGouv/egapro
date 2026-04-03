import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getDefaultCampaignDeadlines } from "~/modules/domain";
import type { PanelVariant } from "../DeclarationProcessPanel";
import { DeclarationProcessPanel } from "../DeclarationProcessPanel";

const BASE_PROPS = {
	campaignDeadlines: getDefaultCampaignDeadlines(2027),
	year: 2027,
	lastActionDate: "12 mars 2026" as string | null,
	compliancePath: null as string | null,
	secondDeclarationStatus: null as string | null,
	siren: "532847196",
	ctaHref: "/declaration-remuneration?siren=532847196",
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
	const dialog = container.querySelector("dialog") as HTMLElement;
	return { panel: within(dialog), dialog };
}

describe("DeclarationProcessPanel", () => {
	describe("variant: start", () => {
		it("renders the title with year", () => {
			const { panel } = renderPanel("start");
			expect(
				panel.getByText("Démarche des indicateurs de rémunération 2027"),
			).toBeInTheDocument();
		});

		it("renders the last action date", () => {
			const { panel } = renderPanel("start");
			expect(
				panel.getByText("Dernière action le 12 mars 2026"),
			).toBeInTheDocument();
		});

		it("renders the info alert", () => {
			const { panel } = renderPanel("start");
			expect(
				panel.getByText(/Vous devez au préalable disposer/),
			).toBeInTheDocument();
		});

		it("renders step 1 details with bullet points", () => {
			const { panel } = renderPanel("start");
			expect(
				panel.getByText(/Indicateurs pré-remplis à vérifier/),
			).toBeInTheDocument();
			expect(
				panel.getByText(
					/Indicateurs de rémunération par catégorie de salariés à remplir/,
				),
			).toBeInTheDocument();
		});

		it("renders the CTA link with correct href", () => {
			const { dialog } = renderPanel("start");
			const cta = dialog.querySelector("a.fr-btn");
			expect(cta).toHaveAttribute(
				"href",
				"/declaration-remuneration?siren=532847196",
			);
			expect(cta).toHaveTextContent("Commencer la déclaration");
		});

		it("renders help section buttons", () => {
			const { dialog } = renderPanel("start");
			const buttons = dialog.querySelectorAll("button.fr-link");
			const texts = [...buttons].map((b) => b.textContent);
			expect(texts).toContain("Détail des étapes");
			expect(texts).toContain("Centre d'aide");
		});
	});

	describe("variant: compliance", () => {
		it("renders transmitted declaration message", () => {
			const { panel } = renderPanel("compliance");
			expect(
				panel.getByText("Votre déclaration a été transmise"),
			).toBeInTheDocument();
		});

		it("renders actions correctives bullet", () => {
			const { panel } = renderPanel("compliance");
			expect(
				panel.getByText("Actions correctives et seconde déclaration"),
			).toBeInTheDocument();
		});

		it("does not render info alert", () => {
			const { panel } = renderPanel("compliance");
			expect(
				panel.queryByText(/Vous devez au préalable disposer/),
			).not.toBeInTheDocument();
		});
	});

	describe("variant: evaluation", () => {
		it("renders second declaration transmitted message", () => {
			const { panel } = renderPanel("evaluation");
			expect(
				panel.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
		});

		it("renders evaluation conjointe bullet", () => {
			const { panel } = renderPanel("evaluation");
			expect(
				panel.getByText("Évaluation conjointe des rémunérations"),
			).toBeInTheDocument();
		});
	});

	describe("variant: cse", () => {
		it("renders CSE deposit step with deadline", () => {
			const { panel } = renderPanel("cse", {
				compliancePath: "corrective_action",
			});
			expect(
				panel.getByText("Déposer le ou les avis du CSE"),
			).toBeInTheDocument();
		});

		it("renders justification bullet for justify path", () => {
			const { panel } = renderPanel("cse", { compliancePath: "justify" });
			expect(
				panel.getByText("Justification des écarts de rémunération"),
			).toBeInTheDocument();
		});

		it("renders second declaration when submitted, even with justify path", () => {
			const { panel } = renderPanel("cse", {
				compliancePath: "justify",
				secondDeclarationStatus: "submitted",
			});
			expect(
				panel.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
			expect(
				panel.getByText("Justification des écarts de rémunération"),
			).toBeInTheDocument();
		});

		it("renders evaluation conjointe for joint_evaluation path", () => {
			const { panel } = renderPanel("cse", {
				compliancePath: "joint_evaluation",
			});
			expect(
				panel.getByText(
					"Votre rapport de l'évaluation conjointe a été transmis",
				),
			).toBeInTheDocument();
		});

		it("renders second declaration and evaluation conjointe for corrective_action path", () => {
			const { panel } = renderPanel("cse", {
				compliancePath: "corrective_action",
				secondDeclarationStatus: "submitted",
			});
			expect(
				panel.getByText("Votre seconde déclaration a été transmise"),
			).toBeInTheDocument();
		});

		it("does not render second declaration when not submitted", () => {
			const { panel } = renderPanel("cse", {
				compliancePath: "corrective_action",
				secondDeclarationStatus: null,
			});
			expect(
				panel.queryByText("Votre seconde déclaration a été transmise"),
			).not.toBeInTheDocument();
		});
	});

	describe("variant: closed", () => {
		it("renders the closed message", () => {
			const { panel } = renderPanel("closed");
			expect(panel.getByText("Démarche close")).toBeInTheDocument();
			expect(
				panel.getByText(
					"Cette démarche est terminée, aucune modification n'est possible.",
				),
			).toBeInTheDocument();
		});

		it('renders "Voir la déclaration" CTA', () => {
			const { dialog } = renderPanel("closed");
			const cta = dialog.querySelector("a.fr-btn");
			expect(cta).toHaveTextContent("Voir la déclaration");
		});
	});

	it("does not render last action date when null", () => {
		const { panel } = renderPanel("start", { lastActionDate: null });
		expect(panel.queryByText(/Dernière action/)).not.toBeInTheDocument();
	});
});
