import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock } from "vitest";
import { Navigation } from "../Navigation";

describe("Navigation", () => {
	beforeEach(() => {
		(usePathname as Mock).mockReturnValue("/");
	});

	it("renders the main navigation landmark on the home route", () => {
		render(<Navigation />);
		expect(
			screen.getByRole("navigation", { name: "Menu principal" }),
		).toBeInTheDocument();
	});

	it("renders the Accueil and Observatoire links on an unrelated route", () => {
		(usePathname as Mock).mockReturnValue("/aide");
		render(<Navigation />);
		expect(screen.getByRole("link", { name: "Accueil" })).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Observatoire" }),
		).toBeInTheDocument();
	});

	it("renders nothing on /mon-espace", () => {
		(usePathname as Mock).mockReturnValue("/mon-espace");
		const { container } = render(<Navigation />);
		expect(
			screen.queryByRole("navigation", { name: "Menu principal" }),
		).not.toBeInTheDocument();
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing on a nested /mon-espace/* route (declaration history)", () => {
		(usePathname as Mock).mockReturnValue(
			"/mon-espace/historique/123456789/2025",
		);
		const { container } = render(<Navigation />);
		expect(container).toBeEmptyDOMElement();
	});
});
