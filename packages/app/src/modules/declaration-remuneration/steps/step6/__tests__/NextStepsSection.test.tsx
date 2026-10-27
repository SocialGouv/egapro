import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextStepsSection } from "../NextStepsSection";

const SIREN = "532847196";

vi.mock("~/modules/auth", () => ({
	useReadOnlyGuard: () => ({
		buttonProps: {},
		isReadOnly: false,
		tooltip: null,
	}),
}));

vi.mock("~/modules/my-space/useUpdateHasCse", () => ({
	useUpdateHasCse: () => ({ mutate: vi.fn(), isPending: false }),
}));

type Overrides = Partial<{
	workforce: number | null;
	indicatorGRequired: boolean;
	hasSignificantIndicatorGGap: boolean;
	cseApplicable: boolean;
	cseOpinionRequired: boolean;
	siren: string;
}>;

function renderSection(overrides: Overrides = {}) {
	return render(
		<NextStepsSection
			cseApplicable={false}
			cseOpinionRequired={false}
			hasSignificantIndicatorGGap={false}
			indicatorGRequired={false}
			siren={SIREN}
			workforce={30}
			{...overrides}
		/>,
	);
}

describe("NextStepsSection", () => {
	it("< 50: shows only the afterward block with its negotiation link", () => {
		renderSection({
			hasSignificantIndicatorGGap: true,
			indicatorGRequired: true,
			workforce: 30,
		});

		expect(
			screen.getByRole("heading", { name: "Et après ?" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Si votre entreprise présente des écarts ≥ 5 %/),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /La négociation collective en entreprise/,
			}),
		).toHaveAttribute(
			"href",
			"https://travail-emploi.gouv.fr/la-negociation-collective-en-entreprise-en-faveur-de-legalite-professionnelle",
		);
		expect(
			screen.queryByText("Rappel : Informer le CSE"),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Écarts détectés")).not.toBeInTheDocument();
	});

	it("absent from the GIP file (null workforce) is treated as the voluntary tier", () => {
		renderSection({ workforce: null });

		expect(
			screen.getByRole("heading", { name: "Et après ?" }),
		).toBeInTheDocument();
	});

	it("50-99 without indicator G: shows CSE-inform then afterward, separated by a divider", () => {
		const { container } = renderSection({
			indicatorGRequired: false,
			workforce: 60,
		});

		expect(
			screen.getByRole("heading", { name: "Rappel : Informer le CSE" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/obligatoirement informer le CSE sur l'exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de chaque indicateur\./,
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Et après ?" }),
		).toBeInTheDocument();
		expect(container.querySelectorAll("hr")).toHaveLength(1);
	});

	it("50-99 with indicator G and a significant gap: shows CSE-inform then gap-remediation, not afterward", () => {
		renderSection({
			hasSignificantIndicatorGGap: true,
			indicatorGRequired: true,
			workforce: 60,
		});

		expect(
			screen.getByRole("heading", { name: "Rappel : Informer le CSE" }),
		).toBeInTheDocument();
		expect(screen.getByText("Écarts détectés")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: "Prochaines étapes : Actions à engager",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/Votre entreprise présente des écarts ≥ 5 % pour l'indicateur par catégorie d'emploi/,
			),
		).toBeInTheDocument();
		expect(screen.queryByText("Et après ?")).not.toBeInTheDocument();
	});

	// No dedicated Figma frame for this combination — falls back to the 6-indicator blocks.
	it("50-99 with indicator G but no significant gap falls back to CSE-inform + afterward", () => {
		renderSection({
			hasSignificantIndicatorGGap: false,
			indicatorGRequired: true,
			workforce: 60,
		});

		expect(
			screen.getByRole("heading", { name: "Rappel : Informer le CSE" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Et après ?" }),
		).toBeInTheDocument();
		expect(screen.queryByText("Écarts détectés")).not.toBeInTheDocument();
	});

	it("100-249 without indicator G: shows only the CSE-inform-and-consult block", () => {
		renderSection({
			cseApplicable: true,
			cseOpinionRequired: true,
			indicatorGRequired: false,
			workforce: 150,
		});

		expect(
			screen.getByRole("heading", {
				name: "Rappel : Informer et consulter le CSE",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(/L'avis du CSE devra être transmis/),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Les modèles d'avis du CSE ne sont pas encore disponibles.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Mettre à jour l'existence d'un CSE",
			}),
		).toBeInTheDocument();
		expect(screen.queryByText("Écarts détectés")).not.toBeInTheDocument();
		expect(screen.queryByText("Pour vous aider")).not.toBeInTheDocument();
	});

	it(">= 100 with indicator G and a significant gap: shows CSE-inform-and-consult, the compliance-process block and its help links", () => {
		const { container } = renderSection({
			cseApplicable: true,
			cseOpinionRequired: true,
			hasSignificantIndicatorGGap: true,
			indicatorGRequired: true,
			workforce: 300,
		});

		expect(
			screen.getByRole("heading", {
				name: "Rappel : Informer et consulter le CSE",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Écarts détectés")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: "Prochaines étapes : Actions à engager",
			}),
		).toBeInTheDocument();
		// "écarts ≥ 5 %" is in a nested <strong>, so the sentence spans two text nodes — assert each fragment.
		expect(
			screen.getByText(
				/À la suite de l'analyse de vos données de l'indicateur par catégorie d'emploi, des/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("écarts ≥ 5 %").tagName).toBe("STRONG");
		expect(screen.getByText(/ont été identifiés/)).toBeInTheDocument();
		expect(
			screen.getByText(
				/En cas de justification d'au moins un écart par des critères objectifs et non fondés sur le sexe/,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(/En cas d'absence de justification d'au moins un écart/),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Effectuer des actions correctives et une seconde déclaration dans un délai de 6 mois",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Mettre en place une évaluation conjointe des rémunérations",
			),
		).toBeInTheDocument();

		expect(screen.getByText("Pour vous aider")).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /Qu'entend-on par critères objectifs et non fondés sur le sexe \?/,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur actions correctives et seconde déclaration/,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur évaluation conjointe des rémunérations/,
			}),
		).toBeInTheDocument();

		// One divider between the two top-level blocks, one more before "Pour vous aider".
		expect(container.querySelectorAll("hr")).toHaveLength(2);
	});

	it(">= 100 with indicator G but no significant gap: shows only the CSE-inform-and-consult block", () => {
		renderSection({
			cseApplicable: true,
			cseOpinionRequired: true,
			hasSignificantIndicatorGGap: false,
			indicatorGRequired: true,
			workforce: 300,
		});

		expect(
			screen.getByRole("heading", {
				name: "Rappel : Informer et consulter le CSE",
			}),
		).toBeInTheDocument();
		expect(screen.queryByText("Écarts détectés")).not.toBeInTheDocument();
		expect(screen.queryByText("Pour vous aider")).not.toBeInTheDocument();
	});

	it("ignores a stale significant-gap flag when indicator G does not apply this year", () => {
		renderSection({
			cseApplicable: true,
			cseOpinionRequired: true,
			hasSignificantIndicatorGGap: true,
			indicatorGRequired: false,
			workforce: 300,
		});

		expect(screen.queryByText("Écarts détectés")).not.toBeInTheDocument();
	});

	describe("CSE consultation gating at >= 100 employees (issue #3945 carried over)", () => {
		it.each([
			false,
			null,
		] as const)("hides the consultation text but keeps the update-CSE button when cseOpinionRequired is %s", (cseOpinionRequired) => {
			renderSection({
				cseApplicable: true,
				cseOpinionRequired: Boolean(cseOpinionRequired),
				workforce: 300,
			});

			expect(
				screen.queryByRole("heading", {
					name: "Rappel : Informer et consulter le CSE",
				}),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(/obligatoirement informer et consulter le CSE/),
			).not.toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Mettre à jour l'existence d'un CSE",
				}),
			).toBeInTheDocument();
		});

		it("shows the full consultation text when cseOpinionRequired is true", () => {
			renderSection({
				cseApplicable: true,
				cseOpinionRequired: true,
				workforce: 300,
			});

			expect(
				screen.getByRole("heading", {
					name: "Rappel : Informer et consulter le CSE",
				}),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Mettre à jour l'existence d'un CSE",
				}),
			).toBeInTheDocument();
		});
	});

	it("only opens the update-CSE modal from a block that actually offers the button", () => {
		renderSection({ workforce: 30 });

		expect(
			screen.queryByRole("heading", {
				hidden: true,
				name: "Mettre à jour la présence d'un CSE",
			}),
		).not.toBeInTheDocument();
	});
});
