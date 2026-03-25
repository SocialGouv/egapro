import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotFoundPage } from "../NotFoundPage";

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

	it("displays the error code with mention grey color", () => {
		render(<NotFoundPage />);

		const errorCode = screen.getByText("Erreur 404");
		expect(errorCode).toBeInTheDocument();
		expect(errorCode).toHaveClass("fr-text-mention--grey");
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
});
