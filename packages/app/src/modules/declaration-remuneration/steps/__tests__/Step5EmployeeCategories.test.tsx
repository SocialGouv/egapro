import { render, screen, waitFor, within } from "@testing-library/react";
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

async function fillAllPayCells(
	user: ReturnType<typeof userEvent.setup>,
	catNumber = 1,
) {
	const labels = [
		`Salaire de base annuel femmes, catégorie ${catNumber}`,
		`Salaire de base annuel hommes, catégorie ${catNumber}`,
		`Composantes variables annuelles femmes, catégorie ${catNumber}`,
		`Composantes variables annuelles hommes, catégorie ${catNumber}`,
		`Salaire de base horaire femmes, catégorie ${catNumber}`,
		`Salaire de base horaire hommes, catégorie ${catNumber}`,
		`Composantes variables horaires femmes, catégorie ${catNumber}`,
		`Composantes variables horaires hommes, catégorie ${catNumber}`,
	];
	for (const label of labels) {
		await user.type(screen.getByLabelText(label), "100");
	}
}

const countLabel = (
	basis: "annuelle" | "horaire",
	sex: "femmes" | "hommes",
	catNumber = 1,
) =>
	`Rémunération ${basis} — ${sex === "femmes" ? "Nombre de femmes" : "Nombre d'hommes"}, catégorie ${catNumber}`;

