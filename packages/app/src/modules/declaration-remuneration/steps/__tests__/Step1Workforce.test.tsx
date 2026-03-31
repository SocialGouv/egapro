import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step1Workforce } from "../Step1Workforce";

const mockMutate = vi.fn();

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

const emptyStep1Data = () => ({ totalWomen: 0, totalMen: 0 });

describe("Step1Workforce", () => {
	it("renders default state with zero totals", () => {
		render(<Step1Workforce initialData={emptyStep1Data()} />);
		expect(screen.getByText("Nombre de salariés")).toBeInTheDocument();
		const table = screen.getByRole("table");
		expect(within(table).getByText("Femmes")).toBeInTheDocument();
		expect(within(table).getByText("Hommes")).toBeInTheDocument();
		expect(within(table).getByText("Total")).toBeInTheDocument();
		// Inputs should be empty when value is 0
		expect(screen.getByLabelText("Nombre de femmes")).toHaveValue("");
		expect(screen.getByLabelText("Nombre d'hommes")).toHaveValue("");
	});

	it("renders reference period and mandatory fields notice", () => {
		render(<Step1Workforce initialData={emptyStep1Data()} />);
		expect(
			screen.getByText(/Période de référence pour le calcul des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders initial data with correct values", () => {
		render(<Step1Workforce initialData={{ totalWomen: 10, totalMen: 20 }} />);
		expect(screen.getByLabelText("Nombre de femmes")).toHaveValue("10");
		expect(screen.getByLabelText("Nombre d'hommes")).toHaveValue("20");
		const row = screen
			.getByText("Nombre de salariés")
			.closest("tr") as HTMLElement;
		const cells = within(row).getAllByRole("cell");
		expect(cells[3]).toHaveTextContent("30");
	});

	it("shows SavedIndicator when initial data has values", () => {
		render(<Step1Workforce initialData={{ totalWomen: 5, totalMen: 3 }} />);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		render(<Step1Workforce initialData={emptyStep1Data()} />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("updates women/men values via inline inputs", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce initialData={emptyStep1Data()} />);

		const womenInput = screen.getByLabelText("Nombre de femmes");
		const menInput = screen.getByLabelText("Nombre d'hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "15");
		expect(womenInput).toHaveValue("15");

		await user.clear(menInput);
		await user.type(menInput, "25");
		expect(menInput).toHaveValue("25");

		// Total should update
		const row = screen
			.getByText("Nombre de salariés")
			.closest("tr") as HTMLElement;
		const cells = within(row).getAllByRole("cell");
		expect(cells[3]).toHaveTextContent("40");
	});

	it("validates total > 0 on submit", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce initialData={emptyStep1Data()} />);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("calls mutation with updated data on valid submit", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce initialData={{ totalWomen: 10, totalMen: 20 }} />);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(mockMutate).toHaveBeenCalledWith({
			totalWomen: 10,
			totalMen: 20,
		});
	});

	it("shows validation error message when submitting with zero total", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce initialData={emptyStep1Data()} />);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(
			screen.getByText(
				"Veuillez renseigner les effectifs avant de passer à l'étape suivante.",
			),
		).toBeInTheDocument();
	});

	it("renders previous link pointing to home", () => {
		render(<Step1Workforce initialData={emptyStep1Data()} />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/",
		);
	});
});
