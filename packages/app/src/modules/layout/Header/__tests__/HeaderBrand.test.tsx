import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeaderBrand } from "../HeaderBrand";

describe("HeaderBrand", () => {
	it("wraps the mobile menu trigger in a 'Accès rapides' navigation landmark (RGAA 9.2)", () => {
		render(<HeaderBrand />);
		const nav = screen.getByRole("navigation", { name: "Accès rapides" });
		expect(nav).toContainElement(screen.getByRole("button", { name: "Menu" }));
	});

	it("keeps the DSFR navbar class on the navigation element", () => {
		render(<HeaderBrand />);
		expect(
			screen.getByRole("navigation", { name: "Accès rapides" }),
		).toHaveClass("fr-header__navbar");
	});

	it("renders the service link to the home page", () => {
		render(<HeaderBrand />);
		expect(screen.getByRole("link", { name: /egapro/i })).toHaveAttribute(
			"href",
			"/",
		);
	});
});
