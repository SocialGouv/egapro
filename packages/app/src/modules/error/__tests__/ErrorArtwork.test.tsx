import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorArtwork } from "../ErrorArtwork";

describe("ErrorArtwork", () => {
	it("renders a decorative SVG with DSFR artwork classes", () => {
		const { container } = render(<ErrorArtwork />);

		const svg = container.querySelector("svg");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("aria-hidden", "true");
		expect(svg).toHaveClass("fr-responsive-img", "fr-artwork");
		expect(svg).toHaveAttribute("viewBox", "0 0 160 200");
	});

	it("references the ovoid background SVG", () => {
		const { container } = render(<ErrorArtwork />);

		const motif = container.querySelector(".fr-artwork-motif");
		expect(motif).toBeInTheDocument();
		expect(motif?.getAttribute("href")).toContain("ovoid.svg#artwork-motif");

		const background = container.querySelector(".fr-artwork-background");
		expect(background).toBeInTheDocument();
		expect(background?.getAttribute("href")).toContain(
			"ovoid.svg#artwork-background",
		);
	});

	it("references the technical-error pictogram SVG", () => {
		const { container } = render(<ErrorArtwork />);

		const decorative = container.querySelector(".fr-artwork-decorative");
		expect(decorative).toBeInTheDocument();
		expect(decorative?.getAttribute("href")).toContain(
			"technical-error.svg#artwork-decorative",
		);

		const minor = container.querySelector(".fr-artwork-minor");
		expect(minor).toBeInTheDocument();

		const major = container.querySelector(".fr-artwork-major");
		expect(major).toBeInTheDocument();
	});
});
