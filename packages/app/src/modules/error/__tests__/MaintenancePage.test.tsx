import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MaintenancePage } from "../MaintenancePage";

describe("MaintenancePage", () => {
	it("renders the main landmark with skip-link target", () => {
		render(<MaintenancePage />);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabIndex", "-1");
	});

	it("displays the 503 title", () => {
		render(<MaintenancePage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Service indisponible",
			}),
		).toBeInTheDocument();
	});

	it("displays the error code", () => {
		render(<MaintenancePage />);

		expect(screen.getByText("Erreur 503")).toBeInTheDocument();
	});

	it("displays the unavailability explanation", () => {
		render(<MaintenancePage />);

		expect(
			screen.getByText(/le service est temporairement inaccessible/),
		).toBeInTheDocument();
	});

	it("displays the retry guidance", () => {
		render(<MaintenancePage />);

		expect(
			screen.getByText(/Merci de réessayer plus tard/),
		).toBeInTheDocument();
	});

	it("does not render any action button", () => {
		render(<MaintenancePage />);

		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("renders the DSFR artwork illustration as decorative", () => {
		const { container } = render(<MaintenancePage />);

		const svg = container.querySelector("svg.fr-artwork");
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute("aria-hidden", "true");
		expect(svg).toHaveClass("fr-responsive-img");
	});
});
