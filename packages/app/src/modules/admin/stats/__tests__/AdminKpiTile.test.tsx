import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminKpiTile } from "../AdminKpiTile";

describe("AdminKpiTile", () => {
	it("renders the title, value and subtitle", () => {
		render(
			<AdminKpiTile
				subtitle="4 213 / 5 738 entreprises"
				title="Taux de déclaration 2026"
				value="73,4 %"
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Taux de déclaration 2026" }),
		).toBeInTheDocument();
		expect(screen.getByText("73,4 %")).toBeInTheDocument();
		expect(screen.getByText("4 213 / 5 738 entreprises")).toBeInTheDocument();
	});

	it("does not render a delta badge when deltaPoints is null", () => {
		const { container } = render(
			<AdminKpiTile
				deltaPoints={null}
				title="Taux de déclaration 2026"
				value="73,4 %"
			/>,
		);

		expect(container.querySelector(".fr-badge")).toBeNull();
	});

	it("renders a success (green) badge for a positive delta by default", () => {
		const { container } = render(
			<AdminKpiTile
				deltaLabel="vs 2025"
				deltaPoints={2.1}
				title="Taux de déclaration 2026"
				value="73,4 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge).not.toBeNull();
		expect(badge?.className).toContain("fr-badge--success");
		expect(badge?.textContent).toMatch(/\+2,1 pts/);
		expect(badge?.textContent).toMatch(/vs 2025/);
	});

	it("renders an error (red) badge for a negative delta by default", () => {
		const { container } = render(
			<AdminKpiTile
				deltaPoints={-2.1}
				title="Taux de déclaration 2026"
				value="71,3 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge?.className).toContain("fr-badge--error");
		expect(badge?.textContent).toMatch(/-2,1 pts/);
	});

	it("renders a neutral (info) badge for a zero delta", () => {
		const { container } = render(
			<AdminKpiTile
				deltaPoints={0}
				title="Taux de déclaration 2026"
				value="73,4 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge?.className).toContain("fr-badge--info");
		expect(badge?.textContent).toMatch(/0 pt/);
	});

	it("flips green/red when inverted is true (positive delta = degradation)", () => {
		const { container } = render(
			<AdminKpiTile
				deltaPoints={2.1}
				inverted
				title="Taux d'écart ≥ 5 %"
				value="42,3 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge?.className).toContain("fr-badge--error");
	});

	it("flips negative to green when inverted is true (improvement)", () => {
		const { container } = render(
			<AdminKpiTile
				deltaPoints={-2.1}
				inverted
				title="Taux d'écart ≥ 5 %"
				value="40,2 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge?.className).toContain("fr-badge--success");
	});
});
