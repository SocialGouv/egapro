import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NotFoundPage } from "../NotFoundPage";

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

describe("NotFoundPage", () => {
	it("renders the main landmark with skip-link target", () => {
		render(<NotFoundPage />);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("displays the 404 title", () => {
		render(<NotFoundPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Page non trouvée" }),
		).toBeInTheDocument();
	});

	it("displays the error code", () => {
		render(<NotFoundPage />);

		expect(screen.getByText("Erreur 404")).toBeInTheDocument();
	});

	it("displays the explanation text", () => {
		render(<NotFoundPage />);

		expect(
			screen.getByText(/La page que vous cherchez est introuvable/),
		).toBeInTheDocument();
	});

	it("displays guidance text", () => {
		render(<NotFoundPage />);

		expect(
			screen.getByText(/Si vous avez tapé l'adresse web dans le navigateur/),
		).toBeInTheDocument();
	});

	it("renders a link to the home page", () => {
		render(<NotFoundPage />);

		const link = screen.getByRole("link", { name: "Page d'accueil" });
		expect(link).toHaveAttribute("href", "/");
		expect(link).toHaveClass("fr-btn");
	});

	it("renders a decorative error illustration image", () => {
		const { container } = render(<NotFoundPage />);

		const img = container.querySelector("img");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("aria-hidden", "true");
		expect(img).toHaveAttribute("alt", "");
		expect(img).toHaveAttribute(
			"src",
			"/assets/images/error/technical-error-illustration.svg",
		);
	});
});
