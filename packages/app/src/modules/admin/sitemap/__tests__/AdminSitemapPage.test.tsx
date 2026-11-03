import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ADMIN_DECLARATIONS, ADMIN_NAV_LINKS } from "~/modules/routes";
import { AdminSitemapPage } from "../AdminSitemapPage";
import { ADMIN_SECTIONS } from "../adminSections";

describe("AdminSitemapPage", () => {
	it("is titled by a single level-one heading", () => {
		render(<AdminSitemapPage />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Plan du back-office" }),
		).toBeInTheDocument();
	});

	it("links every authorised section, in side-menu order", () => {
		render(<AdminSitemapPage />);
		const list = screen.getByRole("list");
		const links = within(list).getAllByRole("link");

		expect(
			links.map((link) => [link.textContent, link.getAttribute("href")]),
		).toEqual(ADMIN_NAV_LINKS.map(({ href, label }) => [label, href]));
	});

	it("describes each section next to its link", () => {
		render(<AdminSitemapPage />);
		const items = within(screen.getByRole("list")).getAllByRole("listitem");

		expect(items).toHaveLength(ADMIN_SECTIONS.length);
		ADMIN_SECTIONS.forEach((section, index) => {
			expect(items[index]).toHaveTextContent(section.description);
		});
	});

	it("leads to the declarations list without exposing any individual declaration", () => {
		render(<AdminSitemapPage />);

		expect(screen.getByRole("link", { name: "Déclarations" })).toHaveAttribute(
			"href",
			ADMIN_DECLARATIONS,
		);
		for (const link of screen.getAllByRole("link")) {
			expect(link.getAttribute("href")).not.toMatch(
				new RegExp(`^${ADMIN_DECLARATIONS}/`),
			);
		}
	});
});
