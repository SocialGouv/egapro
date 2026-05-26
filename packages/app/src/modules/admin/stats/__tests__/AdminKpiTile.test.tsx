import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminKpiTile } from "../AdminKpiTile";

describe("AdminKpiTile", () => {
	it("renders title, value and subtitle", () => {
		render(
			<AdminKpiTile
				delta={null}
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

	it("renders no badge when delta is null", () => {
		const { container } = render(
			<AdminKpiTile
				delta={null}
				subtitle="0 / 0 entreprises"
				title="Indicateur"
				value="0,0 %"
			/>,
		);

		expect(container.querySelector(".fr-badge")).toBeNull();
	});

	it("renders a success badge with upward arrow for a positive delta (default)", () => {
		const { container } = render(
			<AdminKpiTile
				delta={{ points: 2.1, comparisonLabel: "vs 2025" }}
				subtitle="—"
				title="Taux de déclaration 2026"
				value="73,4 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--success");
		expect(badge?.textContent).toContain("↑");
		expect(badge?.textContent).toContain("+2,1");
		expect(badge?.textContent).toContain("pts");
		expect(badge?.textContent).toContain("vs 2025");
	});

	it("renders an error badge with downward arrow for a negative delta (default)", () => {
		const { container } = render(
			<AdminKpiTile
				delta={{ points: -1.5, comparisonLabel: "vs 2025" }}
				subtitle="—"
				title="Taux de déclaration 2026"
				value="71,9 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--error");
		expect(badge?.textContent).toContain("↓");
		expect(badge?.textContent).toContain("-1,5");
	});

	it("renders a neutral badge with equals sign for a zero delta", () => {
		const { container } = render(
			<AdminKpiTile
				delta={{ points: 0, comparisonLabel: "vs 2025" }}
				subtitle="—"
				title="Taux"
				value="50,0 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge");
		expect(badge).not.toHaveClass("fr-badge--success");
		expect(badge).not.toHaveClass("fr-badge--error");
		expect(badge?.textContent).toContain("=");
	});

	it("inverts colors when `inverted` is true: positive delta becomes error", () => {
		const { container } = render(
			<AdminKpiTile
				delta={{ points: 1.2, comparisonLabel: "vs 2025" }}
				inverted
				subtitle="—"
				title="Indicateur"
				value="12,5 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--error");
	});

	it("inverts colors when `inverted` is true: negative delta becomes success", () => {
		const { container } = render(
			<AdminKpiTile
				delta={{ points: -1.5, comparisonLabel: "vs 2025" }}
				inverted
				subtitle="—"
				title="Indicateur"
				value="11,0 %"
			/>,
		);

		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--success");
	});

	it("renders the arrow with aria-hidden so the visual cue is not duplicated for screen readers", () => {
		const { container } = render(
			<AdminKpiTile
				delta={{ points: 2.1, comparisonLabel: "vs 2025" }}
				subtitle="—"
				title="Taux"
				value="73,4 %"
			/>,
		);

		const arrow = container.querySelector(".fr-badge [aria-hidden='true']");
		expect(arrow).not.toBeNull();
		expect(arrow?.textContent).toBe("↑");
	});
});