function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		womenCount: null,
		menCount: null,
		hourlyWomenCount: null,
		hourlyMenCount: null,
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
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByRole("button", { name: "Catégorie d'emplois n°1" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Catégorie d'emplois n°2" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Nombre de catégories : 1")).toBeInTheDocument();
	});

	it("titles the step without the legacy '(salaire de base et primes)' suffix", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		const heading = screen.getByRole("heading", {
			name: /Écart de rémunération par catégories de salariés/,
		});
		expect(heading).toBeInTheDocument();
		expect(heading.textContent).not.toMatch(/salaire de base et primes/i);
	});

	it("renders stepper at step 5", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(screen.getByText("Étape 5 sur 6")).toBeInTheDocument();
	});

	it("renders description text and reference period", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByText(/mesurer l'écart de rémunération/),
		).toBeInTheDocument();
		expect(screen.getByText(/Période de référence/)).toBeInTheDocument();
	});

	it("renders source dropdown", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByLabelText(/Quelle est la source utilisée/),
		).toBeInTheDocument();
		expect(screen.getByText("Sélectionner une option")).toBeInTheDocument();
	});

	it("renders instruction text", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByText(/Saisissez les données manquantes/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders the obligatoires mention immediately after the description text", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		const descriptionParagraph = screen.getByText(
			/mesurer l'écart de rémunération/,
		);
		const obligatoiresParagraph = screen.getByText(
			"Tous les champs sont obligatoires.",
		);
		expect(descriptionParagraph.nextElementSibling).toBe(obligatoiresParagraph);
	});

	it("gives every column header a non-empty accessible name and exposes row labels as rowheaders (RGAA 5.7)", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		for (const header of screen.getAllByRole("columnheader")) {
			expect(header).toHaveAccessibleName();
		}
		expect(
			screen.getAllByRole("columnheader", { name: "Donnée" }),
		).toHaveLength(2);
		expect(
			screen.getByRole("columnheader", { name: "Nombre de salariés" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Rémunération annuelle" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Rémunération horaire" }),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("rowheader", { name: "Salaire de base" }),
		).toHaveLength(2);
		expect(screen.getAllByRole("rowheader", { name: "Total" })).toHaveLength(2);
	});

	it("renders table headers for the category", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByRole("columnheader", { name: "Femmes" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Hommes" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Total" }),
		).toBeInTheDocument();
		expect(
			screen.getAllByText("Rémunération des femmes").length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Seuil réglementaire : 5%").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders table section headers", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getAllByText("Nombre de salariés en effectif physique").length,
		).toBe(1);
		expect(
			screen.getAllByText("Rémunération annuelle brute moyenne").length,
		).toBe(1);
		expect(
			screen.getAllByText("Rémunération horaire brute moyenne").length,
		).toBe(1);
	});

	it("renders the libellé input field for category", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(document.getElementById("cat-0-name")).toBeInTheDocument();
		expect(document.getElementById("cat-0-detail")).not.toBeInTheDocument();
	});

	it("labels the category name input with the full category emploi wording", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByLabelText(/^Libellé de la catégorie d'emploi/, {
				selector: "#cat-0-name",
			}),
		).toBeInTheDocument();
	});

	it("can add a new category", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

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

	it("moves focus to the new category's first field when adding a category", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: /ajouter une catégorie/i }),
		);

		await waitFor(() =>
			expect(document.getElementById("cat-1-name")).toHaveFocus(),
		);
	});

	it("can remove a category after confirmation", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

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
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

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
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const input = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);

		await user.type(input, "25000");
		expect(input).toHaveValue("25 000");
	});

	it("rejects negative values in number inputs", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

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
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

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
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
				initialCategories={[
					makeCategory({
						name: "Ingénieurs",
						womenCount: 10,
						menCount: 15,
						annualBaseWomen: "3000",
						annualBaseMen: "3200",
					}),
				]}
				initialSource="accord-entreprise"
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator with empty initial data", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("deserializes initial data into form fields", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
				initialCategories={[
					makeCategory({
						name: "Cadres",
						womenCount: 5,
						menCount: 8,
					}),
				]}
				initialSource="accord-entreprise"
			/>,
		);

		const nameInput = screen.getByLabelText(
			/^Libellé de la catégorie d'emploi/,
			{
				selector: "#cat-0-name",
			},
		);
		expect(nameInput).toHaveValue("Cadres");
	});

	it("submits data on form submit", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const nameInput = screen.getByLabelText(
			/^Libellé de la catégorie d'emploi/,
			{
				selector: "#cat-0-name",
			},
		);
		await user.type(nameInput, "Techniciens");

		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledWith(
			expect.objectContaining({
				declarationType: "initial",
				source: "accord-entreprise",
				categories: expect.arrayContaining([
					expect.objectContaining({
						name: "Techniciens",
					}),
				]),
			}),
		);
	});

	it("shows a friendly error when source is not selected", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const nameInput = screen.getByLabelText(
			/^Libellé de la catégorie d'emploi/,
			{
				selector: "#cat-0-name",
			},
		);
		await user.type(nameInput, "Techniciens");

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Champ vide");
		expect(alert).toHaveTextContent(/veuillez sélectionner la source/i);
		const sourceSelect = screen.getByLabelText(/Quelle est la source utilisée/);
		expect(sourceSelect).toHaveAttribute("aria-invalid", "true");
		expect(sourceSelect).toHaveAttribute(
			"aria-describedby",
			"step5-categories-error-empty",
		);
		expect(document.querySelector(".fr-error-text")).toBeNull();
		const definitions = screen
			.getByRole("button", { name: "Définitions et méthode de calcul" })
			.closest("section");
		expect(definitions).not.toBeNull();
		expect(
			alert.compareDocumentPosition(definitions as HTMLElement) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("shows the same source error again after dismissal and an identical submit", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		await user.type(
			document.getElementById("cat-0-name") as HTMLElement,
			"Techniciens",
		);

		const submit = screen.getByRole("button", { name: /suivant/i });
		await user.click(submit);
		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();

		await user.click(submit);
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				/veuillez sélectionner la source/i,
			),
		);
	});

	it("shows error when workforce totals do not match step 1", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
				maxMen={20}
				maxWomen={10}
			/>,
		);

		// Fill required name first
		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");

		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);

		const womenInput = screen.getByLabelText(countLabel("annuelle", "femmes"));
		const menInput = screen.getByLabelText(countLabel("annuelle", "hommes"));

		await user.type(womenInput, "5");
		await user.type(menInput, "15");
		await fillAllPayCells(user);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.getAllByText(/ne correspond pas à l'effectif déclaré/),
		).not.toHaveLength(0);
		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Données incohérentes");
		// Two simultaneous mismatches (women + men) render as two list items,
		// each naming its own sex and totals, rather than one merged paragraph.
		const items = within(alert).getAllByRole("listitem");
		expect(items).toHaveLength(2);
		expect(items.map((item) => item.textContent)).toEqual([
			"Le total des effectifs femmes de la ligne « Rémunération annuelle » (5) ne correspond pas à l'effectif déclaré à l'étape 1 (10).",
			"Le total des effectifs hommes de la ligne « Rémunération annuelle » (15) ne correspond pas à l'effectif déclaré à l'étape 1 (20).",
		]);
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("shows error when a sex has a headcount but missing pay amounts (#3948)", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");
		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"2",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"2",
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Champ vide");
		expect(alert).toHaveTextContent(
			/renseignez le salaire de base annuel des femmes/i,
		);
		const missingPayInput = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);
		expect(missingPayInput).toHaveAttribute("aria-invalid", "true");
		expect(missingPayInput).toHaveAttribute(
			"aria-describedby",
			"step5-categories-error-empty",
		);
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("lets a category whose headcount is 0 on a sex leave every pay cell empty (#3678)", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");
		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"3",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"0",
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.queryByText(/renseigner toutes les données de rémunération/i),
		).not.toBeInTheDocument();
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});

	it("submits when both sexes have complete pay data (#3948)", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");
		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"2",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"2",
		);
		await fillAllPayCells(user);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen.queryByText(/renseigner toutes les données de rémunération/i),
		).not.toBeInTheDocument();
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});

	it("shows error when category name is empty on submit", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
		const categoryToggle = screen.getByRole("button", {
			name: "Catégorie d'emplois n°1",
		});
		categoryToggle.setAttribute("aria-expanded", "false");
		await user.click(categoryToggle);
		await waitFor(() =>
			expect(categoryToggle).toHaveAttribute("aria-expanded", "false"),
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(/nom de chaque catégorie.*obligatoire/i);
		const errorLink = alert.querySelector('a[href="#cat-0-name"]');
		expect(errorLink).not.toBeNull();
		const nameInput = document.getElementById("cat-0-name");
		expect(nameInput).toHaveAttribute("aria-invalid", "true");
		expect(nameInput).toHaveAttribute(
			"aria-describedby",
			expect.stringContaining("step5-categories-error-empty"),
		);
		expect(categoryToggle).toHaveAttribute("aria-expanded", "false");
		await user.click(errorLink as HTMLElement);
		await waitFor(() =>
			expect(categoryToggle).toHaveAttribute("aria-expanded", "true"),
		);
		await waitFor(() => expect(nameInput).toHaveFocus());
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("shows error when category names are duplicated", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		// Fill first category name
		const nameInput = document.getElementById("cat-0-name") as HTMLElement;
		await user.type(nameInput, "Cadres");

		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);

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
		expect(screen.getByRole("alert")).toHaveTextContent("Valeur invalide");
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"1",
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			/noms des catégories.*uniques/i,
		);
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("keeps an accordion's aria-expanded state across unrelated re-renders (#3948)", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		const toggleButton = screen.getByRole("button", {
			name: "Catégorie d'emplois n°1",
		});
		expect(toggleButton).toHaveAttribute("aria-expanded", "true");

		toggleButton.setAttribute("aria-expanded", "false");
		await user.click(toggleButton);

		await waitFor(() =>
			expect(toggleButton).toHaveAttribute("aria-expanded", "false"),
		);

		await user.type(
			document.getElementById("cat-0-name") as HTMLElement,
			"Cadres",
		);

		expect(toggleButton).toHaveAttribute("aria-expanded", "false");
	});

	it("renders previous link pointing to step 4", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/4",
		);
	});

	it("renders accordion for definitions", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
		expect(
			screen.getByText("Définitions et méthode de calcul"),
		).toBeInTheDocument();
	});
});

