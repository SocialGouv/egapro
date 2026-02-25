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

describe("HomePage", () => {
	it("displays the main heading", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /bienvenue sur egapro/i,
			}),
		).toBeInTheDocument();
	});

	it("displays the Index section with its action links", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				name: /index de l'égalité professionnelle/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /calculer - déclarer mon index/i }),
		).toHaveAttribute("href", "/declaration-remuneration");
		expect(
			screen.getByRole("link", { name: /consulter l'index/i }),
		).toHaveAttribute("href", "/index-egapro/recherche");
	});

	it("displays the Balanced Representation section with its action links", () => {
		render(<HomePage />);
		expect(
			screen.getByRole("heading", {
				name: /représentation équilibrée/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /déclarer mes écarts/i }),
		).toHaveAttribute("href", "/representation-equilibree");
		expect(
			screen.getByRole("link", { name: /consulter les écarts/i }),
		).toHaveAttribute("href", "/representation-equilibree/recherche");
	});

	it("main content has id #content for skip links", () => {
		render(<HomePage />);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("hero section mentions the 50 employees requirement", () => {
		render(<HomePage />);
		expect(screen.getByText(/au moins 50 salariés/i)).toBeInTheDocument();
	});
});
