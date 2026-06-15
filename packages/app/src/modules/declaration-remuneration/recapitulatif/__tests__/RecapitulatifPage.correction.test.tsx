import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecapitulatifPage } from "../RecapitulatifPage";
import {
	defaultProps,
	emptyStep2Data,
	emptyStep3Data,
	makeCategory,
} from "./fixtures";

describe("RecapitulatifPage — second declaration (isCorrection)", () => {
	it("renders the second-declaration h1 instead of the standard one", () => {
		render(<RecapitulatifPage {...defaultProps()} isCorrection />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Seconde déclaration des écarts de rémunération par catégorie de salariés 2025",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", {
				level: 1,
				name: /Déclaration des indicateurs de rémunération/,
			}),
		).not.toBeInTheDocument();
	});

	it("hides the A→F all-employees indicator section and its workforce table", () => {
		render(<RecapitulatifPage {...defaultProps()} isCorrection />);
		expect(
			screen.queryByRole("heading", {
				level: 2,
				name: /Indicateurs pour l.*ensemble de vos salariés/,
			}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", {
				level: 3,
				name: /Effectifs physiques pris en compte/,
			}),
		).not.toBeInTheDocument();
	});

	it("hides the A→F gap tables even when step2/step3/step4 data is provided", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				isCorrection
				step2Data={{
					...emptyStep2Data(),
					indicatorAAnnualWomen: "35050.21",
					indicatorAAnnualMen: "36739.82",
				}}
				step3Data={{
					...emptyStep3Data(),
					indicatorEWomen: "60",
					indicatorEMen: "70",
				}}
			/>,
		);
		expect(
			screen.queryByText("Annuelle brute moyenne"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", {
				level: 3,
				name: "Écart de rémunération",
			}),
		).not.toBeInTheDocument();
	});

	it("still renders the per-category indicator section", () => {
		render(
			<RecapitulatifPage
				{...defaultProps()}
				isCorrection
				step5Categories={[
					makeCategory({
						name: "Ouvriers / Employés",
						womenCount: 53,
						menCount: 25,
					}),
				]}
			/>,
		);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Indicateurs par catégorie de salariés",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Catégorie d'emplois n°1 : Ouvriers / Employés"),
		).toBeInTheDocument();
	});

	it("renders a secondary 'Mon espace' bottom action instead of the primary one", () => {
		render(<RecapitulatifPage {...defaultProps()} isCorrection />);
		const action = screen.getByRole("link", { name: "Mon espace" });
		expect(action).toHaveAttribute("href", "/mon-espace");
		expect(action.className).toContain("fr-btn--secondary");
		expect(action.className).not.toContain("fr-btn--primary");
		expect(
			screen.queryByRole("link", { name: "Retour à Mon Espace" }),
		).not.toBeInTheDocument();
	});
});
