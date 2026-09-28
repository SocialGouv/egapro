import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { FAQ, HELP, HOME } from "~/modules/routes";
import { NavLink } from "../NavLink";

describe("NavLink", () => {
	describe("aria-current on exact match", () => {
		it("is set to 'page' when path matches exactly", () => {
			vi.mocked(usePathname).mockReturnValue(HELP);
			render(<NavLink href={HELP}>Aide</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});

		it("is set to 'page' on root /", () => {
			vi.mocked(usePathname).mockReturnValue(HOME);
			render(<NavLink href={HOME}>Accueil</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});
	});

	describe("aria-current on prefix match (sub-pages)", () => {
		it("is set to 'page' for a sub-page of a non-root segment", () => {
			vi.mocked(usePathname).mockReturnValue("/aide/nous-contacter");
			render(<NavLink href={HELP}>Aide</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});

		it("is set to 'page' for a deep sub-page", () => {
			vi.mocked(usePathname).mockReturnValue("/aide/guide/indicateurs");
			render(<NavLink href={HELP}>Aide</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});
	});

	describe("aria-current absent when no match", () => {
		it("is absent when path does not match", () => {
			vi.mocked(usePathname).mockReturnValue(FAQ);
			render(<NavLink href={HELP}>Aide</NavLink>);
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
		});

		it("does not use / as prefix for all paths", () => {
			vi.mocked(usePathname).mockReturnValue(HELP);
			render(<NavLink href={HOME}>Accueil</NavLink>);
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
		});

		it("is absent when path is another section", () => {
			vi.mocked(usePathname).mockReturnValue("/index-egapro/recherche");
			render(<NavLink href={HELP}>Aide</NavLink>);
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
		});
	});

	it("passes className to rendered link", () => {
		vi.mocked(usePathname).mockReturnValue("/autre");
		render(
			<NavLink className="fr-nav__link" href={HELP}>
				Aide
			</NavLink>,
		);
		expect(screen.getByRole("link")).toHaveClass("fr-nav__link");
	});

	it("renders correct href", () => {
		vi.mocked(usePathname).mockReturnValue("/autre");
		render(<NavLink href={HELP}>Aide</NavLink>);
		expect(screen.getByRole("link")).toHaveAttribute("href", HELP);
	});
});
