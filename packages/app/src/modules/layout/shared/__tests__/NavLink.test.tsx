import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mocks hoistés avant l'import du composant
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { usePathname } from "next/navigation";
import { NavLink } from "../NavLink";

describe("NavLink", () => {
	describe("aria-current sur correspondance exacte", () => {
		it("est défini à 'page' quand le path correspond exactement", () => {
			vi.mocked(usePathname).mockReturnValue("/index-egapro");
			render(<NavLink href="/index-egapro">Index</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});

		it("est défini à 'page' sur la racine /", () => {
			vi.mocked(usePathname).mockReturnValue("/");
			render(<NavLink href="/">Accueil</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});
	});

	describe("aria-current sur correspondance par préfixe (sous-pages)", () => {
		it("est défini à 'page' pour une sous-page d'un segment non-racine", () => {
			vi.mocked(usePathname).mockReturnValue("/index-egapro/recherche");
			render(<NavLink href="/index-egapro">Index</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});

		it("est défini à 'page' pour une sous-page profonde", () => {
			vi.mocked(usePathname).mockReturnValue(
				"/index-egapro/declaration/assujetti",
			);
			render(<NavLink href="/index-egapro">Index</NavLink>);
			expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
		});
	});

	describe("aria-current absent quand pas de correspondance", () => {
		it("est absent quand le path ne correspond pas", () => {
			vi.mocked(usePathname).mockReturnValue("/stats");
			render(<NavLink href="/index-egapro">Index</NavLink>);
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
		});

		it("n'utilise pas / comme préfixe de tous les paths", () => {
			vi.mocked(usePathname).mockReturnValue("/index-egapro");
			render(<NavLink href="/">Accueil</NavLink>);
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
		});

		it("est absent quand le path est une autre section", () => {
			vi.mocked(usePathname).mockReturnValue("/representation-equilibree");
			render(<NavLink href="/index-egapro">Index</NavLink>);
			expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
		});
	});

	it("transmet le className au lien rendu", () => {
		vi.mocked(usePathname).mockReturnValue("/autre");
		render(
			<NavLink className="fr-nav__link" href="/index-egapro">
				Index
			</NavLink>,
		);
		expect(screen.getByRole("link")).toHaveClass("fr-nav__link");
	});

	it("rend le href correct", () => {
		vi.mocked(usePathname).mockReturnValue("/autre");
		render(<NavLink href="/index-egapro">Index</NavLink>);
		expect(screen.getByRole("link")).toHaveAttribute("href", "/index-egapro");
	});
});
