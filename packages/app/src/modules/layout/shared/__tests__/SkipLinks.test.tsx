import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipLinks } from "../SkipLinks";

describe("SkipLinks", () => {
	it("renders a <nav> with aria-label 'Accès rapide'", () => {
		render(<SkipLinks />);
		expect(
			screen.getByRole("navigation", { name: /accès rapide/i }),
		).toBeInTheDocument();
	});

	it("renders the link to #content", () => {
		render(<SkipLinks />);
		const link = screen.getByRole("link", { name: /contenu/i });
		expect(link).toHaveAttribute("href", "#content");
	});

	it("renders the link to #footer", () => {
		render(<SkipLinks />);
		const link = screen.getByRole("link", { name: /pied de page/i });
		expect(link).toHaveAttribute("href", "#footer");
	});

	it("renders exactly two skip links", () => {
		render(<SkipLinks />);
		expect(screen.getAllByRole("link")).toHaveLength(2);
	});
});
