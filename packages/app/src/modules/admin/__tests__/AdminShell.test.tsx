import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ADMIN_SITEMAP } from "~/modules/routes";

import { AdminShell } from "../AdminShell";

vi.mock("../AdminNavigation", () => ({
	AdminNavigation: () => <nav aria-label="Administration">nav</nav>,
}));

describe("AdminShell", () => {
	it("renders the admin navigation", () => {
		render(<AdminShell>content</AdminShell>);
		expect(
			screen.getByRole("navigation", { name: /administration/i }),
		).toBeInTheDocument();
	});

	it("offers the backoffice plan next to the side menu, outside the main content", () => {
		render(<AdminShell>content</AdminShell>);
		const link = screen.getByRole("link", { name: "Plan du back-office" });

		expect(link).toHaveAttribute("href", ADMIN_SITEMAP);
		expect(screen.getByRole("main")).not.toContainElement(link);
	});

	it("renders children inside the content area", () => {
		render(
			<AdminShell>
				<p>test content</p>
			</AdminShell>,
		);
		expect(screen.getByText("test content")).toBeInTheDocument();
	});

	it("wraps children in a focusable main landmark targeted by the skip link", () => {
		render(
			<AdminShell>
				<p>test content</p>
			</AdminShell>,
		);
		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", "content");
		expect(main).toHaveAttribute("tabindex", "-1");
		expect(main).toContainElement(screen.getByText("test content"));
	});

	it("wraps content in a fluid container", () => {
		const { container } = render(<AdminShell>children</AdminShell>);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.classList.contains("fr-container--fluid")).toBe(true);
	});
});
