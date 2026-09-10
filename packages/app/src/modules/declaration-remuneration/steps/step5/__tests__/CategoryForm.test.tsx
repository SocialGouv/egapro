import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import type { ImportResult } from "../categoryFileHandler";
import type { EmployeeCategory } from "../categorySerializer";

const { parseImportFileMock, getDsfrModalMock } = vi.hoisted(() => ({
	parseImportFileMock: vi.fn(),
	getDsfrModalMock: vi.fn(() => ({ conceal: vi.fn() })),
}));

// Stub only getDsfrModal; the DSFR JS that drives the import panel is absent in jsdom.
vi.mock("~/modules/shared", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/shared")>();
	return { ...actual, getDsfrModal: getDsfrModalMock };
});

vi.mock("../categoryFileHandler", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../categoryFileHandler")>();
	return { ...actual, parseImportFile: parseImportFileMock };
});

vi.mock("../categoryModelTracking", () => ({
	startCategoryModelTimer: vi.fn(),
	trackCategoryImportDuration: vi.fn(),
}));

import { remunerationStepHref } from "~/modules/routes";
import { CategoryForm } from "../CategoryForm";

function row(name: string): EmployeeCategoryRow {
	return {
		name,
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
	};
}

function importedCategory(
	id: number,
	name: string,
	overrides: Partial<EmployeeCategory> = {},
): EmployeeCategory {
	return {
		id,
		name,
		womenCount: "",
		menCount: "",
		hourlyWomenCount: "",
		hourlyMenCount: "",
		annualBaseWomen: "",
		annualBaseMen: "",
		annualVariableWomen: "",
		annualVariableMen: "",
		hourlyBaseWomen: "",
		hourlyBaseMen: "",
		hourlyVariableWomen: "",
		hourlyVariableMen: "",
		...overrides,
	};
}

/**
 * The accordion ids DSFR binds its toggles to. DSFR freezes them at
 * instantiation and matches its buttons through a literal
 * `[aria-controls="<id>"]` selector, so renumbering them in place silently
 * kills the toggle — see #4008. Scoped to the category group so the sibling
 * definitions accordion is left out.
 */
function accordionIds(): string[] {
	return Array.from(
		document.querySelectorAll<HTMLButtonElement>(
			'.fr-accordions-group[data-fr-group="false"] button.fr-accordion__btn',
		),
	).map((button) => button.getAttribute("aria-controls") ?? "");
}

function renderForm(
	initialCategories: EmployeeCategoryRow[],
	overrides: Partial<ComponentProps<typeof CategoryForm>> = {},
) {
	const props = {
		accordionId: "accordion-test",
		initialCategories,
		instructionText: "Renseignez vos catégories.",
		isSubmitting: false,
		onSubmit: vi.fn(),
		previousHref: remunerationStepHref(4),
		referenceYear: 2025,
		stepper: null,
		title: "Catégories de salariés",
		tooltipPrefix: "test",
		...overrides,
	} satisfies ComponentProps<typeof CategoryForm>;
	const rendered = render(<CategoryForm {...props} />);
	return {
		...rendered,
		rerenderForm(nextOverrides: Partial<ComponentProps<typeof CategoryForm>>) {
			rendered.rerender(<CategoryForm {...props} {...nextOverrides} />);
		},
	};
}

async function deleteCategoryAt(index: number) {
	const user = userEvent.setup();
	const deleteButtons = screen.getAllByRole("button", { name: /supprimer/i });
	await user.click(deleteButtons[index] as HTMLElement);

	const dialog = document.querySelector(
		'dialog[aria-labelledby="delete-category-title"]',
	) as HTMLElement;
	// getByText, not getByRole: the <dialog> has no `open` attribute in jsdom,
	// so its contents are outside the accessibility tree.
	await user.click(within(dialog).getByText("Supprimer"));
}

async function importCategories(categories: EmployeeCategory[]) {
	parseImportFileMock.mockResolvedValue({
		ok: true,
		categories,
	} satisfies ImportResult);

	fireEvent.change(screen.getByLabelText("Sélectionner des fichiers"), {
		target: { files: [new File(["x"], "import.csv", { type: "text/csv" })] },
	});
	fireEvent.click(
		screen.getByRole("button", { hidden: true, name: "Importer" }),
	);
}

