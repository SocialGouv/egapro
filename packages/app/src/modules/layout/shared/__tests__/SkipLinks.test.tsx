import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipLinks } from "../SkipLinks";

describe("SkipLinks", () => {
	it("rend un <nav> avec aria-label 'Accès rapide'", () => {
		render(<SkipLinks />);
		expect(
			screen.getByRole("navigation", { name: /accès rapide/i }),
		).toBeInTheDocument();
	});

	it("rend le lien vers #content", () => {
		render(<SkipLinks />);
		const link = screen.getByRole("link", { name: /contenu/i });
		expect(link).toHaveAttribute("href", "#content");
	});

	it("rend le lien vers #footer", () => {
		render(<SkipLinks />);
		const link = screen.getByRole("link", { name: /pied de page/i });
		expect(link).toHaveAttribute("href", "#footer");
	});

	it("rend exactement deux liens d'évitement", () => {
		render(<SkipLinks />);
		expect(screen.getAllByRole("link")).toHaveLength(2);
	});
});
