import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
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

function renderStep2(
	overrides: Partial<ComponentProps<typeof SecondDeclarationStep2Form>> = {},
) {
	return render(
		<SecondDeclarationStep2Form
			declarationSiren="123456789"
			declarationYear={2025}
			initialFirstDeclarationCategories={mockCategories}
			status="corrective_actions_chosen"
			{...overrides}
		/>,
	);
}

describe("SecondDeclarationStep2Form", () => {
	it("renders the title and step indicator", () => {
		renderStep2();
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégorie de salariés/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Étape 2 sur 3")).toBeInTheDocument();
	});

	it("displays category label as read-only text", () => {
		renderStep2();
		// The category label is now carried by the accordion heading and the
		// table <caption> (RGAA 5.2) — no redundant read-only <p>, no editable input.
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Ouvriers",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByLabelText("Libellé de la catégorie d'emploi"),
		).not.toBeInTheDocument();
	});

	it("displays source as read-only text", () => {
		renderStep2({ initialSource: "accord-entreprise" });
		expect(
			screen.getByText(/Source utilisée pour déterminer/),
		).toBeInTheDocument();
		expect(screen.getByText("Accord d'entreprise")).toBeInTheDocument();
		expect(
			screen.queryByLabelText(/Quelle est la source/),
		).not.toBeInTheDocument();
	});

	it("renders reference period date pickers", () => {
		renderStep2();
		expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date de fin/)).toBeInTheDocument();
		expect(
			screen.queryByText(/Période de référence pour le calcul des indicateurs/),
		).not.toBeInTheDocument();
	});

	it("does not render add category button (read-only categories)", () => {
		renderStep2();
		expect(
			screen.queryByRole("button", { name: /Ajouter une catégorie/ }),
		).not.toBeInTheDocument();
	});

	it("renders previous link to step 1", () => {
		renderStep2();
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("uses second declaration data when available", () => {
		const secondDeclData: EmployeeCategoryRow[] = [
			makeCategory({
				name: "Techniciens",
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

		renderStep2({ initialSecondDeclarationCategories: secondDeclData });
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Techniciens",
			}),
		).toBeInTheDocument();
	});

	it("keeps Suivant as a submit button while the second declaration is writable", () => {
		renderStep2();
		expect(
			screen.getByRole("button", { name: /suivant/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("renders Suivant as a recap link when the second declaration is no longer writable", () => {
		renderStep2({ status: "revised_joint_evaluation_chosen" });
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/3",
		);
		expect(
			screen.queryByRole("button", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("disables the reference period pickers when the second declaration is no longer writable", () => {
		renderStep2({ status: "revised_joint_evaluation_chosen" });
		expect(screen.getByLabelText(/Date de début/)).toBeDisabled();
		expect(screen.getByLabelText(/Date de fin/)).toBeDisabled();
	});
});
