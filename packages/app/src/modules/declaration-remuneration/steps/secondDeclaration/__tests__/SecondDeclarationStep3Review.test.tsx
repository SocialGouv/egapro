import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { SecondDeclarationStep3Review } from "../SecondDeclarationStep3Review";

const mockCategories: StepCategoryData[] = [
	{ name: "meta:source:autre" },
	{ name: "cat:0:name:Ingénieurs" },
	{ name: "cat:0:detail:Dev" },
	{ name: "cat:0:effectif", womenCount: 10, menCount: 15 },
	{ name: "cat:0:annual:base", womenValue: "3000", menValue: "3200" },
	{ name: "cat:0:annual:variable", womenValue: "500", menValue: "600" },
	{ name: "cat:0:hourly:base", womenValue: "18", menValue: "19" },
	{ name: "cat:0:hourly:variable", womenValue: "3", menValue: "4" },
];

describe("SecondDeclarationStep3Review", () => {
	it("renders the title and step indicator", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Étape 3 sur 3")).toBeInTheDocument();
	});

	it("renders category gap card with category name", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText(/Catégorie d.emplois n°1/)).toBeInTheDocument();
	});

	it("renders gap columns", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
	});

	it("renders the next steps section", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText("Prochaines étapes")).toBeInTheDocument();
	});

	it("renders certification checkbox", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.getByLabelText(/Je certifie que les données saisies/),
		).toBeInTheDocument();
	});

	it("disables submit button when not certified", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		const submitButton = screen.getByRole("button", { name: /soumettre/i });
		expect(submitButton).toBeDisabled();
	});

	it("enables submit button when certified", async () => {
		const user = userEvent.setup();
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		const checkbox = screen.getByLabelText(
			/Je certifie que les données saisies/,
		);
		await user.click(checkbox);
		const submitButton = screen.getByRole("button", { name: /soumettre/i });
		expect(submitButton).not.toBeDisabled();
	});

	it("renders previous link to step 2", () => {
		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/2",
		);
	});

	it("shows gap warning when gaps >= 5% exist", () => {
		const categoriesWithHighGaps: StepCategoryData[] = [
			{ name: "meta:source:autre" },
			{ name: "cat:0:name:Ouvriers" },
			{ name: "cat:0:detail:" },
			{ name: "cat:0:effectif", womenCount: 10, menCount: 15 },
			{ name: "cat:0:annual:base", womenValue: "1000", menValue: "2000" },
			{ name: "cat:0:annual:variable", womenValue: "100", menValue: "200" },
			{ name: "cat:0:hourly:base", womenValue: "10", menValue: "20" },
			{ name: "cat:0:hourly:variable", womenValue: "1", menValue: "2" },
		];

		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={categoriesWithHighGaps}
			/>,
		);
		expect(
			screen.getByText("Des écarts ont été de nouveau détectés"),
		).toBeInTheDocument();
	});

	it("does not show gap warning when all gaps < 5%", () => {
		const categoriesWithLowGaps: StepCategoryData[] = [
			{ name: "meta:source:autre" },
			{ name: "cat:0:name:Ouvriers" },
			{ name: "cat:0:detail:" },
			{ name: "cat:0:effectif", womenCount: 10, menCount: 15 },
			{ name: "cat:0:annual:base", womenValue: "9800", menValue: "10000" },
			{ name: "cat:0:annual:variable", womenValue: "980", menValue: "1000" },
			{ name: "cat:0:hourly:base", womenValue: "98", menValue: "100" },
			{ name: "cat:0:hourly:variable", womenValue: "9.8", menValue: "10" },
		];

		render(
			<SecondDeclarationStep3Review
				secondDeclarationCategories={categoriesWithLowGaps}
			/>,
		);
		expect(
			screen.queryByText("Des écarts ont été de nouveau détectés"),
		).not.toBeInTheDocument();
	});
});
