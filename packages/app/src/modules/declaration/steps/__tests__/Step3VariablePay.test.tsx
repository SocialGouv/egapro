import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step3VariablePay } from "../Step3VariablePay";

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

// jsdom does not implement HTMLDialogElement methods
beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe("Step3VariablePay", () => {
	it("renders the pay gap table with 4 rows and empty values", () => {
		render(<Step3VariablePay />);
		expect(screen.getByText("Annuelle brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Annuelle brute médiane")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute médiane")).toBeInTheDocument();
		expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(4);
	});

	it("renders the beneficiaries table with workforce totals", () => {
		render(<Step3VariablePay maxWomen={50} maxMen={60} />);
		expect(
			screen.getByText(
				"Bénéficiaires de composantes variables ou complémentaires",
				{
					selector: "strong",
				},
			),
		).toBeInTheDocument();
		expect(screen.getByText("Total de salariés")).toBeInTheDocument();
		expect(
			screen.getByText("Bénéficiaires", { selector: "th" }),
		).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
		// Step 1 workforce totals should be pre-filled
		expect(screen.getByText("50")).toBeInTheDocument();
		expect(screen.getByText("60")).toBeInTheDocument();
	});

	it("renders table headers with sub-text and seuil réglementaire", () => {
		render(<Step3VariablePay />);
		expect(
			screen.getByText("Rémunération variable ou complémentaire"),
		).toBeInTheDocument();
		expect(screen.getByText("Montant en euros")).toBeInTheDocument();
		expect(screen.getByText("Seuil réglementaire : 5%")).toBeInTheDocument();
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

	it("opens pay edit modal and rejects negative values", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0]!);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "100");
		expect(womenInput).toHaveValue(100);

		// Negative value should be rejected
		await user.clear(womenInput);
		await user.type(womenInput, "-50");
		expect(womenInput).not.toHaveValue(-50);

		await user.clear(menInput);
		await user.type(menInput, "200");
		expect(menInput).toHaveValue(200);
	});

	it("computes gap and shows badge in pay edit modal", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0]!);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "95");
		await user.clear(menInput);
		await user.type(menInput, "100");

		// Gap = |((100-95)/100)*100| = 5.0 % → "élevé"
		expect(screen.getByText("5,0 %")).toBeInTheDocument();
		expect(screen.getByText("élevé")).toBeInTheDocument();
	});

	it("saves pay edit locally but does not show SavedIndicator", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0]!);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "100");
		await user.clear(menInput);
		await user.type(menInput, "200");

		const dialogs = document.querySelectorAll("dialog");
		const payDialog = dialogs[0]!;
		const dialogScope = within(payDialog);
		await user.click(dialogScope.getByText("Enregistrer"));

		// SavedIndicator only shows when data is persisted in DB
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
		expect(screen.getByText("100 €")).toBeInTheDocument();
		expect(screen.getByText("200 €")).toBeInTheDocument();
	});

	it("opens beneficiary edit modal and saves values", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay />);

		// Click the first beneficiary edit button (femmes)
		const benefEditButton = screen.getByRole("button", {
			name: /modifier les bénéficiaires femmes/i,
		});
		await user.click(benefEditButton);

		const womenInput = screen.getByLabelText("Nombre de bénéficiaires Femmes");
		const menInput = screen.getByLabelText("Nombre de bénéficiaires Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "10");
		await user.clear(menInput);
		await user.type(menInput, "20");

		const dialogs = document.querySelectorAll("dialog");
		const benefDialog = dialogs[1]!;
		const dialogScope = within(benefDialog);
		await user.click(dialogScope.getByText("Enregistrer"));

		// SavedIndicator only shows when data is persisted in DB
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("20")).toBeInTheDocument();
	});

	it("blocks beneficiary count exceeding max workforce", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay maxMen={25} maxWomen={15} />);

		const benefEditButton = screen.getByRole("button", {
			name: /modifier les bénéficiaires femmes/i,
		});
		await user.click(benefEditButton);

		const womenInput = screen.getByLabelText("Nombre de bénéficiaires Femmes");

		await user.clear(womenInput);
		await user.type(womenInput, "20");

		// Should show validation error since 20 > 15
		expect(screen.getByText(/ne peut pas dépasser/i)).toBeInTheDocument();
	});

	it("renders previous link pointing to step 2", () => {
		render(<Step3VariablePay />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration/etape/2",
		);
	});
});
