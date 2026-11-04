import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UnderConstructionPage } from "../UnderConstructionPage";

describe("UnderConstructionPage", () => {
	it("renders the main landmark with skip-link target", () => {
		render(<UnderConstructionPage />);

		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("displays the page title", () => {
		render(<UnderConstructionPage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Page en cours de construction",
			}),
		).toBeInTheDocument();
	});

	it("explains that the content is being written", () => {
		render(<UnderConstructionPage />);

		expect(
			screen.getByText(
				"Le contenu de cette page est en cours de rédaction et sera bientôt disponible.",
			),
		).toBeInTheDocument();
	});

	it("shows no error code", () => {
		render(<UnderConstructionPage />);

		expect(screen.queryByText(/Erreur \d+/)).not.toBeInTheDocument();
	});

	it("links back to the home page", () => {
		render(<UnderConstructionPage />);

		const link = screen.getByRole("link", { name: "Page d'accueil" });
		expect(link).toHaveAttribute("href", "/");
		expect(link).toHaveClass("fr-btn");
	});
});
