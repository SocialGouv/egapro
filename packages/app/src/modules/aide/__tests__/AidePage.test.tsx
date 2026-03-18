import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AidePage } from "../AidePage";

describe("AidePage", () => {
	it("has #content id on main for skip links", () => {
		render(<AidePage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the page heading", () => {
		render(<AidePage />);
		expect(
			screen.getByRole("heading", { level: 1, name: /aide et ressources/i }),
		).toBeInTheDocument();
	});

	it("renders the breadcrumb navigation", () => {
		render(<AidePage />);
		expect(
			screen.getByRole("navigation", { name: /vous êtes ici/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders the deadline callout", () => {
		render(<AidePage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /date limite de déclaration/i,
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/1er mars 2026/i)).toBeInTheDocument();
	});

	it("renders the three resource cards", () => {
		render(<AidePage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /nouveau site : ce qui change/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /indicateurs de rémunération/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /indicateurs de représentation/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the textes de référence section", () => {
		render(<AidePage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /textes de référence/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(/textes législatifs et réglementaires/i),
		).toBeInTheDocument();
	});

	it("renders external links to Legifrance with target blank", () => {
		render(<AidePage />);
		const articleLink = screen.getByRole("link", {
			name: /article l\. 1142-8/i,
		});
		expect(articleLink).toHaveAttribute(
			"href",
			"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037396684",
		);
		expect(articleLink).toHaveAttribute("target", "_blank");

		const decretLink = screen.getByRole("link", {
			name: /décret n° 2019-15/i,
		});
		expect(decretLink).toHaveAttribute(
			"href",
			"https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038234561",
		);
		expect(decretLink).toHaveAttribute("target", "_blank");
	});

	it("renders the back link", () => {
		render(<AidePage />);
		const backLink = screen.getByRole("link", { name: /retour à l'accueil/i });
		expect(backLink).toHaveAttribute("href", "/");
	});

	it("renders the bottom banner with resource tiles", () => {
		render(<AidePage />);
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /nous contacter/i,
			}),
		).toBeInTheDocument();
	});

	it("applies the blue background class on main", () => {
		render(<AidePage />);
		const main = screen.getByRole("main");
		expect(main.className).toContain("pageBackground");
	});
});
