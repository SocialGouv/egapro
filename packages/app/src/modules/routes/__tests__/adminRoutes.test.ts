import { describe, expect, it } from "vitest";
import {
	ADMIN,
	ADMIN_DECLARATIONS,
	ADMIN_IMPERSONATE,
	ADMIN_NAV_LINKS,
	ADMIN_REFERENTS,
	ADMIN_SETTINGS,
	ADMIN_STATS,
	ADMIN_STATS_CAMPAIGN,
	ADMIN_STATS_PLATFORM,
	adminDeclarationHref,
} from "../shared/adminRoutes";

describe("admin routes", () => {
	it("spells the backoffice pages", () => {
		expect(ADMIN).toBe("/admin");
		expect(ADMIN_DECLARATIONS).toBe("/admin/declarations");
		expect(ADMIN_IMPERSONATE).toBe("/admin/impersonate");
		expect(ADMIN_REFERENTS).toBe("/admin/liste-referents");
		expect(ADMIN_STATS).toBe("/admin/stats");
		expect(ADMIN_SETTINGS).toBe("/admin/parametres");
	});

	it("keeps the legacy statistics anchors, which next.config.js redirects", () => {
		expect(ADMIN_STATS_CAMPAIGN).toBe("/admin/stats/campagne");
		expect(ADMIN_STATS_PLATFORM).toBe("/admin/stats/plateforme");
	});

	it("builds a declaration detail page", () => {
		expect(adminDeclarationHref("abc-123")).toBe("/admin/declarations/abc-123");
	});
});

describe("ADMIN_NAV_LINKS", () => {
	it("opens on the backoffice home", () => {
		expect(ADMIN_NAV_LINKS[0]).toEqual({ href: ADMIN, label: "Accueil" });
	});

	it("names every entry", () => {
		for (const link of ADMIN_NAV_LINKS) {
			expect(link.label.length).toBeGreaterThan(0);
		}
	});

	// The side menu marks an entry active by prefix, so `/admin` matching every
	// other entry is exactly why `AdminNavigation` special-cases it.
	it("lists each page once", () => {
		const hrefs = ADMIN_NAV_LINKS.map((link) => link.href);
		expect(new Set(hrefs).size).toBe(hrefs.length);
	});

	it("covers every backoffice page", () => {
		expect(ADMIN_NAV_LINKS.map((link) => link.href)).toEqual([
			ADMIN,
			ADMIN_DECLARATIONS,
			ADMIN_IMPERSONATE,
			ADMIN_REFERENTS,
			ADMIN_STATS,
			ADMIN_SETTINGS,
		]);
	});
});
