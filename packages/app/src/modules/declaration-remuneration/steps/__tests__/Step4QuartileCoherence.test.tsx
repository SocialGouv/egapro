import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QuartileData } from "~/modules/declaration-remuneration";
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

/** Step 1 headcount both tables are now checked against. */
const TOTAL_WOMEN = 40;
const TOTAL_MEN = 32;

type Counts = [number, number, number, number];

const MATCHING_WOMEN: Counts = [10, 10, 10, 10];
const MATCHING_MEN: Counts = [8, 8, 8, 8];

function quartiles(women: Counts, men: Counts): QuartileData[] {
	return [
		{ threshold: "10000", women: women[0], men: men[0] },
		{ threshold: "20000", women: women[1], men: men[1] },
		{ threshold: "30000", women: women[2], men: men[2] },
		{ threshold: undefined, women: women[3], men: men[3] },
	];
}

// Spread, not destructured: `undefined` must mean "step 1 not filled in yet".
function renderStep4({
	annual = quartiles(MATCHING_WOMEN, MATCHING_MEN),
	hourly = quartiles(MATCHING_WOMEN, MATCHING_MEN),
	...reference
}: {
	annual?: QuartileData[];
	hourly?: QuartileData[];
	maxWomen?: number;
	maxMen?: number;
} = {}) {
	return render(
		<Step4QuartileDistribution
			declarationSiren="123456789"
			declarationYear={2025}
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
const HOURLY_MEN_ERROR =
	"Le nombre total d'hommes renseigné ne correspond pas au nombre indiqué dans le tableau « Effectifs physiques pris en compte pour le calcul des indicateurs » (nombre total horaire : 32).";

describe("Step4QuartileDistribution — headcount coherence control", () => {
	it("shows no coherence message when both tables match the step 1 headcount", () => {
		renderStep4();
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
		expect(screen.queryByText("Nombre de salariés")).not.toBeInTheDocument();
	});

	it("keeps a polite live region mounted under each table even with no error", () => {
		const { container } = renderStep4();
		const wrappers = container.querySelectorAll(".tableWrapper");
		expect(wrappers).toHaveLength(2);
		for (const wrapper of wrappers) {
			expect(
				wrapper.querySelector('[aria-live="polite"][aria-atomic="true"]'),
			).not.toBeNull();
		}
	});

	it("reports a diverging total on load, before any submission", () => {
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });
		expect(screen.getByText(ANNUAL_WOMEN_ERROR)).toBeInTheDocument();
		expect(screen.getByText("Nombre de salariés")).toBeInTheDocument();
	});

	it("controls the hourly table too, with no GIP prefill in play", () => {
		renderStep4({ hourly: quartiles(MATCHING_WOMEN, [8, 8, 8, 6]) });
		expect(screen.getByText(HOURLY_MEN_ERROR)).toBeInTheDocument();
		expect(screen.queryByText(ANNUAL_WOMEN_ERROR)).not.toBeInTheDocument();
	});

	it("renders each message inside its own table block, after the table", () => {
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });
		const annualTable = screen.getByRole("table", {
			name: "Rémunération annuelle brute moyenne",
		});
		const alert = document.getElementById("step4-coherence-annual");
		expect(alert).not.toBeNull();
		expect(alert?.closest(".tableWrapper")).toBe(
			annualTable.closest(".tableWrapper"),
		);
		expect(
			annualTable.compareDocumentPosition(alert as HTMLElement) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(document.getElementById("step4-coherence-hourly")).toBeNull();
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

	it("anchors the recap alert on each diverging table", async () => {
		const user = userEvent.setup();
		renderStep4({
			annual: quartiles([10, 10, 10, 11], MATCHING_MEN),
			hourly: quartiles(MATCHING_WOMEN, [8, 8, 8, 6]),
		});

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		const recap = screen.getByRole("alert");
		expect(recap).toHaveTextContent("Le formulaire contient des erreurs");
		expect(
			recap.querySelector('a[href="#step4-coherence-annual"]'),
		).toHaveTextContent(
			"Nombre de salariés (rémunération annuelle) — le total de femmes ne correspond pas à la référence (40).",
		);
		expect(
			recap.querySelector('a[href="#step4-coherence-hourly"]'),
		).toHaveTextContent(
			"Nombre de salariés (rémunération horaire) — le total d'hommes ne correspond pas à la référence (32).",
		);
	});

	it("targets a focusable alert with every recap anchor", async () => {
		const user = userEvent.setup();
		renderStep4({ annual: quartiles([10, 10, 10, 11], MATCHING_MEN) });

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(
			screen
				.getByRole("alert")
				.querySelector('a[href="#step4-coherence-annual"]'),
		).not.toBeNull();
		const target = document.getElementById("step4-coherence-annual");
		expect(target).toHaveAttribute("tabindex", "-1");
		expect(target).toHaveTextContent(ANNUAL_WOMEN_ERROR);
	});

	it("still lists the field errors in the recap alongside the coherence ones", async () => {
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

		const recap = screen.getByRole("alert");
		expect(
			recap.querySelector('a[href="#step4-annual-q1-max"]'),
		).toHaveTextContent("Le seuil est obligatoire");
		expect(
			recap.querySelector('a[href="#step4-coherence-annual"]'),
		).not.toBeNull();
	});

	it("runs no control and blocks nothing when the step 1 headcount is unknown", async () => {
		const user = userEvent.setup();
		renderStep4({
			annual: quartiles([10, 10, 10, 11], MATCHING_MEN),
			maxWomen: undefined,
			maxMen: undefined,
		});

		expect(screen.queryByText("Nombre de salariés")).not.toBeInTheDocument();
		expect(document.getElementById("step4-coherence-annual")).toBeNull();

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
