import { describe, expect, it } from "vitest";

import { buildSitemap } from "../sitemap";

const BASE_URL = "https://egapro.travail.gouv.fr";

describe("buildSitemap", () => {
	it("returns absolute URLs for every public route", () => {
		const entries = buildSitemap(BASE_URL);
		for (const entry of entries) {
			expect(entry.url).toMatch(/^https:\/\/egapro\.travail\.gouv\.fr(\/|$)/);
			expect(entry.url.replace("https://", "")).not.toContain("//");
		}
	});

	it("includes the home page as the root origin without trailing slash", () => {
		const entries = buildSitemap(BASE_URL);
		const home = entries.find((entry) => entry.url === BASE_URL);
		expect(home).toBeDefined();
		expect(home?.priority).toBe(1);
	});

	it("lists every public route required by issue #3233", () => {
		const entries = buildSitemap(BASE_URL);
		const paths = entries.map(
			(entry) => entry.url.replace(BASE_URL, "") || "/",
		);
		expect(paths).toEqual(
			expect.arrayContaining([
				"/",
				"/aide",
				"/aide/nous-contacter",
				"/faq",
				"/mentions-legales",
				"/donnees-personnelles",
				"/gestion-des-cookies",
				"/declaration-accessibilite",
				"/plan-du-site",
				"/referents",
			]),
		);
	});

	it("excludes authenticated, internal and dynamic routes", () => {
		const entries = buildSitemap(BASE_URL);
		const urls = entries.map((entry) => entry.url);
		for (const forbidden of [
			"/login",
			"/mon-espace",
			"/admin",
			"/declaration-remuneration",
			"/avis-cse",
			"/maintenance",
			"/test-error",
			"/test-panel",
		]) {
			expect(urls.some((url) => url.includes(forbidden))).toBe(false);
		}
	});

	it("stamps every entry with the provided timestamp", () => {
		const now = new Date("2026-01-01T00:00:00.000Z");
		const entries = buildSitemap(BASE_URL, now);
		for (const entry of entries) {
			expect(entry.lastModified).toBe(now);
		}
	});

	it("normalises a base URL with a trailing path to the origin", () => {
		const entries = buildSitemap(`${BASE_URL}/api/auth`);
		for (const entry of entries) {
			expect(entry.url.startsWith(BASE_URL)).toBe(true);
			expect(entry.url).not.toContain("/api/auth");
		}
	});
});
