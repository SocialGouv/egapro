import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QuartileData } from "~/modules/declaration-remuneration";
import {
	nullGipStep2,
	nullGipStep3,
	nullGipStep4,
} from "~/test/gipGapFixtures";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep4: {
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
	mockMutate.mockClear();
});

/** Step 1 headcount each table is checked against, one pair per pay basis. */
const TOTAL_WOMEN = 40;
const TOTAL_MEN = 32;
const HOURLY_WOMEN = 36;
const HOURLY_MEN = 28;

type Counts = [number, number, number, number];

const MATCHING_WOMEN: Counts = [10, 10, 10, 10];
const MATCHING_MEN: Counts = [8, 8, 8, 8];
const HOURLY_MATCHING_WOMEN: Counts = [9, 9, 9, 9];
const HOURLY_MATCHING_MEN: Counts = [7, 7, 7, 7];

function quartiles(women: Counts, men: Counts): QuartileData[] {
	return [
		{ threshold: "10000", women: women[0], men: men[0] },
		{ threshold: "20000", women: women[1], men: men[1] },
		{ threshold: "30000", women: women[2], men: men[2] },
		{ threshold: undefined, women: women[3], men: men[3] },
	];
}

// A GIP payload is what makes the "Source : DSN" note render; the saved
// initialData wins over it, so the counts under test stay the ones passed in.
const SOURCE_NOTE_PREFILL = {
	step1: {
		totalWomen: TOTAL_WOMEN,
		totalMen: TOTAL_MEN,
		hourlyWomen: HOURLY_WOMEN,
		hourlyMen: HOURLY_MEN,
	},
	step2: nullGipStep2(),
	step3: nullGipStep3(),
	step4: nullGipStep4(),
	confidenceIndex: "0.85",
	periodEnd: "2026-12-31",
};

// Spread, not destructured: `undefined` must mean "step 1 not filled in yet".
function renderStep4({
	annual = quartiles(MATCHING_WOMEN, MATCHING_MEN),
	hourly = quartiles(HOURLY_MATCHING_WOMEN, HOURLY_MATCHING_MEN),
	withSourceNote = false,
	...reference
}: {
	annual?: QuartileData[];
	hourly?: QuartileData[];
	withSourceNote?: boolean;
	maxWomen?: number;
	maxMen?: number;
	hourlyMaxWomen?: number;
	hourlyMaxMen?: number;
} = {}) {
	return render(
		<Step4QuartileDistribution
			declarationSiren="123456789"
			declarationYear={2025}
			gipPrefillData={withSourceNote ? SOURCE_NOTE_PREFILL : undefined}
			hourlyMaxMen={HOURLY_MEN}
			hourlyMaxWomen={HOURLY_WOMEN}
			indicatorGRequired
			initialData={{ annual, hourly }}
			maxMen={TOTAL_MEN}
			maxWomen={TOTAL_WOMEN}
			{...reference}
		/>,
	);
}

const ANNUAL_WOMEN_ERROR =
	"Le nombre total de femmes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total annuel : 40).";
const HOURLY_WOMEN_ERROR =
	"Le nombre total de femmes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total horaire : 36).";
const HOURLY_MEN_ERROR =
	"Le nombre total d'hommes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total horaire : 28).";

