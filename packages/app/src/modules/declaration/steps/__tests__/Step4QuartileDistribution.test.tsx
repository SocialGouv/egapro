import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";

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
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe("Step4QuartileDistribution", () => {
	it("renders two tables with quartile columns", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText("Rémunération annuelle brute moyenne", {
				selector: "h3",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Rémunération horaire brute moyenne", {
				selector: "h3",
			}),
		).toBeInTheDocument();
		// 2 tables + dialog labels (hidden until opened)
		expect(screen.getAllByText("1er quartile").length).toBeGreaterThanOrEqual(
			2,
		);
		expect(screen.getAllByText("Tous les salariés").length).toBe(2);
	});

	it("renders all row labels in both tables", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.getAllByText("Rémunération brute").length).toBe(2);
		expect(
			screen.getAllByText("Nombre de femmes", { selector: "strong" }).length,
		).toBe(2);
		expect(screen.getAllByText("Pourcentage de femmes").length).toBe(2);
		expect(
			screen.getAllByText(/Nombre d'hommes/, { selector: "strong" }).length,
		).toBe(2);
		expect(screen.getAllByText(/Pourcentage d'hommes/).length).toBe(2);
	});

	it("renders description text about quartiles", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText(/répartit l'ensemble des salariés en quatre groupes/),
		).toBeInTheDocument();
	});

	it("renders instruction text", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText(/Vérifiez les informations préremplies et modifiez-les/),
		).toBeInTheDocument();
	});

	it("displays pre-filled data with computed percentages", () => {
		render(
			<Step4QuartileDistribution
				initialAnnualCategories={[
					{
						name: "1er quartile",
						womenCount: 19,
						menCount: 22,
						womenValue: "980",
					},
					{
						name: "2e quartile",
						womenCount: 17,
						menCount: 19,
						womenValue: "1450",
					},
					{
						name: "3e quartile",
						womenCount: 14,
						menCount: 17,
						womenValue: "1750",
					},
					{
						name: "4e quartile",
						womenCount: 5,
						menCount: 10,
						womenValue: "2300",
					},
				]}
				initialHourlyCategories={[
					{
						name: "1er quartile",
						womenValue: "7.2",
					},
					{
						name: "2e quartile",
						womenValue: "10.12",
					},
					{
						name: "3e quartile",
						womenValue: "12.92",
					},
					{
						name: "4e quartile",
						womenValue: "14.93",
					},
				]}
			/>,
		);

		// Check annual remuneration values are formatted
		expect(screen.getByText("980 €")).toBeInTheDocument();
		expect(screen.getByText("2 300 €")).toBeInTheDocument();

		// Check annual women counts
		expect(screen.getAllByText("19").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("17").length).toBeGreaterThanOrEqual(1);

		// Check annual total column (55 women, 68 men)
		expect(screen.getAllByText("55").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("68").length).toBeGreaterThanOrEqual(1);
	});

	it("shows SavedIndicator when initialCategories have data", () => {
		render(
			<Step4QuartileDistribution
				initialAnnualCategories={[
					{ name: "1er quartile", womenCount: 10, menCount: 15 },
					{ name: "2e quartile" },
					{ name: "3e quartile" },
					{ name: "4e quartile" },
				]}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("renders 3 edit buttons per table on rows 1, 2, and 4", () => {
		render(<Step4QuartileDistribution />);
		// 3 buttons × 2 tables = 6 modifier buttons
		const modifierButtons = screen.getAllByRole("button", {
			name: /modifier/i,
		});
		expect(modifierButtons.length).toBe(6);

		// Table 1 (annual) buttons
		expect(
			screen.getByRole("button", {
				name: /modifier la rémunération annuelle/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: /modifier le nombre de femmes \(annuel\)/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: /modifier le nombre d'hommes \(annuel\)/i,
			}),
		).toBeInTheDocument();

		// Table 2 (hourly) buttons
		expect(
			screen.getByRole("button", {
				name: /modifier la rémunération horaire/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: /modifier le nombre de femmes \(horaire\)/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: /modifier le nombre d'hommes \(horaire\)/i,
			}),
		).toBeInTheDocument();
	});

	it("opens remuneration edit dialog with per-quartile inputs", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		await user.click(
			screen.getByRole("button", {
				name: /modifier la rémunération annuelle/i,
			}),
		);

		// Dialog should show title
		expect(screen.getByText("Modifier les données")).toBeInTheDocument();

		// Dialog subtitle matches table title but in a <p> element
		const dialog = document.querySelector("dialog")!;
		const dialogScope = within(dialog);
		expect(
			dialogScope.getByText("Rémunération annuelle brute moyenne"),
		).toBeInTheDocument();

		// 4 quartile inputs should be present
		expect(screen.getByLabelText(/1er quartile/)).toBeInTheDocument();
		expect(screen.getByLabelText(/2e quartile/)).toBeInTheDocument();
		expect(screen.getByLabelText(/3e quartile/)).toBeInTheDocument();
		expect(screen.getByLabelText(/4e quartile/)).toBeInTheDocument();
	});

	it("opens count edit dialog with per-quartile inputs and total", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		await user.click(
			screen.getByRole("button", {
				name: /modifier le nombre de femmes \(annuel\)/i,
			}),
		);

		// Dialog should show count title
		expect(screen.getByText("Modifier les effectifs")).toBeInTheDocument();

		// Subtitle in dialog
		const dialog = document.querySelector("dialog")!;
		const dialogScope = within(dialog);
		expect(dialogScope.getByText("Nombre de femmes")).toBeInTheDocument();

		// Should show Total field
		expect(dialogScope.getByText("Total")).toBeInTheDocument();
	});

	it("saves remuneration values locally but does not show SavedIndicator", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("button", {
				name: /modifier la rémunération annuelle/i,
			}),
		);

		const q1Input = screen.getByLabelText(/1er quartile/);
		await user.clear(q1Input);
		await user.type(q1Input, "980");

		const dialog = document.querySelector("dialog")!;
		const dialogScope = within(dialog);
		await user.click(dialogScope.getByText("Enregistrer"));

		// SavedIndicator only shows when data is persisted in DB
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
		expect(screen.getByText("980 €")).toBeInTheDocument();
	});

	it("rejects negative values in remuneration dialog", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		await user.click(
			screen.getByRole("button", {
				name: /modifier la rémunération annuelle/i,
			}),
		);

		const q1Input = screen.getByLabelText(/1er quartile/);
		await user.clear(q1Input);
		await user.type(q1Input, "-50");
		expect(q1Input).not.toHaveValue(-50);
	});

	it("blocks count exceeding max workforce", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution maxWomen={15} maxMen={25} />);

		await user.click(
			screen.getByRole("button", {
				name: /modifier le nombre de femmes \(annuel\)/i,
			}),
		);

		const q1Input = screen.getByLabelText(/1er quartile/);
		await user.clear(q1Input);
		await user.type(q1Input, "20");

		expect(screen.getByText(/ne peut pas dépasser/i)).toBeInTheDocument();
	});

	it("hourly table opens different dialog than annual", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		await user.click(
			screen.getByRole("button", {
				name: /modifier la rémunération horaire/i,
			}),
		);

		expect(screen.getByText("Modifier les données")).toBeInTheDocument();
		const dialog = document.querySelector("dialog")!;
		const dialogScope = within(dialog);
		expect(
			dialogScope.getByText("Rémunération horaire brute moyenne"),
		).toBeInTheDocument();
	});

	it("renders source text below each table", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.getAllByText(/Source : déclarations sociales/).length).toBe(
			2,
		);
	});

	it("renders interpretation callout", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText(/Écart en défaveur des femmes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Interprétation des résultats/),
		).toBeInTheDocument();
	});

	it("renders accordion", () => {
		render(<Step4QuartileDistribution />);
		expect(
			screen.getByText("Définitions et méthode de calcul"),
		).toBeInTheDocument();
	});

	it("renders previous link pointing to step 3", () => {
		render(<Step4QuartileDistribution />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration/etape/3",
		);
	});
});
