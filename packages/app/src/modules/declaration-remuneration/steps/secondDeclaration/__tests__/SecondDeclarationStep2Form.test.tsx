import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { SecondDeclarationStep2Form } from "../SecondDeclarationStep2Form";

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateEmployeeCategories: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		detail: "",
		womenCount: null,
		menCount: null,
		annualBaseWomen: null,
		annualBaseMen: null,
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		...overrides,
	};
}

const mockCategories: EmployeeCategoryRow[] = [
	makeCategory({
		name: "Ouvriers",
		detail: "Opérateurs de production",
		womenCount: 50,
		menCount: 60,
		annualBaseWomen: "19114",
		annualBaseMen: "24383",
		annualVariableWomen: "2132",
		annualVariableMen: "1802",
		hourlyBaseWomen: "18.88",
		hourlyBaseMen: "16.73",
		hourlyVariableWomen: "1.04",
		hourlyVariableMen: "1.02",
	}),
];

describe("SecondDeclarationStep2Form", () => {
	it("renders the title and step indicator", () => {
		render(
			<SecondDeclarationStep2Form
				declarationYear={2025}
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
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByText("Nom :")).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Ouvriers",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Ouvriers")).toBeInTheDocument();
		expect(screen.queryByLabelText("Nom")).not.toBeInTheDocument();
	});

	it("displays detail as read-only text", () => {
		render(
			<SecondDeclarationStep2Form
				declarationYear={2025}
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
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
				initialSource="convention-collective"
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
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date de fin/)).toBeInTheDocument();
		expect(
			screen.queryByText(/Période de référence pour le calcul des indicateurs/),
		).not.toBeInTheDocument();
	});

	it("does not render add category button (read-only categories)", () => {
		render(
			<SecondDeclarationStep2Form
				declarationYear={2025}
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
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("uses second declaration data when available", () => {
		const secondDeclData: EmployeeCategoryRow[] = [
			makeCategory({
				name: "Techniciens",
				detail: "Senior",
				womenCount: 30,
				menCount: 40,
				annualBaseWomen: "25000",
				annualBaseMen: "26000",
				annualVariableWomen: "3000",
				annualVariableMen: "3200",
				hourlyBaseWomen: "20",
				hourlyBaseMen: "21",
				hourlyVariableWomen: "2",
				hourlyVariableMen: "2.5",
			}),
		];

		render(
			<SecondDeclarationStep2Form
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
				initialSecondDeclarationCategories={secondDeclData}
			/>,
		);
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Techniciens",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Techniciens")).toBeInTheDocument();
	});
});
