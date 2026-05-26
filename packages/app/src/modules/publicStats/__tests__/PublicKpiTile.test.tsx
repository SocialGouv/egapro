import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getBadgeRendering, PublicKpiTile } from "../PublicKpiTile";

describe("PublicKpiTile", () => {
	it("renders title, value and subtitle", () => {
		render(
			<PublicKpiTile
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
			<PublicKpiTile
				delta={null}
				subtitle="0 / 0 entreprises"
				title="Indicateur"
				value="0,0 %"
			/>,
		);

		expect(container.querySelector(".fr-badge")).toBeNull();
	});

	it("renders a success badge with upward arrow for a positive delta", () => {
		const { container } = render(
			<PublicKpiTile
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

	it("renders an error badge with downward arrow for a negative delta", () => {
		const { container } = render(
			<PublicKpiTile
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
			<PublicKpiTile
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

	it("renders the arrow with aria-hidden so the visual cue is not duplicated for screen readers", () => {
		const { container } = render(
			<PublicKpiTile
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

describe("getBadgeRendering", () => {
	it("rounds the displayed points to one decimal place", () => {
		const out = getBadgeRendering({ points: 2.07, comparisonLabel: "" });
		expect(out.signedValue).toBe("+2,1");
	});

	it("uses the error class for negative delta", () => {
		const out = getBadgeRendering({ points: -2, comparisonLabel: "vs 2025" });
		expect(out.className).toContain("fr-badge--error");
		expect(out.arrow).toBe("↓");
		expect(out.signedValue).toBe("-2,0");
	});

	it("uses the success class for positive delta", () => {
		const out = getBadgeRendering({ points: 0.5, comparisonLabel: "vs 2025" });
		expect(out.className).toContain("fr-badge--success");
	});

	it("produces a neutral badge with `0` for a zero delta", () => {
		const out = getBadgeRendering({ points: 0, comparisonLabel: "" });
		expect(out.arrow).toBe("=");
		expect(out.signedValue.trim()).toBe("0");
		expect(out.className).not.toContain("--success");
		expect(out.className).not.toContain("--error");
	});
});
