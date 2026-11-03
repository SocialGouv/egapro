import { describe, expect, it } from "vitest";

import { ADMIN_NAV_LINKS, ADMIN_SITEMAP } from "~/modules/routes";

import { ADMIN_SECTIONS } from "../adminSections";

describe("ADMIN_SECTIONS", () => {
	it("lists the side-menu sections, in the same order and with the same labels", () => {
		expect(ADMIN_SECTIONS.map(({ href, label }) => ({ href, label }))).toEqual(
			ADMIN_NAV_LINKS.map(({ href, label }) => ({ href, label })),
		);
	});

	it("describes every section", () => {
		for (const section of ADMIN_SECTIONS) {
			expect(section.description.trim().length).toBeGreaterThan(0);
		}
	});

	it("does not list the plan itself", () => {
		expect(ADMIN_SECTIONS.map((section) => section.href)).not.toContain(
			ADMIN_SITEMAP,
		);
	});
});
