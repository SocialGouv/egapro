import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { SecondDeclarationStep2Form } from "../SecondDeclarationStep2Form";

const mockCategories: StepCategoryData[] = [
	{ name: "meta:source:convention-collective" },
	{ name: "cat:0:name:Ouvriers" },
	{ name: "cat:0:detail:Opérateurs de production" },
	{ name: "cat:0:effectif", womenCount: 50, menCount: 60 },
	{ name: "cat:0:annual:base", womenValue: "19114", menValue: "24383" },
	{ name: "cat:0:annual:variable", womenValue: "2132", menValue: "1802" },
	{ name: "cat:0:hourly:base", womenValue: "18.88", menValue: "16.73" },
	{ name: "cat:0:hourly:variable", womenValue: "1.04", menValue: "1.02" },
];

describe("SecondDeclarationStep2Form", () => {
	it("renders the title and step indicator", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Étape 2 sur 3")).toBeInTheDocument();
	});

	it("displays category name as read-only text", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText("Nom :")).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Ouvriers",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Ouvriers")).toBeInTheDocument(); // read-only name text
		expect(screen.queryByLabelText("Nom")).not.toBeInTheDocument();
	});

	it("displays detail as read-only text", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText("Opérateurs de production")).toBeInTheDocument();
		expect(
			screen.queryByLabelText("Détail des emplois"),
		).not.toBeInTheDocument();
	});

	it("displays source as read-only text", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.getByText(/Source utilisée pour déterminer/),
		).toBeInTheDocument();
		expect(screen.getByText("Convention collective")).toBeInTheDocument();
		expect(
			screen.queryByLabelText(/Quelle est la source/),
		).not.toBeInTheDocument();
	});

	it("renders reference period date pickers", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date de fin/)).toBeInTheDocument();
		// Should NOT show the static period text from step 5
		expect(
			screen.queryByText(/Période de référence pour le calcul des indicateurs/),
		).not.toBeInTheDocument();
	});

	it("does not render add category button (read-only categories)", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(
			screen.queryByRole("button", { name: /Ajouter une catégorie/ }),
		).not.toBeInTheDocument();
	});

	it("renders previous link to step 1", () => {
		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("uses second declaration data when available", () => {
		const secondDeclData: StepCategoryData[] = [
			{ name: "meta:source:accord-entreprise" },
			{ name: "cat:0:name:Techniciens" },
			{ name: "cat:0:detail:Senior" },
			{ name: "cat:0:effectif", womenCount: 30, menCount: 40 },
			{ name: "cat:0:annual:base", womenValue: "25000", menValue: "26000" },
			{ name: "cat:0:annual:variable", womenValue: "3000", menValue: "3200" },
			{ name: "cat:0:hourly:base", womenValue: "20", menValue: "21" },
			{ name: "cat:0:hourly:variable", womenValue: "2", menValue: "2.5" },
		];

		render(
			<SecondDeclarationStep2Form
				initialFirstDeclarationCategories={mockCategories}
				initialSecondDeclarationCategories={secondDeclData}
			/>,
		);
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Techniciens",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Techniciens")).toBeInTheDocument(); // read-only name text
	});
});
