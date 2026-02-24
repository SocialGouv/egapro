import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step5EmployeeCategories } from "../Step5EmployeeCategories";

const mockPush = vi.fn();
const mockMutate = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStepCategories: {
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
	mockPush.mockClear();
	mockMutate.mockClear();
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe("Step5EmployeeCategories", () => {
	it("renders with 1 empty category by default", () => {
		render(<Step5EmployeeCategories />);
		expect(screen.getByText("Catégorie d'emplois n°1")).toBeInTheDocument();
		expect(
			screen.queryByText("Catégorie d'emplois n°2"),
		).not.toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 1")).toBeInTheDocument();
	});

	it("renders stepper at step 5", () => {
		render(<Step5EmployeeCategories />);
		expect(screen.getByText("Étape 5 sur 6")).toBeInTheDocument();
	});

	it("renders description text and reference period", () => {
		render(<Step5EmployeeCategories />);
		expect(
			screen.getByText(/mesurer l'écart de rémunération/),
		).toBeInTheDocument();
		expect(screen.getByText(/Période de référence/)).toBeInTheDocument();
	});

	it("renders source dropdown", () => {
		render(<Step5EmployeeCategories />);
		expect(
			screen.getByLabelText(/Quelle est la source utilisée/),
		).toBeInTheDocument();
		expect(screen.getByText("Sélectionner une option")).toBeInTheDocument();
	});

	it("renders instruction text", () => {
		render(<Step5EmployeeCategories />);
		expect(
			screen.getByText(/Saisissez les données manquantes/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders table headers for the category", () => {
		render(<Step5EmployeeCategories />);
		expect(screen.getAllByText("Femmes").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Hommes").length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Seuil réglementaire : 5%").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders table section headers", () => {
		render(<Step5EmployeeCategories />);
		expect(
			screen.getAllByText("Nombre de salariés [Nombre total]").length,
		).toBe(1);
		expect(screen.getAllByText("Rémunération annuelle brute").length).toBe(1);
		expect(screen.getAllByText("Rémunération horaire brute").length).toBe(1);
	});

	it("renders name and detail input fields for category", () => {
		render(<Step5EmployeeCategories />);
		expect(document.getElementById("cat-0-name")).toBeInTheDocument();
		expect(document.getElementById("cat-0-detail")).toBeInTheDocument();
	});

	it("can add a new category", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

		await user.click(
			screen.getByRole("button", {
				name: /ajouter une catégorie/i,
			}),
		);

		expect(screen.getByText("Catégorie d'emplois n°2")).toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 2")).toBeInTheDocument();
	});

	it("can remove a category after confirmation", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

		// Add a second category first
		await user.click(
			screen.getByRole("button", { name: /ajouter une catégorie/i }),
		);
		expect(screen.getByText("Nombre de catégories : 2")).toBeInTheDocument();

		// Click delete on first category — opens confirmation dialog
		const deleteButtons = screen.getAllByRole("button", {
			name: /supprimer/i,
		});
		await user.click(deleteButtons[0]!);

		// Confirm deletion in dialog
		const dialog = document.querySelector("dialog")!;
		expect(dialog).toBeInTheDocument();
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Supprimer"));

		expect(
			screen.queryByText("Catégorie d'emplois n°2"),
		).not.toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 1")).toBeInTheDocument();
	});

	it("updates input fields and computes gap", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

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

	it("rejects negative values in number inputs", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

		const input = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);

		await user.type(input, "100");
		expect(input).toHaveValue(100);

		await user.clear(input);
		await user.type(input, "-50");
		expect(input).not.toHaveValue(-50);
	});

	it("computes annual total from base and variable", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

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
				initialCategories={[
					{ name: "meta:source:autre" },
					{ name: "cat:0:name:Ingénieurs" },
					{ name: "cat:0:detail:Dev" },
					{
						name: "cat:0:effectif",
						womenCount: 10,
						menCount: 15,
					},
					{
						name: "cat:0:annual:base",
						womenValue: "3000",
						menValue: "3200",
					},
					{ name: "cat:0:annual:variable" },
					{ name: "cat:0:hourly:base" },
					{ name: "cat:0:hourly:variable" },
				]}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator with empty initial data", () => {
		render(<Step5EmployeeCategories />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("deserializes initial data into form fields", () => {
		render(
			<Step5EmployeeCategories
				initialCategories={[
					{ name: "meta:source:convention-collective" },
					{ name: "cat:0:name:Cadres" },
					{ name: "cat:0:detail:Managers" },
					{
						name: "cat:0:effectif",
						womenCount: 5,
						menCount: 8,
					},
					{ name: "cat:0:annual:base" },
					{ name: "cat:0:annual:variable" },
					{ name: "cat:0:hourly:base" },
					{ name: "cat:0:hourly:variable" },
				]}
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

	it("submits serialized data on form submit", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

		const nameInput = screen.getByLabelText("Nom", {
			selector: "#cat-0-name",
		});
		await user.type(nameInput, "Techniciens");

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledWith(
			expect.objectContaining({
				step: 5,
				categories: expect.arrayContaining([
					expect.objectContaining({ name: "meta:source:" }),
					expect.objectContaining({
						name: "cat:0:name:Techniciens",
					}),
				]),
			}),
		);
	});

	it("shows error when workforce totals do not match step 1", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories maxMen={20} maxWomen={10} />);

		// Fill required name first
		const nameInput = document.getElementById("cat-0-name")!;
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
		render(<Step5EmployeeCategories />);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.getByText(/nom de chaque catégorie.*obligatoire/i),
		).toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("shows error when category names are duplicated", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

		// Fill first category name
		const nameInput = document.getElementById("cat-0-name")!;
		await user.type(nameInput, "Cadres");

		// Add second category and give same name
		await user.click(
			screen.getByRole("button", { name: /ajouter une catégorie/i }),
		);
		const nameInput2 = document.getElementById("cat-1-name")!;
		await user.type(nameInput2, "Cadres");

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.getByText(/noms des catégories.*uniques/i),
		).toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("renders previous link pointing to step 4", () => {
		render(<Step5EmployeeCategories />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration/etape/4",
		);
	});

	it("renders accordion for definitions", () => {
		render(<Step5EmployeeCategories />);
		expect(
			screen.getByText("Définitions et méthode de calcul"),
		).toBeInTheDocument();
	});
});