describe("Step5EmployeeCategories — headcount per pay basis (#4254)", () => {
	function workforceRow(label: string) {
		const rowHeader = screen.getByRole("rowheader", { name: label });
		const row = rowHeader.closest("tr");
		if (!row) throw new Error(`No row for ${label}`);
		return within(row as HTMLElement);
	}

	async function fillNameAndSource(user: ReturnType<typeof userEvent.setup>) {
		await user.type(
			document.getElementById("cat-0-name") as HTMLElement,
			"Cadres",
		);
		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
	}

	it("reminds that the headcounts must match the step-1 table", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		expect(
			screen.getByText(/Pour rappel, le nombre total de salariés/),
		).toHaveTextContent(
			"Pour rappel, le nombre total de salariés doit correspondre à celui renseigné dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs ».",
		);
	});

	it("totals each row on its own and shows a dash until both cells are filled", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		expect(workforceRow("Rémunération annuelle").getByText("-")).toBeVisible();
		expect(workforceRow("Rémunération horaire").getByText("-")).toBeVisible();

		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"3",
		);
		expect(workforceRow("Rémunération annuelle").getByText("-")).toBeVisible();

		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"4",
		);
		expect(workforceRow("Rémunération annuelle").getByText("7")).toBeVisible();
		expect(workforceRow("Rémunération horaire").getByText("-")).toBeVisible();
	});

	it("prefills a category saved before the split on the annual row, leaving the hourly row empty", () => {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
				initialCategories={[
					makeCategory({ name: "Cadres", womenCount: 12, menCount: 8 }),
				]}
			/>,
		);

		expect(screen.getByLabelText(countLabel("annuelle", "femmes"))).toHaveValue(
			"12",
		);
		expect(screen.getByLabelText(countLabel("annuelle", "hommes"))).toHaveValue(
			"8",
		);
		expect(screen.getByLabelText(countLabel("horaire", "femmes"))).toHaveValue(
			"",
		);
		expect(screen.getByLabelText(countLabel("horaire", "hommes"))).toHaveValue(
			"",
		);
	});

	it("submits both bases of headcounts", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				hourlyMaxMen={5}
				hourlyMaxWomen={5}
				indicatorGRequired
				maxMen={20}
				maxWomen={10}
			/>,
		);

		await fillNameAndSource(user);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"10",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"20",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "femmes")),
			"5",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "hommes")),
			"5",
		);
		await fillAllPayCells(user);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockMutate.mock.calls[0]?.[0]?.categories[0]?.data).toMatchObject({
			womenCount: 10,
			menCount: 20,
			hourlyWomenCount: 5,
			hourlyMenCount: 5,
		});
	});

	it("names the hourly row when its total does not match step 1", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				hourlyMaxMen={5}
				hourlyMaxWomen={5}
				indicatorGRequired
				maxMen={20}
				maxWomen={10}
			/>,
		);

		await fillNameAndSource(user);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"10",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"20",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "femmes")),
			"4",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "hommes")),
			"5",
		);
		await fillAllPayCells(user);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(
			"Le total des effectifs femmes de la ligne « Rémunération horaire » (4) ne correspond pas à l'effectif déclaré à l'étape 1 (5).",
		);
		expect(alert).not.toHaveTextContent("« Rémunération annuelle »");
		// A single inconsistency stays a plain paragraph, not a list.
		expect(within(alert).queryAllByRole("listitem")).toHaveLength(0);
		expect(alert.querySelector("p")).not.toBeNull();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("requires only the pay fields of the basis that carries a headcount", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		await fillNameAndSource(user);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "femmes")),
			"2",
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(
			/renseignez le salaire de base horaire des femmes/i,
		);
		expect(alert).not.toHaveTextContent(/salaire de base annuel/i);
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).not.toHaveAttribute("aria-invalid");
		expect(mockMutate).not.toHaveBeenCalled();

		await user.type(
			screen.getByLabelText("Salaire de base horaire femmes, catégorie 1"),
			"18",
		);
		await user.type(
			screen.getByLabelText(
				"Composantes variables horaires femmes, catégorie 1",
			),
			"3",
		);
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
	});

	it("releases the pay fields of a basis when its headcount goes back to 0", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);

		await fillNameAndSource(user);
		const hourlyWomen = screen.getByLabelText(countLabel("horaire", "femmes"));
		await user.type(hourlyWomen, "2");
		await user.click(screen.getByRole("button", { name: /suivant/i }));
		expect(screen.getByRole("alert")).toHaveTextContent(
			/salaire de base horaire des femmes/i,
		);

		await user.clear(hourlyWomen);
		await user.type(hourlyWomen, "0");

		expect(
			screen.getByLabelText("Salaire de base horaire femmes, catégorie 1"),
		).not.toHaveAttribute("aria-invalid");

		await user.click(screen.getByRole("button", { name: /suivant/i }));
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});

	it("renders one list item per inconsistency when both bases and both sexes mismatch (#4390)", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				hourlyMaxMen={9}
				hourlyMaxWomen={7}
				indicatorGRequired
				maxMen={20}
				maxWomen={10}
			/>,
		);

		await fillNameAndSource(user);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"5",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"15",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "femmes")),
			"4",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "hommes")),
			"6",
		);
		await fillAllPayCells(user);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Données incohérentes");
		const items = within(alert).getAllByRole("listitem");
		expect(items).toHaveLength(4);

		const texts = items.map((item) => item.textContent ?? "");
		expect(
			texts.some(
				(text) =>
					text.includes("Rémunération annuelle") &&
					text.includes("femmes") &&
					text.includes("(5)") &&
					text.includes("(10)"),
			),
		).toBe(true);
		expect(
			texts.some(
				(text) =>
					text.includes("Rémunération annuelle") &&
					text.includes("hommes") &&
					text.includes("(15)") &&
					text.includes("(20)"),
			),
		).toBe(true);
		expect(
			texts.some(
				(text) =>
					text.includes("Rémunération horaire") &&
					text.includes("femmes") &&
					text.includes("(4)") &&
					text.includes("(7)"),
			),
		).toBe(true);
		expect(
			texts.some(
				(text) =>
					text.includes("Rémunération horaire") &&
					text.includes("hommes") &&
					text.includes("(6)") &&
					text.includes("(9)"),
			),
		).toBe(true);
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("keeps every hidden message after dismissal of a four-way inconsistency (#4390)", async () => {
		const user = userEvent.setup();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				hourlyMaxMen={9}
				hourlyMaxWomen={7}
				indicatorGRequired
				maxMen={20}
				maxWomen={10}
			/>,
		);

		await fillNameAndSource(user);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "femmes")),
			"5",
		);
		await user.type(
			screen.getByLabelText(countLabel("annuelle", "hommes")),
			"15",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "femmes")),
			"4",
		);
		await user.type(
			screen.getByLabelText(countLabel("horaire", "hommes")),
			"6",
		);
		await fillAllPayCells(user);

		await user.click(screen.getByRole("button", { name: /suivant/i }));
		expect(screen.getByRole("alert")).toHaveTextContent("Données incohérentes");

		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();

		const hidden = document.getElementById(
			"step5-categories-error-inconsistent",
		);
		expect(hidden).not.toBeNull();
		expect(hidden).toHaveTextContent(
			"Le total des effectifs femmes de la ligne « Rémunération annuelle » (5) ne correspond pas à l'effectif déclaré à l'étape 1 (10).",
		);
		expect(hidden).toHaveTextContent(
			"Le total des effectifs hommes de la ligne « Rémunération annuelle » (15) ne correspond pas à l'effectif déclaré à l'étape 1 (20).",
		);
		expect(hidden).toHaveTextContent(
			"Le total des effectifs femmes de la ligne « Rémunération horaire » (4) ne correspond pas à l'effectif déclaré à l'étape 1 (7).",
		);
		expect(hidden).toHaveTextContent(
			"Le total des effectifs hommes de la ligne « Rémunération horaire » (6) ne correspond pas à l'effectif déclaré à l'étape 1 (9).",
		);
		expect(mockMutate).not.toHaveBeenCalled();
	});
});

