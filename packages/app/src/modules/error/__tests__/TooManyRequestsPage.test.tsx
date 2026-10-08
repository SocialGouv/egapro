import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooManyRequestsPage } from "../TooManyRequestsPage";

describe("TooManyRequestsPage", () => {
	it("renders the main landmark with skip-link target", () => {
		render(<TooManyRequestsPage />);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("displays the 429 title and error code", () => {
		render(<TooManyRequestsPage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Trop de consultations" }),
		).toBeInTheDocument();
		expect(screen.getByText("Erreur 429")).toHaveClass("fr-text-mention--grey");
	});

	it("tells the user to wait before retrying", () => {
		render(<TooManyRequestsPage />);

		expect(
			screen.getByText("Patientez une minute, puis rafraîchissez la page."),
		).toBeInTheDocument();
	});

	it("renders a link to the home page", () => {
		render(<TooManyRequestsPage />);

		const link = screen.getByRole("link", { name: "Page d'accueil" });
		expect(link).toHaveAttribute("href", "/");
		expect(link).toHaveClass("fr-btn");
	});
});
