import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step1Workforce } from "../Step1Workforce";

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
			updateStep1: {
				useMutation: () => ({
					mutate: mockMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

// jsdom does not implement HTMLDialogElement methods
beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
	mockPush.mockClear();
	mockMutate.mockClear();
});

describe("Step1Workforce", () => {
	it("renders default state with zero totals", () => {
		render(<Step1Workforce />);
		expect(screen.getByText("Nombre de salariés")).toBeInTheDocument();
		// Check column headers exist in the table
		const table = screen.getByRole("table");
		expect(within(table).getByText("Femmes")).toBeInTheDocument();
		expect(within(table).getByText("Hommes")).toBeInTheDocument();
		expect(within(table).getByText("Total")).toBeInTheDocument();
		// All totals should be 0
		const row = screen
			.getByText("Nombre de salariés")
			.closest("tr") as HTMLElement;
		const cells = within(row).getAllByRole("cell");
		// cells: [Nombre de salariés, women, men, total, edit button]
		expect(cells[1]).toHaveTextContent("0");
		expect(cells[2]).toHaveTextContent("0");
		expect(cells[3]).toHaveTextContent("0");
	});

	it("renders initial categories with correct totals", () => {
		render(
			<Step1Workforce
				initialCategories={[{ name: "Nombre de salariés", women: 10, men: 20 }]}
			/>,
		);
		const row = screen
			.getByText("Nombre de salariés")
			.closest("tr") as HTMLElement;
		const cells = within(row).getAllByRole("cell");
		expect(cells[1]).toHaveTextContent("10");
		expect(cells[2]).toHaveTextContent("20");
		expect(cells[3]).toHaveTextContent("30");
	});

	it("shows SavedIndicator when initial data has values", () => {
		render(
			<Step1Workforce
				initialCategories={[{ name: "Nombre de salariés", women: 5, men: 3 }]}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		render(<Step1Workforce />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("opens edit dialog and updates women/men values", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce />);

		const editButton = screen.getByRole("button", { name: /modifier/i });
		await user.click(editButton);

		const womenInput = screen.getByLabelText("Femmes");
		const menInput = screen.getByLabelText("Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "15");
		expect(womenInput).toHaveValue(15);

		await user.clear(menInput);
		await user.type(menInput, "25");
		expect(menInput).toHaveValue(25);

		// Save the edit via the dialog's Enregistrer button
		const dialog = document.querySelector("dialog") as HTMLElement;
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Enregistrer"));

		// Table should now show updated values
		const row = screen
			.getByText("Nombre de salariés")
			.closest("tr") as HTMLElement;
		const cells = within(row).getAllByRole("cell");
		expect(cells[1]).toHaveTextContent("15");
		expect(cells[2]).toHaveTextContent("25");
		expect(cells[3]).toHaveTextContent("40");
	});

	it("validates total > 0 on submit", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce />);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("calls mutation with updated categories on valid submit", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				initialCategories={[{ name: "Nombre de salariés", women: 10, men: 20 }]}
			/>,
		);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(mockMutate).toHaveBeenCalledWith({
			categories: [{ name: "Nombre de salariés", women: 10, men: 20 }],
		});
	});

	it("shows validation error message when submitting with zero total", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce />);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(
			screen.getByText(
				"Veuillez renseigner les effectifs avant de passer à l'étape suivante.",
			),
		).toBeInTheDocument();
	});

	it("renders previous link pointing to declaration-remuneration", () => {
		render(<Step1Workforce />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration",
		);
	});
});
