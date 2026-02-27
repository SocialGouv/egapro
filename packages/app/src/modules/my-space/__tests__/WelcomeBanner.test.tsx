import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WelcomeBanner } from "../WelcomeBanner";

describe("WelcomeBanner", () => {
	it("renders the info alert with title", () => {
		render(<WelcomeBanner />);
		expect(
			screen.getByText("Bienvenue sur votre espace Egapro"),
		).toBeInTheDocument();
	});

	it("renders the description about ProConnect", () => {
		render(<WelcomeBanner />);
		expect(
			screen.getByText(/renseignées automatiquement via ProConnect/),
		).toBeInTheDocument();
	});

	it("has the DSFR info alert class", () => {
		const { container } = render(<WelcomeBanner />);
		expect(container.querySelector(".fr-alert--info")).toBeInTheDocument();
	});

	it("hides the banner when close button is clicked", () => {
		render(<WelcomeBanner />);
		expect(
			screen.getByText("Bienvenue sur votre espace Egapro"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Masquer le message" }));

		expect(
			screen.queryByText("Bienvenue sur votre espace Egapro"),
		).not.toBeInTheDocument();
	});

	it("close button has the correct title attribute", () => {
		render(<WelcomeBanner />);
		expect(
			screen.getByRole("button", { name: "Masquer le message" }),
		).toHaveAttribute("title", "Masquer le message");
	});
});
