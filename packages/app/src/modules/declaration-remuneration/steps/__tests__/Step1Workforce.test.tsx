import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("disables browser autofill on the form", () => {
		const { container } = render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);
		expect(container.querySelector("form")).toHaveAttribute(
			"autocomplete",
			"off",
		);
	});

	it("renders default state with zero totals", () => {
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);
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
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);
		expect(
			screen.getByText(/Période de référence pour le calcul des indicateurs/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders initial data with correct values", () => {
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={{ totalWomen: 10, totalMen: 20 }}
			/>,
		);
		expect(screen.getByLabelText("Nombre de femmes")).toHaveValue("10");
		expect(screen.getByLabelText("Nombre d'hommes")).toHaveValue("20");
		const row = screen
			.getByText("Nombre de salariés")
			.closest("tr") as HTMLElement;
		const cells = within(row).getAllByRole("cell");
		expect(cells[3]).toHaveTextContent("30");
	});

	it("shows SavedIndicator when initial data has values", () => {
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={{ totalWomen: 5, totalMen: 3 }}
			/>,
		);
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("updates women/men values via inline inputs", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);

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
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("calls mutation with updated data on valid submit", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={{ totalWomen: 10, totalMen: 20 }}
			/>,
		);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(mockMutate).toHaveBeenCalledWith({
			totalWomen: 10,
			totalMen: 20,
		});
	});

	it("shows field-level error messages when submitting with empty inputs", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);

		const submitButton = screen.getByRole("button", { name: /suivant/i });
		await user.click(submitButton);

		expect(
			screen.getByText("Veuillez renseigner le nombre de femmes."),
		).toBeInTheDocument();
		expect(
			screen.getByText("Veuillez renseigner le nombre d'hommes."),
		).toBeInTheDocument();
	});

	it("blocks submit when one field is cleared after having a value", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={{ totalWomen: 10, totalMen: 20 }}
			/>,
		);

		await user.clear(screen.getByLabelText("Nombre de femmes"));
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(
			screen.getByText("Veuillez renseigner le nombre de femmes."),
		).toBeInTheDocument();
	});

	it("renders previous link pointing to home", () => {
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1Data()}
			/>,
		);
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("hides the reset warning by default", () => {
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={{ totalWomen: 50, totalMen: 100 }}
			/>,
		);
		expect(
			screen.queryByText(/réinitialise les indicateurs préremplis/),
		).not.toBeInTheDocument();
	});

	it("shows the reset warning when a prefilled value is modified", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				gipPrefillData={{
					step1: { totalWomen: 50, totalMen: 100 },
					step2: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
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
							thresholds: [null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
						hourly: {
							thresholds: [null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
				initialData={{ totalWomen: 50, totalMen: 100 }}
			/>,
		);

		const womenInput = screen.getByLabelText("Nombre de femmes");
		await user.clear(womenInput);
		await user.type(womenInput, "49");

		expect(
			screen.getByText(/réinitialise les indicateurs préremplis/),
		).toBeInTheDocument();
	});

	it("shows reset warning when GIP prefilled field is cleared to empty", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				gipPrefillData={{
					step1: { totalWomen: 50, totalMen: 100 },
					step2: {
						annualMeanWomen: null,
						annualMeanMen: null,
						hourlyMeanWomen: null,
						hourlyMeanMen: null,
						annualMedianWomen: null,
						annualMedianMen: null,
						hourlyMedianWomen: null,
						hourlyMedianMen: null,
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
							thresholds: [null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
						hourly: {
							thresholds: [null, null, null],
							womenCounts: [null, null, null, null],
							menCounts: [null, null, null, null],
						},
					},
					confidenceIndex: null,
					periodEnd: null,
				}}
				initialData={{ totalWomen: 50, totalMen: 100 }}
			/>,
		);

		await user.clear(screen.getByLabelText("Nombre de femmes"));

		expect(
			screen.getByText(/réinitialise les indicateurs préremplis/),
		).toBeInTheDocument();
	});

	describe("confirmation modal", () => {
		beforeEach(() => {
			HTMLDialogElement.prototype.showModal = vi
				.fn()
				.mockImplementation(function (this: HTMLDialogElement) {
					this.setAttribute("open", "");
				});
			HTMLDialogElement.prototype.close = vi.fn().mockImplementation(function (
				this: HTMLDialogElement,
			) {
				this.removeAttribute("open");
			});
		});

		it("shows modal on submit when saved values are changed", async () => {
			const user = userEvent.setup();
			render(
				<Step1Workforce
					declarationSiren="123456789"
					declarationYear={2026}
					initialData={{ totalWomen: 50, totalMen: 100 }}
				/>,
			);

			await user.clear(screen.getByLabelText("Nombre de femmes"));
			await user.type(screen.getByLabelText("Nombre de femmes"), "49");
			await user.click(screen.getByRole("button", { name: /suivant/i }));

			expect(mockMutate).not.toHaveBeenCalled();
			expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
		});

		it("calls mutation after confirming", async () => {
			const user = userEvent.setup();
			render(
				<Step1Workforce
					declarationSiren="123456789"
					declarationYear={2026}
					initialData={{ totalWomen: 50, totalMen: 100 }}
				/>,
			);

			await user.clear(screen.getByLabelText("Nombre de femmes"));
			await user.type(screen.getByLabelText("Nombre de femmes"), "49");
			await user.click(screen.getByRole("button", { name: /suivant/i }));
			await user.click(screen.getByRole("button", { name: /continuer/i }));

			expect(mockMutate).toHaveBeenCalledWith({
				totalWomen: 49,
				totalMen: 100,
			});
		});

		it("does not call mutation when cancelling", async () => {
			const user = userEvent.setup();
			render(
				<Step1Workforce
					declarationSiren="123456789"
					declarationYear={2026}
					initialData={{ totalWomen: 50, totalMen: 100 }}
				/>,
			);

			await user.clear(screen.getByLabelText("Nombre de femmes"));
			await user.type(screen.getByLabelText("Nombre de femmes"), "49");
			await user.click(screen.getByRole("button", { name: /suivant/i }));
			await user.click(screen.getByRole("button", { name: /annuler/i }));

			expect(mockMutate).not.toHaveBeenCalled();
		});

		it("does not show modal when values match initial data", async () => {
			const user = userEvent.setup();
			render(
				<Step1Workforce
					declarationSiren="123456789"
					declarationYear={2026}
					initialData={{ totalWomen: 50, totalMen: 100 }}
				/>,
			);

			await user.click(screen.getByRole("button", { name: /suivant/i }));

			expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
			expect(mockMutate).toHaveBeenCalledWith({
				totalWomen: 50,
				totalMen: 100,
			});
		});
	});

	it("does not show the reset warning when no GIP data is provided", async () => {
		const user = userEvent.setup();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={{ totalWomen: 50, totalMen: 100 }}
			/>,
		);

		const womenInput = screen.getByLabelText("Nombre de femmes");
		await user.clear(womenInput);
		await user.type(womenInput, "49");

		expect(
			screen.queryByText(/réinitialise les indicateurs préremplis/),
		).not.toBeInTheDocument();
	});
});