beforeEach(() => {
	parseImportFileMock.mockReset();
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe("CategoryForm accordion identity", () => {
	it("gives every accordion a unique id", () => {
		renderForm([row("Cadres"), row("Employés"), row("Ouvriers")]);

		const ids = accordionIds();
		expect(ids).toHaveLength(3);
		expect(new Set(ids).size).toBe(3);
	});

	it("keeps the surviving accordion ids unchanged when a category is deleted", async () => {
		renderForm([row("Cadres"), row("Employés"), row("Ouvriers")]);
		const [, second, third] = accordionIds();

		await deleteCategoryAt(0);

		await waitFor(() => expect(accordionIds()).toHaveLength(2));
		// Not merely "still 2 ids": the exact ids of the untouched rows must be
		// byte-identical, otherwise DSFR disposes their live toggle instances.
		expect(accordionIds()).toEqual([second, third]);
	});

	it("keeps each id wired to its own panel and heading after a deletion", async () => {
		renderForm([row("Cadres"), row("Employés")]);

		await deleteCategoryAt(0);

		await waitFor(() => expect(accordionIds()).toHaveLength(1));
		const button = document.querySelector<HTMLButtonElement>(
			'.fr-accordions-group[data-fr-group="false"] button.fr-accordion__btn',
		);
		const panelId = button?.getAttribute("aria-controls") ?? "";
		expect(document.getElementById(panelId)).not.toBeNull();
		expect(button?.id).toBe(`${panelId}-heading`);
	});

	it("hands out brand-new ids after an import so stale DSFR registrations cannot collide", async () => {
		renderForm([row("Cadres"), row("Employés")]);
		const before = accordionIds();

		await importCategories([
			importedCategory(1, "Techniciens"),
			importedCategory(2, "Agents de maîtrise"),
		]);

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /Techniciens/ }),
			).toBeInTheDocument(),
		);
		const after = accordionIds();
		expect(after).toHaveLength(2);
		expect(new Set(after).size).toBe(2);
		expect(after.filter((id) => before.includes(id))).toEqual([]);
	});

	it("survives the reported import → delete → import sequence", async () => {
		renderForm([row("Cadres"), row("Employés"), row("Ouvriers")]);

		await importCategories([
			importedCategory(1, "Alpha"),
			importedCategory(2, "Bravo"),
			importedCategory(3, "Charlie"),
		]);
		await waitFor(() =>
			expect(screen.getByRole("button", { name: /Alpha/ })).toBeInTheDocument(),
		);

		await deleteCategoryAt(0);
		await waitFor(() => expect(accordionIds()).toHaveLength(2));
		const afterDelete = accordionIds();

		await importCategories([
			importedCategory(4, "Delta"),
			importedCategory(5, "Echo"),
		]);
		await waitFor(() =>
			expect(screen.getByRole("button", { name: /Delta/ })).toBeInTheDocument(),
		);

		const afterSecondImport = accordionIds();
		expect(new Set(afterSecondImport).size).toBe(2);
		expect(afterSecondImport.filter((id) => afterDelete.includes(id))).toEqual(
			[],
		);
	});
});

