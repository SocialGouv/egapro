import { describe, expect, it } from "vitest";
import { LOGIN } from "../shared/accountRoutes";
import {
	ACCESSIBILITY,
	CONTACT,
	COOKIES,
	CRAWLER_DISALLOWED_PREFIXES,
	FAQ,
	getIndexablePublicPages,
	getPublicPages,
	HELP,
	HOME,
	LEGAL_NOTICE,
	OBSERVATORY_SEARCH,
	observatoryCompanyHref,
	PRIVACY,
	PUBLIC_PAGES,
	REFERENTS,
	referentHref,
	SITE_MAP,
} from "../shared/publicRoutes";

describe("dynamic public hrefs", () => {
	it("builds an observatory company page", () => {
		expect(observatoryCompanyHref("123456789")).toBe(
			"/index-egapro/entreprise/123456789",
		);
	});

	it("builds a referent detail page", () => {
		expect(referentHref("r-1")).toBe("/referents/r-1");
	});
});

describe("PUBLIC_PAGES", () => {
	// The inventory `sitemap.xml` filters and `/plan-du-site` renders. They used
	// to be two hand-kept lists that disagreed, so what matters here is
	// that one list covers both surfaces.
	it("lists each page once", () => {
		const paths = PUBLIC_PAGES.map((page) => page.path);
		expect(new Set(paths).size).toBe(paths.length);
	});

	it("covers the pages the site chrome links to", () => {
		const paths = PUBLIC_PAGES.map((page) => page.path);
		for (const path of [
			HOME,
			HELP,
			CONTACT,
			FAQ,
			REFERENTS,
			OBSERVATORY_SEARCH,
			LOGIN,
			LEGAL_NOTICE,
			PRIVACY,
			COOKIES,
			ACCESSIBILITY,
			SITE_MAP,
		]) {
			expect(paths).toContain(path);
		}
	});

	// #4342 removes the page; listing it would publish a URL scheduled for
	// deletion into sitemap.xml.
	it("leaves /stats out", () => {
		expect(PUBLIC_PAGES.map((page) => page.path)).not.toContain("/stats");
	});

	it("splits into the two sections the site map renders", () => {
		const main = getPublicPages("main");
		const legal = getPublicPages("legal");
		expect(main.length + legal.length).toBe(PUBLIC_PAGES.length);
		expect(main.map((page) => page.path)).toContain(HOME);
		expect(legal.map((page) => page.path)).toContain(LEGAL_NOTICE);
	});

	it("gives every page a label and a priority the sitemap can use", () => {
		for (const page of PUBLIC_PAGES) {
			expect(page.label.length).toBeGreaterThan(0);
			expect(page.priority).toBeGreaterThan(0);
			expect(page.priority).toBeLessThanOrEqual(1);
		}
	});
});

describe("getIndexablePublicPages", () => {
	it("drops the pages crawlers must not index", () => {
		expect(getIndexablePublicPages().map((page) => page.path)).not.toContain(
			LOGIN,
		);
	});

	it("keeps the rest", () => {
		expect(getIndexablePublicPages().map((page) => page.path)).toContain(HOME);
	});

	// robots.txt disallows /login, so sitemap.xml must not advertise it: the two
	// files would otherwise contradict each other.
	it("never lists a page robots.txt disallows", () => {
		for (const page of getIndexablePublicPages()) {
			for (const prefix of CRAWLER_DISALLOWED_PREFIXES) {
				expect(page.path.startsWith(prefix)).toBe(false);
			}
		}
	});
});

describe("CRAWLER_DISALLOWED_PREFIXES", () => {
	it("covers the authenticated areas and the funnels", () => {
		expect(CRAWLER_DISALLOWED_PREFIXES).toEqual([
			"/api/",
			"/admin/",
			"/mon-espace/",
			"/declaration-remuneration/",
			"/avis-cse/",
			"/login",
			"/maintenance",
			"/test-",
		]);
	});
});
