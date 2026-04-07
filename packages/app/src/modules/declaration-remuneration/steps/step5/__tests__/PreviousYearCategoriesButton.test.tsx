import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreviousYearCategoriesButton } from "../PreviousYearCategoriesButton";

const mockPreviousData = {
	source: "convention-collective",
	categories: [
		{ name: "Cadres", detail: "Managers" },
		{ name: "Employés", detail: "Support" },
	],
};

let queryData: typeof mockPreviousData | null = null;

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			getPreviousYearCategories: {
				useQuery: () => ({ data: queryData }),
			},
		},
	},
}));

beforeEach(() => {
	queryData = null;
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

function renderButton(overrides: { hasExistingData?: boolean } = {}) {
	const onImport = vi.fn();
	let id = 0;
	const nextId = () => id++;

	const result = render(
		<ul>
			<PreviousYearCategoriesButton
				hasExistingData={overrides.hasExistingData ?? false}
				nextId={nextId}
				onImport={onImport}
			/>
		</ul>,
	);

	return { onImport, ...result };
}

describe("PreviousYearCategoriesButton", () => {
	it("renders nothing when no previous year data exists", () => {
		queryData = null;
		renderButton();

		expect(
			screen.queryByRole("button", { name: /reprendre/i }),
		).not.toBeInTheDocument();
	});

	it("renders button when previous year data exists", () => {
		queryData = mockPreviousData;
		renderButton();

		expect(
			screen.getByRole("button", { name: /reprendre les catégories/i }),
		).toBeInTheDocument();
	});

	it("calls onImport directly when no existing data", async () => {
		queryData = mockPreviousData;
		const user = userEvent.setup();
		const { onImport } = renderButton({ hasExistingData: false });

		await user.click(
			screen.getByRole("button", { name: /reprendre les catégories/i }),
		);

		expect(onImport).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ name: "Cadres", detail: "Managers" }),
				expect.objectContaining({ name: "Employés", detail: "Support" }),
			]),
			"convention-collective",
		);
	});

	it("shows confirmation dialog when existing data present", async () => {
		queryData = mockPreviousData;
		const user = userEvent.setup();
		const { onImport } = renderButton({ hasExistingData: true });

		await user.click(
			screen.getByRole("button", { name: /reprendre les catégories/i }),
		);

		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
		expect(onImport).not.toHaveBeenCalled();
	});

	it("imports after confirming in dialog", async () => {
		queryData = mockPreviousData;
		const user = userEvent.setup();
		const { onImport } = renderButton({ hasExistingData: true });

		await user.click(
			screen.getByRole("button", { name: /reprendre les catégories/i }),
		);

		const dialog = document.querySelector(
			'dialog[aria-labelledby="previous-year-confirm-title"]',
		) as HTMLElement;
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Reprendre"));

		expect(onImport).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ name: "Cadres", detail: "Managers" }),
			]),
			"convention-collective",
		);
	});

	it("does not import when canceling dialog", async () => {
		queryData = mockPreviousData;
		const user = userEvent.setup();
		const { onImport } = renderButton({ hasExistingData: true });

		await user.click(
			screen.getByRole("button", { name: /reprendre les catégories/i }),
		);

		const dialog = document.querySelector(
			'dialog[aria-labelledby="previous-year-confirm-title"]',
		) as HTMLElement;
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Annuler"));

		expect(onImport).not.toHaveBeenCalled();
	});

	it("creates categories with empty numeric fields", async () => {
		queryData = mockPreviousData;
		const user = userEvent.setup();
		const { onImport } = renderButton({ hasExistingData: false });

		await user.click(
			screen.getByRole("button", { name: /reprendre les catégories/i }),
		);

		const importedCategories = onImport.mock.calls[0]?.[0];
		for (const cat of importedCategories) {
			expect(cat.womenCount).toBe("");
			expect(cat.menCount).toBe("");
			expect(cat.annualBaseWomen).toBe("");
			expect(cat.annualBaseMen).toBe("");
		}
	});
});
