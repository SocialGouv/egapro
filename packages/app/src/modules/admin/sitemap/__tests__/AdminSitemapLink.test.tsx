import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, type Mock } from "vitest";

import { ADMIN_SITEMAP } from "~/modules/routes";

import { AdminSitemapLink } from "../AdminSitemapLink";

describe("AdminSitemapLink", () => {
	beforeEach(() => {
		(usePathname as Mock).mockReturnValue("/admin/declarations/abc-123");
	});

	it("offers the plan in its own navigation landmark", () => {
		render(<AdminSitemapLink />);
		const nav = screen.getByRole("navigation", {
			name: "Plan du back-office",
		});

		expect(nav).toContainElement(
			screen.getByRole("link", { name: "Plan du back-office" }),
		);
	});

	it("points to the backoffice plan", () => {
		render(<AdminSitemapLink />);
		expect(
			screen.getByRole("link", { name: "Plan du back-office" }),
		).toHaveAttribute("href", ADMIN_SITEMAP);
	});

	it("is not marked current away from the plan", () => {
		render(<AdminSitemapLink />);
		expect(
			screen.getByRole("link", { name: "Plan du back-office" }),
		).not.toHaveAttribute("aria-current");
	});

	it("is marked current on the plan", () => {
		(usePathname as Mock).mockReturnValue(ADMIN_SITEMAP);
		render(<AdminSitemapLink />);
		expect(
			screen.getByRole("link", { name: "Plan du back-office" }),
		).toHaveAttribute("aria-current", "page");
	});

	it("renders as a DSFR link with a leading icon", () => {
		render(<AdminSitemapLink />);
		expect(
			screen.getByRole("link", { name: "Plan du back-office" }),
		).toHaveClass("fr-link", "fr-icon-list-unordered", "fr-link--icon-left");
	});
});
