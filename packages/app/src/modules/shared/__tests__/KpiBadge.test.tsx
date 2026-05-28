import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getKpiBadgeRendering, KpiBadge } from "../KpiBadge";

describe("KpiBadge", () => {
	it("renders nothing when delta is null", () => {
		const { container } = render(<KpiBadge delta={null} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders a success badge with upward arrow for positive delta", () => {
		const { container } = render(
			<KpiBadge delta={{ points: 2.1, comparisonLabel: "vs 2025" }} />,
		);
		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--success");
		expect(badge?.textContent).toContain("↑");
		expect(badge?.textContent).toContain("+2,1");
		expect(badge?.textContent).toContain("pts");
		expect(badge?.textContent).toContain("vs 2025");
	});

	it("renders an error badge with downward arrow for negative delta", () => {
		const { container } = render(
			<KpiBadge delta={{ points: -1.5, comparisonLabel: "vs 2025" }} />,
		);
		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge--error");
		expect(badge?.textContent).toContain("↓");
		expect(badge?.textContent).toContain("-1,5");
	});

	it("renders a neutral badge with equals sign for zero delta", () => {
		const { container } = render(
			<KpiBadge delta={{ points: 0, comparisonLabel: "vs 2025" }} />,
		);
		const badge = container.querySelector(".fr-badge");
		expect(badge).toHaveClass("fr-badge");
		expect(badge).not.toHaveClass("fr-badge--success");
		expect(badge).not.toHaveClass("fr-badge--error");
		expect(badge?.textContent).toContain("=");
	});

	it("inverts colors: positive delta becomes error when inverted", () => {
		const { container } = render(
			<KpiBadge delta={{ points: 1.2, comparisonLabel: "vs 2025" }} inverted />,
		);
		expect(container.querySelector(".fr-badge")).toHaveClass("fr-badge--error");
	});

	it("inverts colors: negative delta becomes success when inverted", () => {
		const { container } = render(
			<KpiBadge
				delta={{ points: -1.5, comparisonLabel: "vs 2025" }}
				inverted
			/>,
		);
		expect(container.querySelector(".fr-badge")).toHaveClass(
			"fr-badge--success",
		);
	});

	it("renders the arrow with aria-hidden", () => {
		const { container } = render(
			<KpiBadge delta={{ points: 2.1, comparisonLabel: "vs 2025" }} />,
		);
		const arrow = container.querySelector(".fr-badge [aria-hidden='true']");
		expect(arrow).not.toBeNull();
		expect(arrow?.textContent).toBe("↑");
	});
});

describe("getKpiBadgeRendering", () => {
	it("rounds the displayed points to one decimal place", () => {
		const out = getKpiBadgeRendering({ points: 2.07, comparisonLabel: "" });
		expect(out.signedValue).toBe("+2,1");
	});

	it("uses the error class for negative delta (default)", () => {
		const out = getKpiBadgeRendering({
			points: -2,
			comparisonLabel: "vs 2025",
		});
		expect(out.className).toContain("fr-badge--error");
		expect(out.arrow).toBe("↓");
		expect(out.signedValue).toBe("-2,0");
	});

	it("uses the success class for positive delta (default)", () => {
		const out = getKpiBadgeRendering({
			points: 0.5,
			comparisonLabel: "vs 2025",
		});
		expect(out.className).toContain("fr-badge--success");
	});

	it("uses the success class for negative delta when inverted", () => {
		const out = getKpiBadgeRendering(
			{ points: -2, comparisonLabel: "vs 2025" },
			true,
		);
		expect(out.className).toContain("fr-badge--success");
	});

	it("uses the error class for positive delta when inverted", () => {
		const out = getKpiBadgeRendering(
			{ points: 0.5, comparisonLabel: "vs 2025" },
			true,
		);
		expect(out.className).toContain("fr-badge--error");
	});

	it("produces a neutral badge with `0` for a zero delta", () => {
		const out = getKpiBadgeRendering({ points: 0, comparisonLabel: "" });
		expect(out.arrow).toBe("=");
		expect(out.signedValue.trim()).toBe("0");
		expect(out.className).not.toContain("--success");
		expect(out.className).not.toContain("--error");
	});
});
