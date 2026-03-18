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
		const breadcrumbNav = screen.getByRole("navigation", {
			name: /vous êtes ici/i,
		});
		expect(breadcrumbNav).toBeInTheDocument();
		const breadcrumbLink = breadcrumbNav.querySelector('a[href="/"]');
		expect(breadcrumbLink).toBeInTheDocument();
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
			screen.getAllByText(/textes législatifs et réglementaires/i).length,
		).toBeGreaterThanOrEqual(1);
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

	it("renders the bottom banner with all three resource tiles", () => {
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
				name: /textes de référence/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /nous contacter/i,
			}),
		).toBeInTheDocument();
	});
});