describe("CategoryForm import of a non-calculable category (#3678)", () => {
	it("normalizes non-calculable defaults before the first emitted value change", () => {
		const onValuesChange = vi.fn();
		const { id: _id, ...defaults } = importedCategory(1, "Cadres", {
			womenCount: "0",
			menCount: "3",
			hourlyWomenCount: "0",
			hourlyMenCount: "3",
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			annualVariableWomen: "5000",
			annualVariableMen: "6000",
			hourlyBaseWomen: "18",
			hourlyBaseMen: "19",
			hourlyVariableWomen: "3",
			hourlyVariableMen: "4",
		});

		renderForm([], {
			defaultValuesOverride: {
				source: "accord-entreprise",
				categories: [defaults],
			},
			onValuesChange,
		});

		expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument();
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toBeDisabled();
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toHaveValue("");
		expect(onValuesChange).toHaveBeenCalled();
		for (const [values] of onValuesChange.mock.calls) {
			expect(values.categories[0]?.annualBaseWomen).toBe("");
			expect(values.categories[0]?.hourlyVariableMen).toBe("");
		}
	});

	it("clears imported pay, disables its visible fields, and omits it from submission", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const onValuesChange = vi.fn();
		renderForm([], { onSubmit, onValuesChange });

		await importCategories([
			importedCategory(1, "Cadres", {
				womenCount: "3",
				menCount: "0",
				hourlyWomenCount: "3",
				hourlyMenCount: "0",
				annualBaseWomen: "30000",
				annualBaseMen: "32000",
				annualVariableWomen: "5000",
				annualVariableMen: "6000",
				hourlyBaseWomen: "18",
				hourlyBaseMen: "19",
				hourlyVariableWomen: "3",
				hourlyVariableMen: "4",
			}),
		]);

		await waitFor(() =>
			expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument(),
		);
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toBeDisabled();
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toHaveValue("");
		await waitFor(() =>
			expect(
				onValuesChange.mock.calls.some(
					([values]) => values.categories[0]?.annualBaseWomen === "",
				),
			).toBe(true),
		);

		await user.selectOptions(
			screen.getByLabelText(/Quelle est la source utilisée/),
			"accord-entreprise",
		);
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		const data = onSubmit.mock.calls[0]?.[0]?.categories?.[0]?.data;
		expect(data).toMatchObject({
			womenCount: 3,
			menCount: 0,
			hourlyWomenCount: 3,
			hourlyMenCount: 0,
		});
		expect(data?.annualBaseWomen).toBeUndefined();
		expect(data?.hourlyVariableMen).toBeUndefined();
	});

	it("normalizes live pay before an Enter-key submit can persist a stale draft", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const onValuesChange = vi.fn();
		const { id: _id, ...defaults } = importedCategory(1, "Cadres", {
			womenCount: "2",
			menCount: "2",
			hourlyWomenCount: "2",
			hourlyMenCount: "2",
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			annualVariableWomen: "5000",
			annualVariableMen: "6000",
			hourlyBaseWomen: "18",
			hourlyBaseMen: "19",
			hourlyVariableWomen: "3",
			hourlyVariableMen: "4",
		});
		renderForm([], {
			defaultValuesOverride: {
				source: "accord-entreprise",
				categories: [defaults],
			},
			onSubmit,
			onValuesChange,
		});

		const annualWomen = screen.getByLabelText(
			"Rémunération annuelle — Nombre de femmes, catégorie 1",
		);
		const hourlyWomen = screen.getByLabelText(
			"Rémunération horaire — Nombre de femmes, catégorie 1",
		);
		fireEvent.change(annualWomen, { target: { value: "0" } });
		fireEvent.change(hourlyWomen, { target: { value: "0" } });
		expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument();
		expect(
			onValuesChange.mock.calls.some(
				([values]) => values.categories[0]?.annualBaseWomen === "30000",
			),
		).toBe(true);

		hourlyWomen.focus();
		await user.keyboard("{Enter}");

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		const submitted = onSubmit.mock.calls[0]?.[0]?.categories?.[0]?.data;
		expect(submitted?.annualBaseWomen).toBeUndefined();
		expect(submitted?.hourlyVariableMen).toBeUndefined();
		await waitFor(() =>
			expect(
				onValuesChange.mock.calls.some(
					([values]) => values.categories[0]?.annualBaseWomen === "",
				),
			).toBe(true),
		);

		fireEvent.change(hourlyWomen, { target: { value: "2" } });
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toHaveValue("");
	});

	it("keeps focus on the non-calculable explanation when tabbing out of the last headcount", async () => {
		const user = userEvent.setup();
		const { id: _id, ...defaults } = importedCategory(1, "Cadres", {
			womenCount: "2",
			menCount: "2",
			hourlyWomenCount: "2",
			hourlyMenCount: "2",
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			annualVariableWomen: "5000",
			annualVariableMen: "6000",
			hourlyBaseWomen: "18",
			hourlyBaseMen: "19",
			hourlyVariableWomen: "3",
			hourlyVariableMen: "4",
		});
		renderForm([], {
			defaultValuesOverride: {
				source: "accord-entreprise",
				categories: [defaults],
			},
		});

		const annualMen = screen.getByLabelText(
			"Rémunération annuelle — Nombre d'hommes, catégorie 1",
		);
		const hourlyMen = screen.getByLabelText(
			"Rémunération horaire — Nombre d'hommes, catégorie 1",
		);
		await user.clear(annualMen);
		await user.type(annualMen, "0");
		await user.clear(hourlyMen);
		await user.type(hourlyMen, "0");

		const status = screen.getByTestId("category-pay-status");
		expect(status).toHaveTextContent("Aucun écart à calculer");
		await user.tab();

		await waitFor(() => expect(status).toHaveFocus());
	});
});

