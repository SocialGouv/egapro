import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step2PayGap } from "../Step2PayGap";

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

describe("Step2PayGap", () => {
	it("renders the table with 4 remuneration rows and empty values", () => {
		render(<Step2PayGap />);
		expect(screen.getByText("Annuelle brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Annuelle brute médiane")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute médiane")).toBeInTheDocument();
		expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(4);
	});

	it("renders table headers with sub-text", () => {
		render(<Step2PayGap />);
		expect(screen.getByText("Rémunération")).toBeInTheDocument();
		expect(screen.getByText("Montant en euros")).toBeInTheDocument();
		expect(screen.getByText("Femmes")).toBeInTheDocument();
		expect(screen.getByText("Hommes")).toBeInTheDocument();
		expect(
			screen.getByText("Écart", { selector: "strong" }),
		).toBeInTheDocument();
		expect(screen.getByText("Seuil réglementaire : 5%")).toBeInTheDocument();
	});

	it("shows SavedIndicator when initialRows have data", () => {
		render(
			<Step2PayGap
				initialRows={[
					{
						label: "Annuelle brute moyenne",
						womenValue: "100",
						menValue: "200",
					},
					{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
					{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
					{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
				]}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when initialRows are empty", () => {
		render(<Step2PayGap />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("opens edit modal and rejects negative values", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0] as HTMLElement);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		// Type a valid positive value
		await user.clear(womenInput);
		await user.type(womenInput, "100");
		expect(womenInput).toHaveValue(100);

		// Type a negative value — should be rejected
		await user.clear(womenInput);
		await user.type(womenInput, "-50");
		expect(womenInput).not.toHaveValue(-50);

		// Type a valid value in men input
		await user.clear(menInput);
		await user.type(menInput, "200");
		expect(menInput).toHaveValue(200);
	});

	it("computes gap and shows badge after entering values in modal", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0] as HTMLElement);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "95");
		await user.clear(menInput);
		await user.type(menInput, "100");

		// Gap = |((100-95)/100)*100| = 5.0 % → "élevé" (>= 5)
		expect(screen.getByText("5,0 %")).toBeInTheDocument();
		expect(screen.getByText("élevé")).toBeInTheDocument();
	});

	it("shows 'faible' badge when gap is less than 5%", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0] as HTMLElement);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "97");
		await user.clear(menInput);
		await user.type(menInput, "100");

		// Gap = 3.0 % → "faible"
		expect(screen.getByText("3,0 %")).toBeInTheDocument();
		expect(screen.getByText("faible")).toBeInTheDocument();
	});

	it("saves edit locally but does not show SavedIndicator", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();

		const editButtons = screen.getAllByRole("button", { name: /modifier/i });
		await user.click(editButtons[0] as HTMLElement);

		const womenInput = screen.getByLabelText("Rémunération Femmes");
		const menInput = screen.getByLabelText("Rémunération Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "100");
		await user.clear(menInput);
		await user.type(menInput, "200");

		// The dialog is in the DOM but not visually open in jsdom,
		// so query within the dialog element directly
		const dialog = document.querySelector("dialog") as HTMLElement;
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Enregistrer"));

		// SavedIndicator only shows when data is persisted in DB
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
	});

	it("renders previous link pointing to step 1", () => {
		render(<Step2PayGap />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/1",
		);
	});
});
