import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AidePage } from "../AidePage";

vi.mock("~/modules/layout", () => ({
	NewTabNotice: () => (
		<span className="fr-sr-only">Ouvre une nouvelle fenêtre</span>
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

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

	it("renders the back link", () => {
		render(<AidePage />);
		expect(screen.getByRole("link", { name: /retour/i })).toHaveAttribute(
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
		expect(screen.getByText(/1er mars 2025/i)).toBeInTheDocument();
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

	it("renders external links with target blank", () => {
		render(<AidePage />);
		const externalLinks = screen
			.getAllByRole("link")
			.filter((link) => link.getAttribute("target") === "_blank");
		expect(externalLinks.length).toBeGreaterThanOrEqual(2);
	});
});