describe("CategoryForm legacy read-only categories (#3678)", () => {
	it("preserves legacy pay while disabled, then normalizes it when editing becomes possible", async () => {
		const initialCategories = [
			{
				...row("Cadres"),
				womenCount: 0,
				menCount: 3,
				hourlyWomenCount: 0,
				hourlyMenCount: 3,
				annualBaseWomen: "30000",
				annualBaseMen: "32000",
				annualVariableWomen: "5000",
				annualVariableMen: "6000",
				hourlyBaseWomen: "18",
				hourlyBaseMen: "19",
				hourlyVariableWomen: "3",
				hourlyVariableMen: "4",
			},
		];
		const { rerenderForm } = renderForm(initialCategories, { disabled: true });
		const annualBaseWomen = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);

		expect(annualBaseWomen).toBeDisabled();
		expect(annualBaseWomen).toHaveValue("30 000,00");
		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();

		rerenderForm({ disabled: false });
		await waitFor(() => expect(annualBaseWomen).toHaveValue(""));
		expect(annualBaseWomen).toBeDisabled();
		expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument();
	});

	it("normalizes legacy pay once a read-only form becomes editable", async () => {
		const initialCategories = [
			{
				...row("Cadres"),
				womenCount: 0,
				menCount: 3,
				hourlyWomenCount: 0,
				hourlyMenCount: 3,
				annualBaseWomen: "30000",
				annualBaseMen: "32000",
				annualVariableWomen: "5000",
				annualVariableMen: "6000",
				hourlyBaseWomen: "18",
				hourlyBaseMen: "19",
				hourlyVariableWomen: "3",
				hourlyVariableMen: "4",
			},
		];
		const { rerenderForm } = renderForm(initialCategories, { readOnly: true });
		const annualBaseWomen = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);
		expect(annualBaseWomen).toHaveValue("30 000,00");

		rerenderForm({ readOnly: false });
		await waitFor(() => expect(annualBaseWomen).toBeDisabled());
		expect(annualBaseWomen).toHaveValue("");
		expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument();

		rerenderForm({ readOnly: true });
		expect(annualBaseWomen).toBeDisabled();
		expect(annualBaseWomen).toHaveValue("");
	});

	it("preserves legacy pay restored from a residual draft", () => {
		const { id: _id, ...defaults } = importedCategory(1, "Cadres", {
			womenCount: "0",
			menCount: "3",
			hourlyWomenCount: "0",
			hourlyMenCount: "3",
			annualBaseWomen: "30000",
			annualBaseMen: "32000",
			annualVariableWomen: "5000",
			annualVariableMen: "6000",
			hourlyBaseWomen: "18",
			hourlyBaseMen: "19",
			hourlyVariableWomen: "3",
			hourlyVariableMen: "4",
		});

		renderForm([], {
			defaultValuesOverride: {
				source: "accord-entreprise",
				categories: [defaults],
			},
			readOnly: true,
		});

		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();
		const annualBaseWomen = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);
		expect(annualBaseWomen).toHaveAttribute("readonly");
		expect(annualBaseWomen).not.toBeDisabled();
		expect(annualBaseWomen).toHaveValue("30 000");
	});

	it("preserves already-submitted pay so the locked form matches PDF and export", () => {
		renderForm(
			[
				{
					...row("Cadres"),
					womenCount: 0,
					menCount: 3,
					hourlyWomenCount: 0,
					hourlyMenCount: 3,
					annualBaseWomen: "30000",
					annualBaseMen: "32000",
					annualVariableWomen: "5000",
					annualVariableMen: "6000",
					hourlyBaseWomen: "18",
					hourlyBaseMen: "19",
					hourlyVariableWomen: "3",
					hourlyVariableMen: "4",
				},
			],
			{ readOnly: true },
		);

		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();
		const annualBaseWomen = screen.getByLabelText(
			"Salaire de base annuel femmes, catégorie 1",
		);
		expect(annualBaseWomen).toHaveAttribute("readonly");
		expect(annualBaseWomen).not.toBeDisabled();
		expect(annualBaseWomen).toHaveValue("30 000,00");

		fireEvent.blur(
			screen.getByLabelText(
				"Rémunération annuelle — Nombre de femmes, catégorie 1",
			),
		);
		expect(
			screen.queryByText("Aucun écart à calculer"),
		).not.toBeInTheDocument();
		expect(annualBaseWomen).not.toBeDisabled();
		expect(annualBaseWomen).toHaveValue("30 000,00");
		expect(
			screen.getByLabelText(
				"Composantes variables horaires hommes, catégorie 1",
			),
		).toHaveValue("4,00");
	});

	it("keeps a newly submitted non-calculable category empty and explained", () => {
		renderForm(
			[
				{
					...row("Cadres"),
					womenCount: 0,
					menCount: 3,
					hourlyWomenCount: 0,
					hourlyMenCount: 3,
				},
			],
			{ readOnly: true },
		);

		expect(screen.getByText("Aucun écart à calculer")).toBeInTheDocument();
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toBeDisabled();
	});
});
