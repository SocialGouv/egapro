import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "../HomePage";

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

// HomeNotice is a client component using useState — mock it to avoid issues in jsdom
vi.mock("../HomeNotice", () => ({
	HomeNotice: () => (
		<div data-testid="home-notice">Bandeau d&apos;information</div>
	),
}));

describe("HomePage", () => {
	it("le contenu principal a l'id #content pour les skip links", () => {
		render(<HomePage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("affiche le bandeau d'information", () => {
		render(<HomePage />);
		expect(screen.getByTestId("home-notice")).toBeInTheDocument();
	});

	it("affiche le titre principal de la section hero", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("affiche la section de recherche", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /rechercher une entreprise/i,
			}),
		).toBeInTheDocument();
	});

	it("affiche la section ressources", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
	});
});
