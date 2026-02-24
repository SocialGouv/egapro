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
	it("has #content id on main for skip links", () => {
		render(<HomePage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("renders the notice banner", () => {
		render(<HomePage />);
		expect(screen.getByTestId("home-notice")).toBeInTheDocument();
	});

	it("renders the hero section heading", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the search section", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: /rechercher une entreprise/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the resources section", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 3,
				name: /questions fréquentes/i,
			}),
		).toBeInTheDocument();
	});

	it("renders the three placeholder sections", () => {
		render(<HomePage />);
		const placeholders = screen.getAllByText("Section non finalisée");
		expect(placeholders).toHaveLength(3);
	});
});
