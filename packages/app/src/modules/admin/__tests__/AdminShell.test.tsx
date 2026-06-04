import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

	it("renders children inside the content area", () => {
		render(
			<AdminShell>
				<p>test content</p>
			</AdminShell>,
		);
		expect(screen.getByText("test content")).toBeInTheDocument();
	});

	it("wraps content in a fluid container", () => {
		const { container } = render(<AdminShell>children</AdminShell>);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.classList.contains("fr-container--fluid")).toBe(true);
	});
});
