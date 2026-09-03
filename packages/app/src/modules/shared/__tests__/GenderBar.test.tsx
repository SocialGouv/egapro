import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleGenderBar, StackedGenderBar } from "~/modules/shared/GenderBar";

describe("StackedGenderBar", () => {
	it("carries the figures in the legend, not in the bar", () => {
		const { container } = render(
			<StackedGenderBar
				menLabel="Hommes : 67 %"
				menPercent={67}
				womenLabel="Femmes : 33 %"
				womenPercent={33}
			/>,
		);

		expect(screen.getByText("Femmes : 33 %")).toBeInTheDocument();
		expect(screen.getByText("Hommes : 67 %")).toBeInTheDocument();
		// The track duplicates the legend visually, so it stays out of the
		// accessibility tree; the "Détails des données" table is the text version.
		expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
	});

	it("draws a zero-width segment for a missing value", () => {
		const { container } = render(
			<StackedGenderBar
				menLabel="Hommes : —"
				menPercent={null}
				womenLabel="Femmes : —"
				womenPercent={null}
			/>,
		);

		const segments = container.querySelectorAll("span[class]");
		for (const segment of Array.from(segments)) {
			expect(segment.className).not.toMatch(/w100/);
		}
	});
});

describe("SingleGenderBar", () => {
	it("renders one labelled bar", () => {
		render(
			<SingleGenderBar gender="women" label="Femmes : 66,7 %" percent={66.7} />,
		);

		expect(screen.getByText("Femmes : 66,7 %")).toBeInTheDocument();
	});
});
