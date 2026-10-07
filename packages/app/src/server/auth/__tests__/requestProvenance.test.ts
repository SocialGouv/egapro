import { describe, expect, it } from "vitest";

import { isCrossSiteRequest } from "~/server/auth/requestProvenance";

const TRUSTED_ORIGIN = "https://egapro.example.fr";

function headers(values: Record<string, string>) {
	return new Headers(values);
}

describe("isCrossSiteRequest", () => {
	describe("when the browser sends Sec-Fetch-Site", () => {
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

		it.each([
			["Origin", { origin: TRUSTED_ORIGIN }],
			["Referer", { referer: `${TRUSTED_ORIGIN}/mon-espace` }],
		])("rejects Sec-Fetch-Site: same-site even with a trusted %s", (_label, provenance) => {
			expect(
				isCrossSiteRequest(
					headers({ "sec-fetch-site": "same-site", ...provenance }),
					TRUSTED_ORIGIN,
				),
			).toBe(true);
		});

		it("rejects Sec-Fetch-Site: cross-site even when the Origin is the trusted origin", () => {
			expect(
				isCrossSiteRequest(
					headers({ "sec-fetch-site": "cross-site", origin: TRUSTED_ORIGIN }),
					TRUSTED_ORIGIN,
				),
			).toBe(true);
		});

		it("rejects a third-party redirect back to us that kept an egapro Referer", () => {
			expect(
				isCrossSiteRequest(
					headers({
						"sec-fetch-site": "cross-site",
						referer: `${TRUSTED_ORIGIN}/mon-espace`,
					}),
					TRUSTED_ORIGIN,
				),
			).toBe(true);
		});

		it("rejects an unknown Sec-Fetch-Site value", () => {
			expect(
				isCrossSiteRequest(
					headers({ "sec-fetch-site": "bogus", origin: TRUSTED_ORIGIN }),
					TRUSTED_ORIGIN,
				),
			).toBe(true);
		});
	});

	describe("when the browser sends no Sec-Fetch-Site", () => {
		it("accepts a trusted Origin", () => {
			expect(
				isCrossSiteRequest(headers({ origin: TRUSTED_ORIGIN }), TRUSTED_ORIGIN),
			).toBe(false);
		});

		it("accepts a trusted Referer", () => {
			expect(
				isCrossSiteRequest(
					headers({ referer: `${TRUSTED_ORIGIN}/mon-espace` }),
					TRUSTED_ORIGIN,
				),
			).toBe(false);
		});

		it("rejects a foreign Referer", () => {
			expect(
				isCrossSiteRequest(
					headers({ referer: "https://attacker.example.com/page" }),
					TRUSTED_ORIGIN,
				),
			).toBe(true);
		});

		it("checks the Origin before the Referer", () => {
			expect(
				isCrossSiteRequest(
					headers({
						origin: "https://attacker.example.com",
						referer: `${TRUSTED_ORIGIN}/mon-espace`,
					}),
					TRUSTED_ORIGIN,
				),
			).toBe(true);
		});

		it("treats an opaque Origin as foreign", () => {
			expect(
				isCrossSiteRequest(headers({ origin: "null" }), TRUSTED_ORIGIN),
			).toBe(true);
		});

		it("treats a malformed Referer as foreign", () => {
			expect(
				isCrossSiteRequest(headers({ referer: "not a url" }), TRUSTED_ORIGIN),
			).toBe(true);
		});

		it("accepts a request carrying no provenance header at all", () => {
			expect(isCrossSiteRequest(headers({}), TRUSTED_ORIGIN)).toBe(false);
		});
	});
});
