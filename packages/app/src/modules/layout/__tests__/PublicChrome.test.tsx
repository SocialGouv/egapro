import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { PublicChrome } from "../PublicChrome";

vi.mock("../Footer", () => ({
	Footer: () => <footer data-testid="public-footer">footer</footer>,
}));
vi.mock("../ResourceBanner", () => ({
	ResourceBanner: () => (
		<section data-testid="public-resource-banner">banner</section>
	),
}));

describe("PublicChrome", () => {
	beforeEach(() => {
		(usePathname as Mock).mockReturnValue("/");
	});

	it("renders ResourceBanner + Footer on public routes", () => {
		render(<PublicChrome />);
		expect(screen.getByTestId("public-resource-banner")).toBeInTheDocument();
		expect(screen.getByTestId("public-footer")).toBeInTheDocument();
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
		expect(screen.getByTestId("public-footer")).toBeInTheDocument();
	});
});
