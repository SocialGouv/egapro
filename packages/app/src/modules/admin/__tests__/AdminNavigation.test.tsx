import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { AdminNavigation } from "../AdminNavigation";

describe("AdminNavigation", () => {
	it("renders navigation with all links", () => {
		vi.mocked(usePathname).mockReturnValue("/admin");
		render(<AdminNavigation />);
		expect(
			screen.getByRole("navigation", { name: "Menu administration" }),
		).toBeInTheDocument();
		expect(screen.getByText("Accueil")).toBeInTheDocument();
		expect(screen.getByText("Déclarations")).toBeInTheDocument();
		expect(screen.getByText("Référents")).toBeInTheDocument();
	});

	it("marks the admin home as active on /admin", () => {
		vi.mocked(usePathname).mockReturnValue("/admin");
		render(<AdminNavigation />);
		const homeLink = screen.getByText("Accueil");
		expect(homeLink).toHaveAttribute("aria-current", "page");
	});

	it("marks declarations as active on /admin/declarations", () => {
		vi.mocked(usePathname).mockReturnValue("/admin/declarations");
		render(<AdminNavigation />);
		const declLink = screen.getByText("Déclarations");
		expect(declLink).toHaveAttribute("aria-current", "page");
		const homeLink = screen.getByText("Accueil");
		expect(homeLink).not.toHaveAttribute("aria-current");
	});

	it("marks referents as active on /admin/liste-referents", () => {
		vi.mocked(usePathname).mockReturnValue("/admin/liste-referents");
		render(<AdminNavigation />);
		const refLink = screen.getByText("Référents");
		expect(refLink).toHaveAttribute("aria-current", "page");
	});
});
