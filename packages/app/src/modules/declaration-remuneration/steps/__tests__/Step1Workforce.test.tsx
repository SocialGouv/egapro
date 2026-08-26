import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GipPrefillData } from "~/modules/declaration-remuneration/shared/gipMdsMapping";
import type { Step1Data } from "~/modules/declaration-remuneration/types";
import { nullGipStep2, nullGipStep3 } from "~/test/gipGapFixtures";
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

const ANNUAL_WOMEN = "Rémunération annuelle — Nombre de femmes";
const ANNUAL_MEN = "Rémunération annuelle — Nombre d'hommes";
const HOURLY_WOMEN = "Rémunération horaire — Nombre de femmes";
const HOURLY_MEN = "Rémunération horaire — Nombre d'hommes";

function step1Data(overrides: Partial<Step1Data> = {}): Step1Data {
	return {
		totalWomen: 0,
		totalMen: 0,
		hourlyWomen: 0,
		hourlyMen: 0,
		...overrides,
	};
}

const FILLED = step1Data({
	totalWomen: 10,
	totalMen: 20,
	hourlyWomen: 30,
	hourlyMen: 40,
});

const SAVED = step1Data({
	totalWomen: 50,
	totalMen: 100,
	hourlyWomen: 50,
	hourlyMen: 100,
});

function emptyGipQuartileTable() {
	return {
		thresholds: [null, null, null],
		referenceWomen: null,
		referenceMen: null,
		womenCounts: [null, null, null, null],
		menCounts: [null, null, null, null],
	} as GipPrefillData["step4"]["annual"];
}

function gipPrefill(step1: GipPrefillData["step1"]): GipPrefillData {
	return {
		step1,
		step2: nullGipStep2(),
		step3: nullGipStep3(),
		step4: { annual: emptyGipQuartileTable(), hourly: emptyGipQuartileTable() },
		confidenceIndex: null,
		periodEnd: null,
	};
}

function renderStep1(
	initialData: Step1Data = step1Data(),
	gipPrefillData?: GipPrefillData,
) {
	return render(
		<Step1Workforce
			declarationSiren="123456789"
			declarationYear={2026}
			gipPrefillData={gipPrefillData}
			indicatorGRequired
			initialData={initialData}
		/>,
	);
}

/** Fill every workforce input so a submit reaches the mutation. */
async function fillAll(
	user: ReturnType<typeof userEvent.setup>,
	values: Step1Data,
) {
	const pairs: [string, number][] = [
		[ANNUAL_WOMEN, values.totalWomen],
		[ANNUAL_MEN, values.totalMen],
		[HOURLY_WOMEN, values.hourlyWomen],
		[HOURLY_MEN, values.hourlyMen],
	];
	for (const [label, value] of pairs) {
		const input = screen.getByLabelText(label);
		await user.clear(input);
		await user.type(input, String(value));
	}
}

