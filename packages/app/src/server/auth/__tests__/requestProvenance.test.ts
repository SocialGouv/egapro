import { describe, expect, it } from "vitest";

import { isCrossSiteRequest } from "~/server/auth/requestProvenance";

const TRUSTED_ORIGIN = "https://egapro.example.fr";

function headers(values: Record<string, string>) {
	return new Headers(values);
}

describe("isCrossSiteRequest", () => {
	it.each([
		"same-origin",
		"none",
	])("accepts Sec-Fetch-Site: %s whatever Origin or Referer say", (site) => {
		expect(
			isCrossSiteRequest(
				headers({
					"sec-fetch-site": site,
					referer: "https://attacker.example.com/page",
				}),
				TRUSTED_ORIGIN,
			),
		).toBe(false);
	});

	it.each([
		"cross-site",
		"same-site",
	])("rejects Sec-Fetch-Site: %s without a provenance header", (site) => {
		expect(
			isCrossSiteRequest(headers({ "sec-fetch-site": site }), TRUSTED_ORIGIN),
		).toBe(true);
	});

	it("rejects Sec-Fetch-Site: cross-site with a foreign Origin", () => {
		expect(
			isCrossSiteRequest(
				headers({
					"sec-fetch-site": "cross-site",
					origin: "https://attacker.example.com",
				}),
				TRUSTED_ORIGIN,
			),
		).toBe(true);
	});

	it("rejects Sec-Fetch-Site: same-site from a sibling subdomain Referer", () => {
		expect(
			isCrossSiteRequest(
				headers({
					"sec-fetch-site": "same-site",
					referer: "https://other.example.fr/page",
				}),
				TRUSTED_ORIGIN,
			),
		).toBe(true);
	});

	it("accepts Sec-Fetch-Site: cross-site when the Origin is the trusted origin", () => {
		expect(
			isCrossSiteRequest(
				headers({ "sec-fetch-site": "cross-site", origin: TRUSTED_ORIGIN }),
				TRUSTED_ORIGIN,
			),
		).toBe(false);
	});

	it("accepts Sec-Fetch-Site: cross-site when the Referer is on the trusted origin", () => {
		expect(
			isCrossSiteRequest(
				headers({
					"sec-fetch-site": "cross-site",
					referer: `${TRUSTED_ORIGIN}/mon-espace`,
				}),
				TRUSTED_ORIGIN,
			),
		).toBe(false);
	});

	it("checks the Origin before the Referer", () => {
		expect(
			isCrossSiteRequest(
				headers({
					"sec-fetch-site": "cross-site",
					origin: "https://attacker.example.com",
					referer: `${TRUSTED_ORIGIN}/mon-espace`,
				}),
				TRUSTED_ORIGIN,
			),
		).toBe(true);
	});

	it("treats an opaque Origin as foreign", () => {
		expect(
			isCrossSiteRequest(
				headers({ "sec-fetch-site": "cross-site", origin: "null" }),
				TRUSTED_ORIGIN,
			),
		).toBe(true);
	});

	it("treats a malformed Referer as foreign", () => {
		expect(
			isCrossSiteRequest(
				headers({ "sec-fetch-site": "cross-site", referer: "not a url" }),
				TRUSTED_ORIGIN,
			),
		).toBe(true);
	});

	it("rejects a foreign Referer when the browser sends no Sec-Fetch-Site", () => {
		expect(
			isCrossSiteRequest(
				headers({ referer: "https://attacker.example.com/page" }),
				TRUSTED_ORIGIN,
			),
		).toBe(true);
	});

	it("accepts a trusted Referer when the browser sends no Sec-Fetch-Site", () => {
		expect(
			isCrossSiteRequest(
				headers({ referer: `${TRUSTED_ORIGIN}/mon-espace` }),
				TRUSTED_ORIGIN,
			),
		).toBe(false);
	});

	it("accepts a request carrying no provenance header at all", () => {
		expect(isCrossSiteRequest(headers({}), TRUSTED_ORIGIN)).toBe(false);
	});
});
