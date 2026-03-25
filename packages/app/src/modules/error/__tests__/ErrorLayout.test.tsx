import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorLayout } from "../ErrorLayout";

describe("ErrorLayout", () => {
	it("renders the main landmark with skip-link target", () => {
		render(
			<ErrorLayout>
				<p>Test content</p>
			</ErrorLayout>,
		);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("renders children in the content column", () => {
		render(
			<ErrorLayout>
				<p>Test content</p>
			</ErrorLayout>,
		);

		expect(screen.getByText("Test content")).toBeInTheDocument();
	});

	it("renders the DSFR artwork illustration as decorative", () => {
		const { container } = render(
			<ErrorLayout>
				<p>Test</p>
			</ErrorLayout>,
		);

		const svg = container.querySelector("svg.fr-artwork");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("aria-hidden", "true");
		expect(svg).toHaveClass("fr-responsive-img");
	});

	it("uses the correct illustration column classes from DSFR template", () => {
		const { container } = render(
			<ErrorLayout>
				<p>Test</p>
			</ErrorLayout>,
		);

		const artworkColumn = container
			.querySelector("svg.fr-artwork")
			?.closest("div") as HTMLElement;
		expect(artworkColumn.className).toContain("fr-col-md-3");
		expect(artworkColumn.className).toContain("fr-col-offset-md-1");
		expect(artworkColumn.className).toContain("fr-px-6w");
	});
});
