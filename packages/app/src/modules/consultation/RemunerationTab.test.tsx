import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { declarationFixture } from "./__fixtures__/declaration";
import { RemunerationTab } from "./RemunerationTab";
import { INDICATOR_TOOLTIPS } from "./tooltips";

const THRESHOLD = "Seuil réglementaire : 5 %";

function renderTab(overrides = {}) {
	return render(
		<RemunerationTab
			declaration={declarationFixture(overrides)}
			threshold={THRESHOLD}
		/>,
	);
}

/** The bubble a trigger points at, resolved through aria-describedby. */
function describedText(button: HTMLElement): string | null {
	const id = button.getAttribute("aria-describedby");
	return id ? (document.getElementById(id)?.textContent ?? null) : null;
}

describe("RemunerationTab", () => {
	it("lays out the four blocks of the maquette, in order", () => {
		renderTab();

		const headings = screen
			.getAllByRole("heading", { level: 3 })
			.map((heading) => heading.textContent);
		expect(headings).toEqual([
			"Répartition des effectifs",
			"Écart de rémunération",
			"Écart de rémunération variable et complémentaire",
			"Proportion de femmes et d’hommes dans chaque quartile de rémunération",
		]);
	});

	it("states the regulatory threshold on both gap blocks", () => {
		renderTab();

		expect(screen.getAllByText(THRESHOLD)).toHaveLength(2);
	});

	it("gives the workforce split as a total, a legend and a table", async () => {
		const user = userEvent.setup();
		renderTab();

		expect(screen.getByText("Total salariés")).toBeInTheDocument();
		expect(screen.getAllByText(/^2\s256$/).length).toBeGreaterThan(0);
		// The legend splits label and figure, so each is asserted on its own node.
		expect(screen.getAllByText("Femmes :").length).toBeGreaterThan(0);
		expect(screen.getAllByText("752 (33 %)").length).toBeGreaterThan(0);
		expect(screen.getAllByText(/^1\s504 \(67 %\)$/).length).toBeGreaterThan(0);

		const accordions = screen.getAllByRole("button", {
			name: "Détails des données",
		});
		// Every disclosure starts closed, and points at a panel that exists.
		for (const accordion of accordions) {
			expect(accordion).toHaveAttribute("aria-expanded", "false");
			const panelId = accordion.getAttribute("aria-controls");
			expect(panelId).toBeTruthy();
			expect(document.getElementById(panelId as string)).not.toBeNull();
		}
		await user.click(accordions[0] as HTMLElement);
	});

	it("attaches every help bubble of the hourly view to its trigger", () => {
		renderTab();

		const expected = [
			INDICATOR_TOOLTIPS.workforce,
			INDICATOR_TOOLTIPS.globalHourlyMean,
			INDICATOR_TOOLTIPS.globalHourlyMedian,
			INDICATOR_TOOLTIPS.variableHourlyMean,
			INDICATOR_TOOLTIPS.variableHourlyMedian,
			INDICATOR_TOOLTIPS.variableBeneficiaries,
			INDICATOR_TOOLTIPS.annualQuartiles,
			INDICATOR_TOOLTIPS.hourlyQuartiles,
		];

		const described = screen
			.getAllByRole("button")
			.map(describedText)
			.filter((text): text is string => text !== null);

		expect(described).toEqual(expect.arrayContaining(expected));
	});

	it("swaps the gap cards, values and bubbles when the period changes", async () => {
		const user = userEvent.setup();
		renderTab();

		expect(
			screen.getByText("Écarts de rémunération horaire brute moyenne"),
		).toBeInTheDocument();
		expect(screen.getByText("7,17 %")).toBeInTheDocument();

		await user.click(
			screen.getAllByRole("radio", {
				name: "Rémunération annuelle",
			})[0] as HTMLElement,
		);

		expect(
			screen.getByText("Écarts de rémunération annuelle brute moyenne"),
		).toBeInTheDocument();
		expect(screen.getByText("0,5 %")).toBeInTheDocument();
		const described = screen
			.getAllByRole("button")
			.map(describedText)
			.filter((text): text is string => text !== null);
		expect(described).toContain(INDICATOR_TOOLTIPS.globalAnnualMean);
		expect(described).not.toContain(INDICATOR_TOOLTIPS.globalHourlyMean);
	});

	it("names the direction of each gap", () => {
		renderTab();

		expect(screen.getAllByText(/Écart en faveur des/).length).toBeGreaterThan(
			0,
		);
		expect(screen.getAllByText("hommes").length).toBeGreaterThan(0);
	});

	it("adds the all-employees line the quartile cards need, derived from the totals", () => {
		renderTab();

		const rows = screen.getAllByText("Tous les salariés");
		// One per quartile card (annual, hourly) in the bars, plus one per table.
		expect(rows.length).toBeGreaterThanOrEqual(2);
		expect(screen.getAllByText("33,33 %").length).toBeGreaterThan(0);
	});

	it("prints a dash instead of a figure when an indicator is missing", () => {
		renderTab({ globalHourlyMeanGap: null });

		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
		expect(screen.getByText("Donnée non disponible")).toBeInTheDocument();
	});

	it("plots the two beneficiary proportions independently", () => {
		renderTab();

		// They are computed against each sex's own headcount, so they do not add
		// up to 100 % and each gets its own full-width bar and legend.
		expect(
			screen.getByText(
				/Femmes bénéficiaires de rémunération variable et complémentaire/,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/Hommes bénéficiaires de rémunération variable et complémentaire/,
			),
		).toBeInTheDocument();
		expect(screen.getAllByText("57,1 %").length).toBeGreaterThan(0);
		expect(screen.getAllByText("66,7 %").length).toBeGreaterThan(0);
	});
});
