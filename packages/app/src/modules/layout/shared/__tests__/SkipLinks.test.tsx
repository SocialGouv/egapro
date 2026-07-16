import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock } from "vitest";
import { SkipLinks } from "../SkipLinks";

describe("SkipLinks", () => {
	beforeEach(() => {
		(usePathname as Mock).mockReturnValue("/");
	});

	it("renders a <nav> with aria-label 'Accès rapide'", () => {
		render(<SkipLinks />);
		expect(
			screen.getByRole("navigation", { name: /accès rapide/i }),
		).toBeInTheDocument();
	});

	it("renders the link to #content", () => {
		render(<SkipLinks />);
		const link = screen.getByRole("link", { name: /contenu/i });
		expect(link).toHaveAttribute("href", "#content");
	});

	it("renders the link to #footer", () => {
		render(<SkipLinks />);
		const link = screen.getByRole("link", { name: /pied de page/i });
		expect(link).toHaveAttribute("href", "#footer");
	});

	it("renders exactly two skip links", () => {
		render(<SkipLinks />);
		expect(screen.getAllByRole("link")).toHaveLength(2);
	});

	describe("on admin routes (no footer rendered)", () => {
		it("hides the #footer link on /admin", () => {
			(usePathname as Mock).mockReturnValue("/admin");
			render(<SkipLinks />);
			expect(
				screen.queryByRole("link", { name: /pied de page/i }),
			).not.toBeInTheDocument();
			expect(screen.getAllByRole("link")).toHaveLength(1);
		});

		it("hides the #footer link on nested /admin/* routes", () => {
			(usePathname as Mock).mockReturnValue("/admin/declarations");
			render(<SkipLinks />);
			expect(
				screen.queryByRole("link", { name: /pied de page/i }),
			).not.toBeInTheDocument();
		});

		it("keeps the #content link on /admin", () => {
			(usePathname as Mock).mockReturnValue("/admin");
			render(<SkipLinks />);
			expect(screen.getByRole("link", { name: /contenu/i })).toHaveAttribute(
				"href",
				"#content",
			);
		});

		it("keeps the #footer link on sibling routes merely starting with 'admin'", () => {
			(usePathname as Mock).mockReturnValue("/administrator");
			render(<SkipLinks />);
			expect(
				screen.getByRole("link", { name: /pied de page/i }),
			).toBeInTheDocument();
		});
	});
});
