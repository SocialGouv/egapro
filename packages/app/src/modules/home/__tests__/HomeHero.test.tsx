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
	it("renders the main heading", () => {
		render(<HomeHero />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the platform description", () => {
		render(<HomeHero />);
		expect(
			screen.getByText(/indicateurs de rémunération et de représentation/i),
		).toBeInTheDocument();
	});

	it("renders the declaration CTA link", () => {
		render(<HomeHero />);
		const link = screen.getByRole("link", {
			name: /déclarer mes indicateurs/i,
		});
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/declaration-remuneration");
	});

	it("renders the info about companies with 50+ employees", () => {
		render(<HomeHero />);
		expect(
			screen.getByText(/entreprises de plus de 50 salariés/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/plus de 35 000 entreprises déclarantes/i),
		).toBeInTheDocument();
	});

	it("renders the deadline info", () => {
		render(<HomeHero />);
		expect(screen.getByText(/échéance : 1er mars/i)).toBeInTheDocument();
		expect(
			screen.getByText(/déclaration annuelle obligatoire/i),
		).toBeInTheDocument();
	});

	it("uses a semantic section element", () => {
		const { container } = render(<HomeHero />);
		expect(container.querySelector("section")).toBeInTheDocument();
	});
});
