import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step3VariablePay } from "../Step3VariablePay";

const mockMutate = vi.fn();

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

describe("Step3VariablePay", () => {
	it("renders the pay gap table with 4 rows", () => {
		render(<Step3VariablePay />);
		expect(screen.getByText("Annuelle brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Annuelle brute médiane")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute médiane")).toBeInTheDocument();
	});

	it("renders the beneficiaries table with workforce totals", () => {
		render(<Step3VariablePay maxMen={60} maxWomen={50} />);
		expect(screen.getByText(/Total de salariés\s*:\s*110/)).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
		expect(screen.getByText("50")).toBeInTheDocument();
		expect(screen.getByText("60")).toBeInTheDocument();
	});

	it("renders instruction text and mandatory fields notice", () => {
		render(<Step3VariablePay />);
		expect(
			screen.getByText(
				"Renseignez les informations avant de valider vos indicateurs.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders table headers with line break in column header", () => {
		const { container } = render(<Step3VariablePay />);
		expect(screen.getByText(/Rémunération variable/)).toBeInTheDocument();
		expect(screen.getByText("Seuil réglementaire : 5%")).toBeInTheDocument();

		const headerBr = container.querySelector("th br");
		expect(headerBr).toBeInTheDocument();
	});

	it("shows SavedIndicator when initialData has data", () => {
		render(
			<Step3VariablePay
				initialData={{
					rows: [
						{
							label: "Annuelle brute moyenne",
							womenValue: "100",
							menValue: "200",
						},
						{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
						{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
						{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
					],
					beneficiaryWomen: "",
					beneficiaryMen: "",
				}}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when initialData is empty", () => {
		render(<Step3VariablePay />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("updates pay gap values via inline inputs and rejects negative values", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		const womenInput = screen.getByLabelText("Annuelle brute moyenne — Femmes");
		const menInput = screen.getByLabelText("Annuelle brute moyenne — Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "100");
		expect(womenInput).toHaveValue("100");

		// Negative value should be rejected (minus sign is filtered out)
		await user.clear(womenInput);
		await user.type(womenInput, "-50");
		expect(womenInput).not.toHaveValue("-50");

		await user.clear(menInput);
		await user.type(menInput, "200");
		expect(menInput).toHaveValue("200");
	});

	it("computes gap and shows badge after entering values", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		const womenInput = screen.getByLabelText("Annuelle brute moyenne — Femmes");
		const menInput = screen.getByLabelText("Annuelle brute moyenne — Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "95");
		await user.clear(menInput);
		await user.type(menInput, "100");

		// Gap = 5.0 %
		expect(screen.getByText("5,0 %")).toBeInTheDocument();
		expect(screen.getByText("élevé")).toBeInTheDocument();
	});

	it("updates beneficiary values via inline inputs", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		const womenInput = screen.getByLabelText("Bénéficiaires femmes");
		const menInput = screen.getByLabelText("Bénéficiaires hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "10");
		expect(womenInput).toHaveValue(10);

		await user.clear(menInput);
		await user.type(menInput, "20");
		expect(menInput).toHaveValue(20);
	});

	it("blocks beneficiary count exceeding max workforce", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay maxMen={25} maxWomen={15} />);

		const womenInput = screen.getByLabelText("Bénéficiaires femmes");

		await user.clear(womenInput);
		await user.type(womenInput, "20");

		// Should show validation error since 20 > 15
		expect(screen.getByText(/ne peut pas dépasser/i)).toBeInTheDocument();
	});

	it("renders previous link pointing to step 2", () => {
		render(<Step3VariablePay />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/2",
		);
	});
});
