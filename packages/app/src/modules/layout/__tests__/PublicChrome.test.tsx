import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock } from "vitest";

import { PublicChrome } from "../PublicChrome";

// Renders real Footer + ResourceBanner; only their external deps
// (next/link, next/image, next/navigation) are mocked globally in test/setup.ts,
// so a regression inside either landmark would fail this file.

describe("PublicChrome", () => {
	beforeEach(() => {
		(usePathname as Mock).mockReturnValue("/");
	});

	it("renders ResourceBanner + Footer on public routes", () => {
		render(<PublicChrome />);
		expect(
			screen.getByRole("region", { name: /ressources et aide/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
	});

	it("renders nothing on /admin", () => {
		(usePathname as Mock).mockReturnValue("/admin");
		const { container } = render(<PublicChrome />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing on nested /admin/* routes", () => {
		(usePathname as Mock).mockReturnValue("/admin/declarations");
		const { container } = render(<PublicChrome />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders chrome on non-admin nested routes", () => {
		(usePathname as Mock).mockReturnValue("/mon-espace/declarations");
		render(<PublicChrome />);
		expect(
			screen.getByRole("region", { name: /ressources et aide/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
	});

	it("renders chrome on sibling routes whose name merely starts with 'admin'", () => {
		(usePathname as Mock).mockReturnValue("/administrator");
		render(<PublicChrome />);
		expect(
			screen.getByRole("region", { name: /ressources et aide/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
	});

	it("hides ResourceBanner on /login but keeps the Footer", () => {
		(usePathname as Mock).mockReturnValue("/login");
		render(<PublicChrome />);
		expect(
			screen.queryByRole("region", { name: /ressources et aide/i }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
	});
});
