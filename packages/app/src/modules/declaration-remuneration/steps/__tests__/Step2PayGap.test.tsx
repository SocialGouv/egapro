import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step2PayGap } from "../Step2PayGap";

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

describe("Step2PayGap", () => {
	it("renders the table with 4 remuneration rows", () => {
		render(<Step2PayGap />);
		expect(screen.getByText("Annuelle brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute moyenne")).toBeInTheDocument();
		expect(screen.getByText("Annuelle brute médiane")).toBeInTheDocument();
		expect(screen.getByText("Horaire brute médiane")).toBeInTheDocument();
	});

	it("renders instruction text and mandatory fields notice", () => {
		render(<Step2PayGap />);
		expect(
			screen.getByText(
				"Renseignez les informations avant de valider vos indicateurs.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders table headers", () => {
		render(<Step2PayGap />);
		expect(screen.getByText("Rémunération")).toBeInTheDocument();
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

	it("updates values via inline inputs and rejects negative values", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

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
		render(<Step2PayGap />);

		const womenInput = screen.getByLabelText("Annuelle brute moyenne — Femmes");
		const menInput = screen.getByLabelText("Annuelle brute moyenne — Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "95");
		await user.clear(menInput);
		await user.type(menInput, "100");

		// Gap = |((100-95)/100)*100| = 5.0 %
		expect(screen.getByText("5,0 %")).toBeInTheDocument();
		expect(screen.getByText("élevé")).toBeInTheDocument();
	});

	it("shows no badge when gap is less than 5%", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

		const womenInput = screen.getByLabelText("Annuelle brute moyenne — Femmes");
		const menInput = screen.getByLabelText("Annuelle brute moyenne — Hommes");

		await user.clear(womenInput);
		await user.type(womenInput, "97");
		await user.clear(menInput);
		await user.type(menInput, "100");

		// Gap = 3.0 %
		expect(screen.getByText("3,0 %")).toBeInTheDocument();
		expect(screen.queryByText("faible")).not.toBeInTheDocument();
		expect(screen.queryByText("élevé")).not.toBeInTheDocument();
	});

	it("renders previous link pointing to step 1", () => {
		render(<Step2PayGap />);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/etape/1",
		);
	});

	it("uses gipPrefillData when no initialRows", () => {
		render(
			<Step2PayGap
				gipPrefillData={{
					step1: { totalWomen: 100, totalMen: 100 },
					step2: {
						annualMeanWomen: "35000",
						annualMeanMen: "38000",
						hourlyMeanWomen: "18",
						hourlyMeanMen: "20",
						annualMedianWomen: "33000",
						annualMedianMen: "36000",
						hourlyMedianWomen: "17",
						hourlyMedianMen: "19",
					},
					step3: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
						beneficiaryCountWomen: null,
						beneficiaryCountMen: null,
					},
					step4: {
						annual: {
							thresholds: [null, null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
						hourly: {
							thresholds: [null, null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
					},
					confidenceIndex: null,
					periodEnd: "2026-12-31",
				}}
			/>,
		);
		// GIP rows should be used — check prefilled values
		const womenInput = screen.getByLabelText("Annuelle brute moyenne — Femmes");
		expect(womenInput).toHaveValue("35\u202f000");
	});

	it("shows validation error on submit when fields are incomplete", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap />);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(
			screen.getByText(
				/Veuillez renseigner toutes les données de rémunération/,
			),
		).toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});
});
