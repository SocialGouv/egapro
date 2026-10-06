import { describe, expect, it } from "vitest";

import {
	buildContentSecurityPolicy,
	buildSecurityHeaders,
} from "~/server/security/securityHeaders.js";

const MATOMO_URL = "https://matomo.example.fr/";
const MATOMO_ORIGIN = "https://matomo.example.fr";

function parseDirectives(policy: string): Map<string, string[]> {
	return new Map(
		policy.split(";").map((directive) => {
			const [name = "", ...sources] = directive.trim().split(/\s+/);
			return [name, sources];
		}),
	);
}

function productionPolicy(matomoUrl?: string) {
	return parseDirectives(
		buildContentSecurityPolicy({ isDevelopment: false, matomoUrl }),
	);
}

describe("buildContentSecurityPolicy", () => {
	it("restricts every fetch directive to the app origin when Matomo is not configured", () => {
		expect(Object.fromEntries(productionPolicy())).toEqual({
			"default-src": ["'self'"],
			"script-src": ["'self'", "'unsafe-inline'"],
			"style-src": ["'self'", "'unsafe-inline'"],
			"img-src": ["'self'", "data:", "blob:"],
			"font-src": ["'self'", "data:"],
			"connect-src": ["'self'"],
			"frame-src": ["'none'"],
			"worker-src": ["'self'", "blob:"],
			"object-src": ["'none'"],
			"base-uri": ["'self'"],
			"form-action": ["'self'"],
			"frame-ancestors": ["'none'"],
		});
	});

	it("allows 'unsafe-eval' in development only", () => {
		const development = parseDirectives(
			buildContentSecurityPolicy({ isDevelopment: true }),
		);

		expect(development.get("script-src")).toContain("'unsafe-eval'");
		expect(productionPolicy().get("script-src")).not.toContain("'unsafe-eval'");
	});

	it("allows the Matomo origin to load the tracker, receive hits and serve the opt-out iframe", () => {
		const policy = productionPolicy(MATOMO_URL);

		expect(policy.get("script-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("connect-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("img-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("frame-src")).toEqual([MATOMO_ORIGIN]);
	});

	it("keeps the Matomo origin out of the directives Matomo does not need", () => {
		const policy = productionPolicy(MATOMO_URL);

		for (const directive of [
			"default-src",
			"style-src",
			"font-src",
			"worker-src",
			"form-action",
			"frame-ancestors",
		]) {
			expect(policy.get(directive)).not.toContain(MATOMO_ORIGIN);
		}
	});

	it("reduces a Matomo URL with a path to its origin", () => {
		const policy = productionPolicy("https://matomo.example.fr/sub/path/");

		expect(policy.get("script-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("script-src")?.join(" ")).not.toContain("/sub/path");
	});

	it.each([
		"",
		"not a url",
	])("ignores an unusable Matomo URL (%j)", (matomoUrl) => {
		expect(productionPolicy(matomoUrl)).toEqual(productionPolicy());
	});

	it("serialises directives separated by '; ' with no trailing separator", () => {
		const policy = buildContentSecurityPolicy({ isDevelopment: false });

		expect(policy).toMatch(/^default-src 'self'; /);
		expect(policy).not.toMatch(/;\s*$/);
		expect(policy).not.toMatch(/\n/);
	});
});

describe("buildSecurityHeaders", () => {
	function headersFor(isDevelopment: boolean) {
		const [entry, ...rest] = buildSecurityHeaders({
			isDevelopment,
			matomoUrl: MATOMO_URL,
		});
		expect(rest).toEqual([]);
		return entry;
	}

	it("applies to every path", () => {
		expect(headersFor(false)?.source).toBe("/:path*");
	});

	it("sets the CSP and the anti-framing, referrer, permissions and sniffing headers", () => {
		const headers = Object.fromEntries(
			(headersFor(false)?.headers ?? []).map(({ key, value }) => [key, value]),
		);

		expect(headers).toEqual({
			"Content-Security-Policy": buildContentSecurityPolicy({
				isDevelopment: false,
				matomoUrl: MATOMO_URL,
			}),
			"X-Frame-Options": "DENY",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"Permissions-Policy":
				"accelerometer=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
			"X-Content-Type-Options": "nosniff",
		});
	});

	it("leaves Strict-Transport-Security to the ingress, which already sends it", () => {
		const keys = (headersFor(false)?.headers ?? []).map(({ key }) =>
			key.toLowerCase(),
		);

		expect(keys).not.toContain("strict-transport-security");
	});

	it("carries the development policy when built for development", () => {
		const csp = headersFor(true)?.headers.find(
			({ key }) => key === "Content-Security-Policy",
		);

		expect(csp?.value).toContain("'unsafe-eval'");
	});
});