describe("Step5EmployeeCategories — pay cells of a category at 0 (#3678)", () => {
	const PAY_CELL_LABELS = [
		"Salaire de base annuel femmes, catégorie 1",
		"Salaire de base annuel hommes, catégorie 1",
		"Composantes variables annuelles femmes, catégorie 1",
		"Composantes variables annuelles hommes, catégorie 1",
		"Salaire de base horaire femmes, catégorie 1",
		"Salaire de base horaire hommes, catégorie 1",
		"Composantes variables horaires femmes, catégorie 1",
		"Composantes variables horaires hommes, catégorie 1",
	];

	const ANNUAL_PAY_CELL_LABELS = PAY_CELL_LABELS.slice(0, 4);

	function payCells() {
		return PAY_CELL_LABELS.map((label) => screen.getByLabelText(label));
	}

	function countCells() {
		return [
			countLabel("annuelle", "femmes"),
			countLabel("annuelle", "hommes"),
			countLabel("horaire", "femmes"),
			countLabel("horaire", "hommes"),
		].map((label) => screen.getByLabelText(label));
	}

	async function fillNameAndSource(user: ReturnType<typeof userEvent.setup>) {
		await user.type(
			document.getElementById("cat-0-name") as HTMLElement,
			"Cadres",
		);
		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
	}

	async function setCount(
		user: ReturnType<typeof userEvent.setup>,
		basis: "annuelle" | "horaire",
		sex: "femmes" | "hommes",
		value: string,
	) {
		const input = screen.getByLabelText(countLabel(basis, sex));
		await user.clear(input);
		if (value !== "") await user.type(input, value);
	}

	function renderStep() {
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
			/>,
		);
	}

	/** S4 — a category left at (3/0) on the annual row with its 4 annual amounts. */
	async function fillAnnualAmountsThenZero(
		user: ReturnType<typeof userEvent.setup>,
	) {
		await fillNameAndSource(user);
		await setCount(user, "annuelle", "femmes", "3");
		await setCount(user, "annuelle", "hommes", "2");
		for (const label of ANNUAL_PAY_CELL_LABELS) {
			await user.type(screen.getByLabelText(label), "100");
		}
		await setCount(user, "annuelle", "hommes", "0");
	}

	it("greys the 8 pay cells as soon as one headcount is 0, on either row (S1)", async () => {
		const user = userEvent.setup();
		renderStep();

		await setCount(user, "annuelle", "femmes", "3");
		await setCount(user, "annuelle", "hommes", "2");
		await setCount(user, "horaire", "femmes", "0");
		await setCount(user, "horaire", "hommes", "2");

		for (const cell of payCells()) expect(cell).toBeDisabled();
		for (const cell of countCells()) expect(cell).not.toBeDisabled();
		const gapCells = screen
			.getAllByRole("rowheader", { name: "Salaire de base" })
			.map((th) =>
				within(th.parentElement as HTMLElement)
					.getAllByRole("cell")
					.at(-1),
			);
		expect(gapCells).toHaveLength(2);
		for (const cell of gapCells) expect(cell).toHaveTextContent("-");
	});

	it("leaves the pay cells operable while no headcount is filled in — empty is not 0 (S2)", () => {
		renderStep();

		for (const cell of payCells()) expect(cell).not.toBeDisabled();
	});

	it("releases the pay cells when the 0 becomes a headcount again (S3)", async () => {
		const user = userEvent.setup();
		renderStep();

		await setCount(user, "annuelle", "femmes", "0");
		expect(payCells()[0]).toBeDisabled();

		await setCount(user, "annuelle", "femmes", "1");
		for (const cell of payCells()) expect(cell).not.toBeDisabled();
	});

	it("releases the pay cells when the 0 is erased (S3)", async () => {
		const user = userEvent.setup();
		renderStep();

		await setCount(user, "annuelle", "femmes", "0");
		expect(payCells()[0]).toBeDisabled();

		await setCount(user, "annuelle", "femmes", "");
		for (const cell of payCells()) expect(cell).not.toBeDisabled();
	});

	it("keeps the amounts, flags each one and blocks the step (S4)", async () => {
		const user = userEvent.setup();
		renderStep();

		await fillAnnualAmountsThenZero(user);
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Données incohérentes");
		expect(within(alert).getAllByRole("listitem")).toHaveLength(4);
		expect(alert).toHaveTextContent(
			/salaire de base annuel des femmes .* est renseignée alors qu'un effectif de cette catégorie est à 0/i,
		);
		for (const label of ANNUAL_PAY_CELL_LABELS) {
			const cell = screen.getByLabelText(label);
			// Blurring the cell pads the decimals (existing behaviour): the amount
			// is still there, untouched by the 0.
			expect(cell).toHaveValue("100,00");
			expect(cell).not.toBeDisabled();
			expect(cell).toHaveAttribute("aria-invalid", "true");
			expect(cell).toHaveAttribute(
				"aria-describedby",
				"step5-categories-error-inconsistent",
			);
		}
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("clears each inconsistency as its amount is erased, then submits without pay (S5)", async () => {
		const user = userEvent.setup();
		renderStep();

		await fillAnnualAmountsThenZero(user);
		await user.click(screen.getByRole("button", { name: /suivant/i }));
		expect(
			within(screen.getByRole("alert")).getAllByRole("listitem"),
		).toHaveLength(4);

		await user.clear(
			screen.getByLabelText(ANNUAL_PAY_CELL_LABELS[0] as string),
		);
		expect(
			screen.getByLabelText(ANNUAL_PAY_CELL_LABELS[0] as string),
		).not.toHaveAttribute("aria-invalid");
		expect(
			within(screen.getByRole("alert")).getAllByRole("listitem"),
		).toHaveLength(3);

		for (const label of ANNUAL_PAY_CELL_LABELS.slice(1)) {
			await user.clear(screen.getByLabelText(label));
		}
		// The cells only grey out once the user has left them — greying a focused
		// input would drop the focus to <body>.
		await user.click(screen.getByLabelText(countLabel("annuelle", "femmes")));
		for (const cell of payCells()) expect(cell).toBeDisabled();

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		const submitted = mockMutate.mock.calls[0]?.[0]?.categories?.[0]?.data;
		expect(submitted?.annualBaseWomen).toBeUndefined();
		expect(submitted?.annualBaseMen).toBeUndefined();
		expect(submitted?.annualVariableWomen).toBeUndefined();
		expect(submitted?.annualVariableMen).toBeUndefined();
	});

	it("clears the inconsistencies when the headcount is corrected, then submits with the amounts (S6)", async () => {
		const user = userEvent.setup();
		renderStep();

		await fillAnnualAmountsThenZero(user);
		await user.click(screen.getByRole("button", { name: /suivant/i }));
		expect(screen.getByRole("alert")).toHaveTextContent("Données incohérentes");

		await setCount(user, "annuelle", "hommes", "2");

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		for (const label of ANNUAL_PAY_CELL_LABELS) {
			expect(screen.getByLabelText(label)).not.toHaveAttribute("aria-invalid");
		}

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledTimes(1);
		expect(mockMutate.mock.calls[0]?.[0]?.categories?.[0]?.data).toMatchObject({
			annualBaseWomen: "100.00",
			annualBaseMen: "100.00",
		});
	});

	it("keeps the cell the user is editing operable, and greys it once focus leaves", async () => {
		const user = userEvent.setup();
		renderStep();

		await fillAnnualAmountsThenZero(user);
		const lastAmount = screen.getByLabelText(
			ANNUAL_PAY_CELL_LABELS[3] as string,
		);
		for (const label of ANNUAL_PAY_CELL_LABELS.slice(0, 3)) {
			await user.clear(screen.getByLabelText(label));
		}

		await user.clear(lastAmount);

		// Erasing the last amount is the fix the error message suggests: the cell
		// must not be greyed out from under the keyboard.
		expect(lastAmount).not.toBeDisabled();
		expect(lastAmount).toHaveFocus();

		// Tabbing on lands in the next pay cell, which must not vanish either.
		await user.tab();
		for (const cell of payCells()) expect(cell).not.toBeDisabled();

		// Leaving the two tables altogether is what greys them.
		await user.click(screen.getByLabelText(countLabel("annuelle", "femmes")));
		for (const cell of payCells()) expect(cell).toBeDisabled();
	});

	it("still applies the per-sex completeness rule to a category without any 0 (S7)", async () => {
		const user = userEvent.setup();
		renderStep();

		await fillNameAndSource(user);
		await setCount(user, "annuelle", "femmes", "3");
		await setCount(user, "annuelle", "hommes", "2");
		await setCount(user, "horaire", "femmes", "2");
		for (const label of ANNUAL_PAY_CELL_LABELS) {
			await user.type(screen.getByLabelText(label), "100");
		}

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Champ vide");
		expect(alert).toHaveTextContent(
			/renseignez le salaire de base horaire des femmes/i,
		);
		expect(mockMutate).not.toHaveBeenCalled();
	});
});
