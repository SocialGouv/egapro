import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { Step5EmployeeCategories } from "../Step5EmployeeCategories";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateEmployeeCategories: {
				useMutation: () => ({
					mutate: mockMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

beforeEach(() => {
	mockMutate.mockClear();
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

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

describe("Step5EmployeeCategories", () => {
	it("renders with 1 empty category by default", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(
			screen.getByRole("button", { name: "Catégorie d'emplois n°1" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Catégorie d'emplois n°2" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 1")).toBeInTheDocument();
	});

	it("renders stepper at step 5", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(screen.getByText("Étape 5 sur 6")).toBeInTheDocument();
	});

	it("renders description text and reference period", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(
			screen.getByText(/mesurer l'écart de rémunération/),
		).toBeInTheDocument();
		expect(screen.getByText(/Période de référence/)).toBeInTheDocument();
	});

	it("renders source dropdown", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(
			screen.getByLabelText(/Quelle est la source utilisée/),
		).toBeInTheDocument();
		expect(screen.getByText("Sélectionner une option")).toBeInTheDocument();
	});

	it("renders instruction text", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(
			screen.getByText(/Saisissez les données manquantes/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders table headers for the category", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(screen.getAllByText("Femmes").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Hommes").length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Seuil réglementaire : 5%").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders table section headers", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(
			screen.getAllByText("Nombre de salariés [Nombre total]").length,
		).toBe(1);
		expect(screen.getAllByText("Rémunération annuelle brute").length).toBe(1);
		expect(screen.getAllByText("Rémunération horaire brute").length).toBe(1);
	});

	it("renders name and detail input fields for category", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(document.getElementById("cat-0-name")).toBeInTheDocument();
		expect(document.getElementById("cat-0-detail")).toBeInTheDocument();
	});

	it("can add a new category", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		await user.click(
			screen.getByRole("button", {
				name: /ajouter une catégorie/i,
			}),
		);

		expect(
			screen.getByRole("button", { name: "Catégorie d'emplois n°2" }),
		).toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 2")).toBeInTheDocument();
	});

	it("can remove a category after confirmation", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		// Add a second category first
		await user.click(
			screen.getByRole("button", { name: /ajouter une catégorie/i }),
		);
		expect(screen.getByText("Nombre de catégories : 2")).toBeInTheDocument();

		// Click delete on first category — opens confirmation dialog
		const deleteButtons = screen.getAllByRole("button", {
			name: /supprimer/i,
		});
		await user.click(deleteButtons[0] as HTMLElement);

		// Confirm deletion in dialog
		const dialog = document.querySelector(
			'dialog[aria-labelledby="delete-category-title"]',
		) as HTMLElement;
		expect(dialog).toBeInTheDocument();
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Supprimer"));

		expect(
			screen.queryByRole("button", { name: "Catégorie d'emplois n°2" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 1")).toBeInTheDocument();
	});

	it("updates input fields and computes gap", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		const annualBaseWomenInput = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);
		const annualBaseMenInput = screen.getByLabelText(
			"Salaire de base annuel hommes, catégorie 1",
		);

		await user.type(annualBaseWomenInput, "95");
		await user.type(annualBaseMenInput, "100");

		// Gap = |((100-95)/100)*100| = 5.0 % (appears in both category tables)
		expect(screen.getAllByText(/5,0/).length).toBeGreaterThanOrEqual(1);
	});

	it("accepts salary values above 9999", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		const input = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);

		await user.type(input, "25000");
		expect(input).toHaveValue("25000");
	});

	it("rejects negative values in number inputs", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		const input = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);

		await user.type(input, "100");
		expect(input).toHaveValue("100");

		await user.clear(input);
		await user.type(input, "-50");
		expect(input).not.toHaveValue("-50");
	});

	it("computes annual total from base and variable", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		await user.type(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
			"100",
		);
		await user.type(
			screen.getByLabelText(
				"Composantes variables annuelles femmes, catégorie 1",
			),
			"50",
		);

		expect(screen.getByText("150 €")).toBeInTheDocument();
	});

	it("shows SavedIndicator when initial data exists", () => {
		render(
			<Step5EmployeeCategories
				declarationYear={2025}
				initialCategories={[
					makeCategory({
						name: "Ingénieurs",
						detail: "Dev",
						womenCount: 10,
						menCount: 15,
						annualBaseWomen: "3000",
						annualBaseMen: "3200",
					}),
				]}
				initialSource="autre"
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator with empty initial data", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("deserializes initial data into form fields", () => {
		render(
			<Step5EmployeeCategories
				declarationYear={2025}
				initialCategories={[
					makeCategory({
						name: "Cadres",
						detail: "Managers",
						womenCount: 5,
						menCount: 8,
					}),
				]}
				initialSource="convention-collective"
			/>,
		);

		const nameInput = screen.getByLabelText("Nom", {
			selector: "#cat-0-name",
		});
		expect(nameInput).toHaveValue("Cadres");

		const detailInput = screen.getByLabelText("Détail des emplois", {
			selector: "#cat-0-detail",
		});
		expect(detailInput).toHaveValue("Managers");
	});

	it("submits data on form submit", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		const nameInput = screen.getByLabelText("Nom", {
			selector: "#cat-0-name",
		});
		await user.type(nameInput, "Techniciens");

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledWith(
			expect.objectContaining({
				declarationType: "initial",
				source: expect.any(String),
				categories: expect.arrayContaining([
					expect.objectContaining({
						name: "Techniciens",
					}),
				]),
			}),
		);
	});

	it("shows error when workforce totals do not match step 1", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationYear={2025}
				maxMen={20}
				maxWomen={10}
			/>,
		);

		// Fill required name first
		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");

		const womenInput = screen.getByLabelText("Effectif femmes, catégorie 1");
		const menInput = screen.getByLabelText("Effectif hommes, catégorie 1");

		await user.type(womenInput, "5");
		await user.type(menInput, "15");

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.getByText(/ne correspond pas à l'effectif déclaré/),
		).toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("shows error when category name is empty on submit", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.getByText(/nom de chaque catégorie.*obligatoire/i),
		).toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("shows error when category names are duplicated", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories declarationYear={2025} />);

		// Fill first category name
		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");

		// Add second category and give same name
		await user.click(
			screen.getByRole("button", { name: /ajouter une catégorie/i }),
		);
		const nameInput2 = document.getElementById("cat-1-name") as HTMLElement;
		await user.type(nameInput2, "Cadres");

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.getByText(/noms des catégories.*uniques/i),
		).toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("renders previous link pointing to step 4", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/4",
		);
	});

	it("renders accordion for definitions", () => {
		render(<Step5EmployeeCategories declarationYear={2025} />);
		expect(
			screen.getByText("Définitions et méthode de calcul"),
		).toBeInTheDocument();
	});
});
