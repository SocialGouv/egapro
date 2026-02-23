import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeHero } from "../HomeHero";

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

describe("HomeHero", () => {
	it("affiche le titre principal", () => {
		render(<HomeHero />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("affiche la description de la plateforme", () => {
		render(<HomeHero />);
		expect(
			screen.getByText(/indicateurs de rémunération et de représentation/i),
		).toBeInTheDocument();
	});

	it("affiche le lien CTA de déclaration", () => {
		render(<HomeHero />);
		const link = screen.getByRole("link", {
			name: /déclarer mes indicateurs/i,
		});
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/index-egapro");
	});

	it("affiche l'info sur les entreprises de plus de 50 salariés", () => {
		render(<HomeHero />);
		expect(
			screen.getByText(/entreprises de plus de 50 salariés/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/plus de 35 000 entreprises déclarantes/i),
		).toBeInTheDocument();
	});

	it("affiche l'info sur l'échéance", () => {
		render(<HomeHero />);
		expect(screen.getByText(/échéance : 1er mars/i)).toBeInTheDocument();
		expect(
			screen.getByText(/déclaration annuelle obligatoire/i),
		).toBeInTheDocument();
	});

	it("est bien une section HTML sémantique", () => {
		const { container } = render(<HomeHero />);
		expect(container.querySelector("section")).toBeInTheDocument();
	});
});