describe("Step4QuartileDistribution — headcount coherence control", () => {
	it("shows no coherence message when both tables match the step 1 headcount", () => {
		renderStep4();
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
		expect(screen.queryByText("Données incohérentes")).not.toBeInTheDocument();
	});

	it("renders no coherence alert while both tables match", () => {
		renderStep4();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("reports a diverging total on load, before any submission", () => {
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });
		expect(screen.getByText(ANNUAL_WOMEN_ERROR)).toBeInTheDocument();
		expect(screen.getByText("Données incohérentes")).toBeInTheDocument();
	});

	it("controls the hourly table too, with no GIP prefill in play", () => {
		renderStep4({ hourly: quartiles(HOURLY_MATCHING_WOMEN, [7, 7, 7, 5]) });
		expect(screen.getByText(HOURLY_MEN_ERROR)).toBeInTheDocument();
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
	});

	it("holds the hourly table to the hourly headcount, not the annual one", () => {
		renderStep4({ hourly: quartiles(MATCHING_WOMEN, MATCHING_MEN) });
		expect(screen.getByText(HOURLY_MEN_ERROR)).toBeInTheDocument();
		expect(screen.getByText(HOURLY_WOMEN_ERROR)).toBeInTheDocument();
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
	});

	it("renders each message inside its own table block, after the table", () => {
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });
		const annualTable = screen.getByRole("table", {
			name: "Rémunération annuelle brute moyenne",
		});
		const alert = screen
			.getByText(ANNUAL_WOMEN_ERROR)
			.closest('[role="alert"]');
		expect(alert).not.toBeNull();
		expect(alert?.closest(".tableWrapper")).toBe(
			annualTable.closest(".tableWrapper"),
		);
		expect(
			annualTable.compareDocumentPosition(alert as HTMLElement) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(screen.queryByText(HOURLY_MEN_ERROR)).not.toBeInTheDocument();
	});

	it("places the message below the DSN source note", () => {
		renderStep4({
			annual: quartiles([10, 10, 10, 11], MATCHING_MEN),
			withSourceNote: true,
		});
		const alert = screen
			.getByText(ANNUAL_WOMEN_ERROR)
			.closest('[role="alert"]');
		const sourceNote = screen
			.getAllByText(/^Source\s*:\s*DSN/)[0]
			?.closest("p");
		expect(sourceNote).not.toBeNull();
		expect(
			(sourceNote as HTMLElement).compareDocumentPosition(
				alert as HTMLElement,
			) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("reports each diverging table once, and only under that table", () => {
		renderStep4({
			annual: quartiles([10, 10, 10, 11], MATCHING_MEN),
			hourly: quartiles(HOURLY_MATCHING_WOMEN, [7, 7, 7, 5]),
		});
		expect(screen.getAllByText("Données incohérentes")).toHaveLength(2);
		expect(screen.getAllByText(ANNUAL_WOMEN_ERROR)).toHaveLength(1);
		expect(screen.getAllByText(HOURLY_MEN_ERROR)).toHaveLength(1);
	});

	it("appears live as soon as an edit makes a complete column diverge", async () => {
		const user = userEvent.setup();
		renderStep4();
		const cell = screen.getByLabelText(/Nombre de femmes 4e quartile annuel/i);
		await user.clear(cell);
		await user.type(cell, "11");
		expect(screen.getByText(ANNUAL_WOMEN_ERROR)).toBeInTheDocument();
	});

	it("disappears once the total is corrected", async () => {
		const user = userEvent.setup();
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });
		expect(screen.getByText(ANNUAL_WOMEN_ERROR)).toBeInTheDocument();
		const cell = screen.getByLabelText(/Nombre de femmes 4e quartile annuel/i);
		await user.clear(cell);
		await user.type(cell, "10");
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
	});

	it("stays silent while a column is still incomplete", async () => {
		const user = userEvent.setup();
		renderStep4();
		const cell = screen.getByLabelText(/Nombre de femmes 4e quartile annuel/i);
		await user.clear(cell);
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
	});

	it("blocks the submission on a coherence error alone, with no field error", async () => {
		const user = userEvent.setup();
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(screen.queryAllByText("Effectif obligatoire")).toHaveLength(0);
		expect(screen.queryAllByText("Le seuil est obligatoire")).toHaveLength(0);
	});

	it("submits when every total matches the step 1 headcount", async () => {
		const user = userEvent.setup();
		renderStep4();

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledOnce();
		});
	});

	it("uses one standardized alert per diverging table on submit", async () => {
		const user = userEvent.setup();
		renderStep4({
			annual: quartiles([10, 10, 10, 11], MATCHING_MEN),
			hourly: quartiles(HOURLY_MATCHING_WOMEN, [7, 7, 7, 5]),
		});

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(screen.getAllByRole("alert")).toHaveLength(2);
		expect(screen.getAllByText("Données incohérentes")).toHaveLength(2);
	});

	it("focuses the first diverging table's message on submit", async () => {
		const user = userEvent.setup();
		renderStep4({ hourly: quartiles(HOURLY_MATCHING_WOMEN, [7, 7, 7, 5]) });

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const target = screen.getByText(HOURLY_MEN_ERROR).closest('[role="alert"]');
		expect(target).toHaveAttribute("tabindex", "-1");
		await waitFor(() => {
			expect(document.activeElement).toBe(target);
		});
	});

	it("lists only the field errors in the summary alert", async () => {
		const user = userEvent.setup();
		renderStep4({
			annual: [
				{ threshold: "", women: 10, men: 8 },
				{ threshold: "20000", women: 10, men: 8 },
				{ threshold: "30000", women: 10, men: 8 },
				{ threshold: undefined, women: 11, men: 8 },
			],
		});

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const recap = screen
			.getAllByRole("alert")
			.find((alert) => alert.textContent?.includes("Champ vide"));
		expect(recap).toBeDefined();
		expect(
			recap?.querySelector('a[href="#step4-annual-q1-max"]'),
		).toHaveTextContent("Le seuil est obligatoire");
		expect(screen.getByText(ANNUAL_WOMEN_ERROR)).toBeInTheDocument();
	});

	it("runs no control and blocks nothing when the step 1 headcount is unknown", async () => {
		const user = userEvent.setup();
		renderStep4({
			annual: quartiles([10, 10, 10, 11], MATCHING_MEN),
			maxWomen: undefined,
			maxMen: undefined,
		});

		expect(screen.queryByText("Données incohérentes")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledOnce();
		});
	});

	it("controls the sex whose headcount is known and ignores the other", () => {
		renderStep4({
			annual: quartiles([10, 10, 10, 11], [8, 8, 8, 6]),
			maxMen: undefined,
		});
		expect(screen.getByText(ANNUAL_WOMEN_ERROR)).toBeInTheDocument();
		expect(
			screen.queryByText(/nombre total annuel : 32/),
		).not.toBeInTheDocument();
	});
});
