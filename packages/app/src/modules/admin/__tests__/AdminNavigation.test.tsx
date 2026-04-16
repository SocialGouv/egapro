import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock } from "vitest";

import { AdminNavigation } from "../AdminNavigation";

describe("AdminNavigation", () => {
	beforeEach(() => {
		(usePathname as Mock).mockReturnValue("/admin");
	});

	it("renders a sidemenu nav with the admin title", () => {
		render(<AdminNavigation />);
		expect(
			screen.getByRole("navigation", { name: "Administration" }),
		).toBeInTheDocument();
	});

	it("renders all admin links", () => {
		render(<AdminNavigation />);
		expect(screen.getByRole("link", { name: "Accueil" })).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Statistiques" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Mimoquer un Siren" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Référents" })).toBeInTheDocument();
	});

	it("marks /admin as active when on /admin", () => {
		(usePathname as Mock).mockReturnValue("/admin");
		render(<AdminNavigation />);
		const activeLink = screen.getByRole("link", { name: "Accueil" });
		expect(activeLink).toHaveAttribute("aria-current", "page");
		expect(activeLink.closest("li")).toHaveClass(
			"fr-sidemenu__item",
			"fr-sidemenu__item--active",
		);
		expect(
			screen.getByRole("link", { name: "Mimoquer un Siren" }),
		).not.toHaveAttribute("aria-current");
	});

	it("marks /admin/impersonate as active when on that page", () => {
		(usePathname as Mock).mockReturnValue("/admin/impersonate");
		render(<AdminNavigation />);
		expect(
			screen.getByRole("link", { name: "Mimoquer un Siren" }),
		).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Accueil" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it("marks /admin/liste-referents as active when on that page", () => {
		(usePathname as Mock).mockReturnValue("/admin/liste-referents");
		render(<AdminNavigation />);
		expect(screen.getByRole("link", { name: "Référents" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByRole("link", { name: "Accueil" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it("marks /admin/stats as active when on that page", () => {
		(usePathname as Mock).mockReturnValue("/admin/stats");
		render(<AdminNavigation />);
		expect(
			screen.getByRole("link", { name: "Statistiques" }),
		).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Accueil" })).not.toHaveAttribute(
			"aria-current",
		);
	});
});
