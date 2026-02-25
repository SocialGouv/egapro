import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step6Review } from "../Step6Review";

const mockPush = vi.fn();

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

const mockSubmitMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			submit: {
				useMutation: () => ({
					mutate: mockSubmitMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

describe("Step6Review", () => {
	it("renders title and stepper at step 6", () => {
		render(<Step6Review />);
		expect(screen.getByText("Étape 6 sur 6")).toBeInTheDocument();
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
	});

	it("renders description text", () => {
		render(<Step6Review />);
		expect(
			screen.getByText(/Vérifiez que toutes les informations/),
		).toBeInTheDocument();
	});

	it("renders all 4 recap card titles", () => {
		render(<Step6Review />);
		// "Écart de rémunération" also appears in the submit modal list, so use getAllByText
		expect(
			screen.getAllByText("Écart de rémunération").length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Écart de rémunération variable ou complémentaire")
				.length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText(
				/Proportion de femmes et d.*hommes dans chaque quartile/,
			).length,
		).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("Écart de rémunération par catégories de salariés")
				.length,
		).toBeGreaterThanOrEqual(1);
	});

	it("does not render Modifier buttons", () => {
		render(<Step6Review />);
		expect(screen.queryAllByText("Modifier")).toHaveLength(0);
	});

	it("renders check icons on all 4 cards", () => {
		const { container } = render(<Step6Review />);
		const checkIcons = container.querySelectorAll(".fr-icon-check-line");
		expect(checkIcons).toHaveLength(4);
	});

	it("renders tooltip buttons on cards 3 and 4 only", () => {
		const { container } = render(<Step6Review />);
		const tooltipButtons = container.querySelectorAll(".fr-icon-question-line");
		expect(tooltipButtons).toHaveLength(2);
	});

	it("shows side-by-side Annuelle/Horaire brute with gaps for step 2", () => {
		render(
			<Step6Review
				step2Rows={[
					{
						label: "Annuelle brute moyenne",
						womenValue: "95",
						menValue: "100",
					},
					{
						label: "Horaire brute moyenne",
						womenValue: "90",
						menValue: "100",
					},
					{
						label: "Annuelle brute médiane",
						womenValue: "97",
						menValue: "100",
					},
					{
						label: "Horaire brute médiane",
						womenValue: "80",
						menValue: "100",
					},
				]}
			/>,
		);
		// Side-by-side headers
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
		// Row labels
		expect(screen.getAllByText("Moyenne").length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText("Médiane").length).toBeGreaterThanOrEqual(2);
		// Gap values and badges
		expect(screen.getAllByText("5,0 %").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("3,0 %").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("faible").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("shows 'Aucune donnée renseignée' for empty steps", () => {
		render(<Step6Review />);
		const emptyMessages = screen.getAllByText("Aucune donnée renseignée.");
		expect(emptyMessages.length).toBe(4);
	});

	it("renders step 3 with side-by-side gaps and proportion", () => {
		render(
			<Step6Review
				step3Data={{
					rows: [
						{
							label: "Annuelle brute moyenne",
							womenValue: "95",
							menValue: "100",
						},
						{
							label: "Annuelle brute médiane",
							womenValue: "",
							menValue: "",
						},
					],
					beneficiaryWomen: "45",
					beneficiaryMen: "55",
				}}
			/>,
		);
		expect(screen.getByText("45 %")).toBeInTheDocument();
		expect(screen.getByText("55 %")).toBeInTheDocument();
		expect(screen.getByText("Proportion")).toBeInTheDocument();
	});

	it("renders quartile data stacked annual then hourly", () => {
		render(
			<Step6Review
				step4Categories={[
					{
						name: "annual:1er quartile",
						womenCount: 46,
						menCount: 54,
					},
					{
						name: "annual:2e quartile",
						womenCount: 47,
						menCount: 53,
					},
					{
						name: "hourly:1er quartile",
						womenCount: 40,
						menCount: 60,
					},
					{
						name: "hourly:2e quartile",
						womenCount: 50,
						menCount: 50,
					},
				]}
			/>,
		);
		expect(
			screen.getByText("Rémunération annuelle brute moyenne"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Rémunération horaire brute moyenne"),
		).toBeInTheDocument();
		expect(screen.getAllByText("1er quartile").length).toBe(4);
		expect(screen.getAllByText("Pourcentage de femmes").length).toBe(2);
		expect(screen.getAllByText(/Pourcentage d.*hommes/).length).toBe(2);
	});

	it("renders step 5 category gaps side-by-side", () => {
		render(
			<Step6Review
				step5Categories={[
					{ name: "meta:source:autre" },
					{ name: "cat:0:name:Ingénieurs" },
					{ name: "cat:0:detail:Dev" },
					{ name: "cat:0:effectif", womenCount: 10, menCount: 15 },
					{
						name: "cat:0:annual:base",
						womenValue: "3000",
						menValue: "3200",
					},
					{
						name: "cat:0:annual:variable",
						womenValue: "500",
						menValue: "600",
					},
					{
						name: "cat:0:hourly:base",
						womenValue: "18",
						menValue: "19",
					},
					{
						name: "cat:0:hourly:variable",
						womenValue: "3",
						menValue: "4",
					},
				]}
			/>,
		);
		expect(screen.getByText("Ingénieurs")).toBeInTheDocument();
		// Side-by-side headers
		expect(screen.getAllByText("Annuelle brute").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(screen.getAllByText("Horaire brute").length).toBeGreaterThanOrEqual(
			1,
		);
		// Row labels (2 per column = 4 total)
		expect(screen.getAllByText("Salaire de base").length).toBe(2);
		expect(screen.getAllByText("Composantes variables").length).toBe(2);
		// Badges present
		expect(screen.getAllByText("élevé").length).toBeGreaterThanOrEqual(1);
	});

	it("renders previous link pointing to step 5", () => {
		render(<Step6Review />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration/etape/5",
		);
	});

	it("renders next as a submit button when not submitted", () => {
		render(<Step6Review />);
		expect(
			screen.getByRole("button", { name: /suivant/i }),
		).toBeInTheDocument();
	});

	it("renders next link pointing to home when already submitted", () => {
		render(<Step6Review isSubmitted />);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders both links pointing to home when already submitted", () => {
		render(<Step6Review isSubmitted />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/",
		);
	});
});
