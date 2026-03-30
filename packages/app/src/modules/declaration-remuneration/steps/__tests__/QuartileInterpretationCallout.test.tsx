import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { QuartileData } from "~/modules/declaration-remuneration/types";
import { QuartileInterpretationCallout } from "../step4/QuartileInterpretationCallout";

function makeCategories(
	overrides: Partial<QuartileData>[] = [],
): QuartileData[] {
	const defaults: QuartileData[] = [
		{ women: 25, men: 25 },
		{ women: 25, men: 25 },
		{ women: 25, men: 25 },
		{ women: 25, men: 25 },
	];
	return defaults.map((cat, i) => ({ ...cat, ...overrides[i] }));
}

describe("QuartileInterpretationCallout", () => {
	it("returns null when categories do not have 4 items", () => {
		const incomplete: QuartileData[] = [{ women: 10, men: 10 }];

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={incomplete}
				hourlyCategories={incomplete}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});

	it("returns null when Q4 totals are both 0", () => {
		const annual = makeCategories([{}, {}, {}, { women: 0, men: 0 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 0, men: 0 }]);

		const { container } = render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(container.innerHTML).toBe("");
	});

	it("shows women underrepresented when women ratio < 0.4 in Q4", () => {
		const annual = makeCategories([{}, {}, {}, { women: 2, men: 18 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 3, men: 17 }]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Écart en défaveur des femmes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/femmes sont nettement moins présentes/),
		).toBeInTheDocument();
	});

	it("shows balanced case when women ratio is between 0.4 and 0.6 in Q4", () => {
		const annual = makeCategories([{}, {}, {}, { women: 10, men: 10 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 10, men: 10 }]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Équilibre entre hommes et femmes/),
		).toBeInTheDocument();
		expect(screen.getByText(/relativement équilibrée/)).toBeInTheDocument();
	});

	it("shows men underrepresented when women ratio > 0.6 in Q4", () => {
		const annual = makeCategories([{}, {}, {}, { women: 18, men: 2 }]);
		const hourly = makeCategories([{}, {}, {}, { women: 17, men: 3 }]);

		render(
			<QuartileInterpretationCallout
				annualCategories={annual}
				hourlyCategories={hourly}
			/>,
		);

		expect(
			screen.getByText(/Écart en défaveur des hommes/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/hommes sont nettement moins présents/),
		).toBeInTheDocument();
	});
});
