import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

import { CategoryForm } from "../CategoryForm";

function row(name: string): EmployeeCategoryRow {
	return {
		name,
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
	};
}

function importedCategory(id: number, name: string): EmployeeCategory {
	return {
		id,
		name,
		womenCount: "",
		menCount: "",
		annualBaseWomen: "",
		annualBaseMen: "",
		annualVariableWomen: "",
		annualVariableMen: "",
		hourlyBaseWomen: "",
		hourlyBaseMen: "",
		hourlyVariableWomen: "",
		hourlyVariableMen: "",
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

function renderForm(initialCategories: EmployeeCategoryRow[]) {
	return render(
		<CategoryForm
			accordionId="accordion-test"
			initialCategories={initialCategories}
			instructionText="Renseignez vos catégories."
			isSubmitting={false}
			onSubmit={vi.fn()}
			previousHref="/precedent"
			referenceYear={2025}
			stepper={null}
			title="Catégories de salariés"
			tooltipPrefix="test"
		/>,
	);
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