describe("Step1Workforce", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("disables browser autofill on the form", () => {
		const { container } = renderStep1();
		expect(container.querySelector("form")).toHaveAttribute(
			"autocomplete",
			"off",
		);
	});

	it("names the read-only fieldset with a screen-reader-only legend (RGAA 11.6/11.7)", () => {
		renderStep1();
		expect(
			screen.getByRole("group", { name: "Effectifs" }),
		).toBeInTheDocument();
	});

	it("renders one row per pay basis with empty inputs by default", () => {
		renderStep1();
		const table = screen.getByRole("table");
		expect(within(table).getByText("Femmes")).toBeInTheDocument();
		expect(within(table).getByText("Hommes")).toBeInTheDocument();
		expect(within(table).getByText("Total")).toBeInTheDocument();
		for (const label of [ANNUAL_WOMEN, ANNUAL_MEN, HOURLY_WOMEN, HOURLY_MEN]) {
			expect(screen.getByLabelText(label)).toHaveValue("");
		}
	});

	it("gives every column header a non-empty accessible name and exposes each pay basis as a rowheader (RGAA 5.7)", () => {
		renderStep1();
		for (const header of screen.getAllByRole("columnheader")) {
			expect(header).toHaveAccessibleName();
		}
		expect(
			screen.getByRole("columnheader", { name: "Nombre de salariés" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Rémunération annuelle" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Rémunération horaire" }),
		).toBeInTheDocument();
	});

	it("renders reference period and mandatory fields notice", () => {
		renderStep1();
		expect(
			screen.getByText(
				/Période de référence pour le calcul des indicateurs : 01\/01\/2025 - 31\/12\/2025\./,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tous les champs sont obligatoires."),
		).toBeInTheDocument();
	});

	it("renders initial data and totals each row independently", () => {
		renderStep1(FILLED);
		expect(screen.getByLabelText(ANNUAL_WOMEN)).toHaveValue("10");
		expect(screen.getByLabelText(ANNUAL_MEN)).toHaveValue("20");
		expect(screen.getByLabelText(HOURLY_WOMEN)).toHaveValue("30");
		expect(screen.getByLabelText(HOURLY_MEN)).toHaveValue("40");

		const annualRow = screen
			.getByRole("rowheader", { name: "Rémunération annuelle" })
			.closest("tr") as HTMLElement;
		expect(within(annualRow).getAllByRole("cell")[2]).toHaveTextContent("30");

		const hourlyRow = screen
			.getByRole("rowheader", { name: "Rémunération horaire" })
			.closest("tr") as HTMLElement;
		expect(within(hourlyRow).getAllByRole("cell")[2]).toHaveTextContent("70");
	});

	it("shows SavedIndicator when initial data has values", () => {
		renderStep1(step1Data({ totalWomen: 5, totalMen: 3 }));
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("shows SavedIndicator when only the hourly row is filled", () => {
		renderStep1(step1Data({ hourlyWomen: 5, hourlyMen: 3 }));
		expect(screen.getByText("Enregistré")).toBeInTheDocument();
	});

	it("does not show SavedIndicator when no initial data", () => {
		renderStep1();
		expect(screen.queryByText("Enregistré")).not.toBeInTheDocument();
	});

	it("updates each row's total from its own inputs", async () => {
		const user = userEvent.setup();
		renderStep1();

		await user.type(screen.getByLabelText(ANNUAL_WOMEN), "15");
		await user.type(screen.getByLabelText(ANNUAL_MEN), "25");
		await user.type(screen.getByLabelText(HOURLY_WOMEN), "5");
		await user.type(screen.getByLabelText(HOURLY_MEN), "5");

		const annualRow = screen
			.getByRole("rowheader", { name: "Rémunération annuelle" })
			.closest("tr") as HTMLElement;
		expect(within(annualRow).getAllByRole("cell")[2]).toHaveTextContent("40");

		const hourlyRow = screen
			.getByRole("rowheader", { name: "Rémunération horaire" })
			.closest("tr") as HTMLElement;
		expect(within(hourlyRow).getAllByRole("cell")[2]).toHaveTextContent("10");
	});

	it("blocks submit while the form is empty", async () => {
		const user = userEvent.setup();
		renderStep1();

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("calls mutation with the four headcounts on valid submit", async () => {
		const user = userEvent.setup();
		renderStep1(FILLED);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledWith({
			totalWomen: 10,
			totalMen: 20,
			hourlyWomen: 30,
			hourlyMen: 40,
		});
	});

	it("names every empty field in a single error alert on submit", async () => {
		const user = userEvent.setup();
		renderStep1();

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const alert = screen.getByRole("alert");
		expect(within(alert).getByText("Champ vide")).toBeInTheDocument();
		expect(alert).toHaveTextContent(
			"Renseignez le nombre de femmes pour la rémunération annuelle.",
		);
		expect(alert).toHaveTextContent(
			"Renseignez le nombre d'hommes pour la rémunération annuelle.",
		);
		expect(alert).toHaveTextContent(
			"Renseignez le nombre de femmes pour la rémunération horaire.",
		);
		expect(alert).toHaveTextContent(
			"Renseignez le nombre d'hommes pour la rémunération horaire.",
		);
		// The maquette keeps the cell free of text: only the error state shows.
		expect(document.querySelector(".fr-error-text")).toBeNull();
		for (const label of [ANNUAL_WOMEN, ANNUAL_MEN, HOURLY_WOMEN, HOURLY_MEN]) {
			expect(screen.getByLabelText(label)).toHaveAttribute(
				"aria-invalid",
				"true",
			);
		}
	});

	it("blocks submit when the hourly row is left empty", async () => {
		const user = userEvent.setup();
		renderStep1(step1Data({ totalWomen: 10, totalMen: 20 }));

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(
			screen.getByLabelText(HOURLY_WOMEN).closest(".fr-input-group--error"),
		).toBeInTheDocument();
	});

	it("blocks submit when one field is cleared after having a value", async () => {
		const user = userEvent.setup();
		renderStep1(FILLED);

		await user.clear(screen.getByLabelText(ANNUAL_WOMEN));
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Renseignez le nombre de femmes pour la rémunération annuelle.",
		);
	});

	it("does not render a previous link (exit is handled by the breadcrumb)", () => {
		renderStep1();
		expect(
			screen.queryByRole("link", { name: /précédent/i }),
		).not.toBeInTheDocument();
	});

	it("hides the reset warning by default", () => {
		renderStep1(SAVED);
		expect(
			screen.queryByText(/réinitialise les indicateurs préremplis/),
		).not.toBeInTheDocument();
	});

	it("shows the reset warning when a prefilled value is modified", async () => {
		const user = userEvent.setup();
		renderStep1(
			SAVED,
			gipPrefill({
				totalWomen: 50,
				totalMen: 100,
				hourlyWomen: 50,
				hourlyMen: 100,
			}),
		);

		const womenInput = screen.getByLabelText(ANNUAL_WOMEN);
		await user.clear(womenInput);
		await user.type(womenInput, "49");

		expect(
			screen.getByText(/réinitialise les indicateurs préremplis/),
		).toBeInTheDocument();
	});

	it("shows the reset warning when a prefilled hourly value is modified", async () => {
		const user = userEvent.setup();
		renderStep1(
			SAVED,
			gipPrefill({
				totalWomen: 50,
				totalMen: 100,
				hourlyWomen: 50,
				hourlyMen: 100,
			}),
		);

		const hourlyInput = screen.getByLabelText(HOURLY_WOMEN);
		await user.clear(hourlyInput);
		await user.type(hourlyInput, "49");

		expect(
			screen.getByText(/réinitialise les indicateurs préremplis/),
		).toBeInTheDocument();
	});

	it("shows reset warning when GIP prefilled field is cleared to empty", async () => {
		const user = userEvent.setup();
		renderStep1(
			SAVED,
			gipPrefill({
				totalWomen: 50,
				totalMen: 100,
				hourlyWomen: 50,
				hourlyMen: 100,
			}),
		);

		await user.clear(screen.getByLabelText(ANNUAL_WOMEN));

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
			renderStep1(SAVED);

			await user.clear(screen.getByLabelText(ANNUAL_WOMEN));
			await user.type(screen.getByLabelText(ANNUAL_WOMEN), "49");
			await user.click(screen.getByRole("button", { name: /suivant/i }));

			expect(mockMutate).not.toHaveBeenCalled();
			expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
		});

		it("shows modal when only the hourly row changed", async () => {
			const user = userEvent.setup();
			renderStep1(SAVED);

			await user.clear(screen.getByLabelText(HOURLY_MEN));
			await user.type(screen.getByLabelText(HOURLY_MEN), "99");
			await user.click(screen.getByRole("button", { name: /suivant/i }));

			expect(mockMutate).not.toHaveBeenCalled();
			expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
		});

		it("calls mutation after confirming", async () => {
			const user = userEvent.setup();
			renderStep1(SAVED);

			await user.clear(screen.getByLabelText(ANNUAL_WOMEN));
			await user.type(screen.getByLabelText(ANNUAL_WOMEN), "49");
			await user.click(screen.getByRole("button", { name: /suivant/i }));
			await user.click(screen.getByRole("button", { name: /continuer/i }));

			expect(mockMutate).toHaveBeenCalledWith({
				totalWomen: 49,
				totalMen: 100,
				hourlyWomen: 50,
				hourlyMen: 100,
			});
		});

		it("does not call mutation when cancelling", async () => {
			const user = userEvent.setup();
			renderStep1(SAVED);

			await user.clear(screen.getByLabelText(ANNUAL_WOMEN));
			await user.type(screen.getByLabelText(ANNUAL_WOMEN), "49");
			await user.click(screen.getByRole("button", { name: /suivant/i }));
			await user.click(screen.getByRole("button", { name: /annuler/i }));

			expect(mockMutate).not.toHaveBeenCalled();
		});

		it("does not show modal when values match initial data", async () => {
			const user = userEvent.setup();
			renderStep1(SAVED);

			await user.click(screen.getByRole("button", { name: /suivant/i }));

			expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
			expect(mockMutate).toHaveBeenCalledWith({
				totalWomen: 50,
				totalMen: 100,
				hourlyWomen: 50,
				hourlyMen: 100,
			});
		});
	});

	it("does not show the reset warning when no GIP data is provided", async () => {
		const user = userEvent.setup();
		renderStep1(SAVED);

		const womenInput = screen.getByLabelText(ANNUAL_WOMEN);
		await user.clear(womenInput);
		await user.type(womenInput, "49");

		expect(
			screen.queryByText(/réinitialise les indicateurs préremplis/),
		).not.toBeInTheDocument();
	});

	it("submits every headcount typed by hand", async () => {
		const user = userEvent.setup();
		renderStep1();

		await fillAll(user, FILLED);
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledWith({
			totalWomen: 10,
			totalMen: 20,
			hourlyWomen: 30,
			hourlyMen: 40,
		});
	});
});
