import { describe, expect, it } from "vitest";

import { buildRobots } from "../robots";

const BASE_URL = "https://egapro.travail.gouv.fr";

describe("buildRobots", () => {
	it("allows all user agents on the root", () => {
		const robots = buildRobots(BASE_URL, true);
		const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
		expect(rule?.userAgent).toBe("*");
		expect(rule?.allow).toBe("/");
	});

	it("disallows authenticated, internal and dynamic areas", () => {
		const robots = buildRobots(BASE_URL, true);
		const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
		const disallow = Array.isArray(rule?.disallow)
			? rule.disallow
			: [rule?.disallow].filter(Boolean);
		expect(disallow).toEqual(
			expect.arrayContaining([
				"/api/",
				"/admin/",
				"/mon-espace/",
				"/declaration-remuneration/",
				"/avis-cse/",
				"/login",
				"/maintenance",
				"/test-",
			]),
		);
	});

	it("references the sitemap URL", () => {
		const robots = buildRobots(BASE_URL, true);
		expect(robots.sitemap).toBe(`${BASE_URL}/sitemap.xml`);
	});

	it("normalises the sitemap URL to the base origin", () => {
		const robots = buildRobots(`${BASE_URL}/api/auth`, true);
		expect(robots.sitemap).toBe(`${BASE_URL}/sitemap.xml`);
	});

	it("blocks all indexing and omits the sitemap outside of prod", () => {
		const robots = buildRobots(BASE_URL, false);
		const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
		expect(rule?.userAgent).toBe("*");
		expect(rule?.disallow).toBe("/");
		expect(rule?.allow).toBeUndefined();
		expect(robots.sitemap).toBeUndefined();
	});
});
