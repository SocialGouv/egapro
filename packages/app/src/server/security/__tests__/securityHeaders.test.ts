import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import {
	buildContentSecurityPolicy,
	buildContentSecurityPolicyHeaders,
	buildSecurityHeaders,
	generateNonce,
	isNonce,
	sentryEndpointsOf,
} from "~/server/security/securityHeaders.js";

const NONCE = "q1w2e3r4t5y6u7i8o9p0Aw==";
const MATOMO_URL = "https://matomo.example.fr/";
const MATOMO_ORIGIN = "https://matomo.example.fr";
const SENTRY_DSN = "https://abc123@sentry.example.fr/42";
const SENTRY_ORIGIN = "https://sentry.example.fr";
const SENTRY_REPORT_URL =
	"https://sentry.example.fr/api/42/security/?sentry_key=abc123";

function parseDirectives(policy: string): Map<string, string[]> {
	return new Map(
		policy.split(";").map((directive) => {
			const [name = "", ...sources] = directive.trim().split(/\s+/);
			return [name, sources];
		}),
	);
}

function productionPolicy(
	options: { matomoUrl?: string; sentryDsn?: string; nonce?: string } = {},
) {
	return parseDirectives(
		buildContentSecurityPolicy({
			isDevelopment: false,
			nonce: NONCE,
			...options,
		}),
	);
}

describe("buildContentSecurityPolicy", () => {
	it("restricts every fetch directive to the app origin when Matomo and Sentry are not configured", () => {
		expect(Object.fromEntries(productionPolicy())).toEqual({
			"default-src": ["'self'"],
			"script-src": ["'self'", `'nonce-${NONCE}'`, "'strict-dynamic'"],
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

	it("never lets an inline script run without the request nonce", () => {
		const scriptSources = productionPolicy().get("script-src");

		expect(scriptSources).not.toContain("'unsafe-inline'");
		expect(scriptSources).toContain(`'nonce-${NONCE}'`);
	});

	it("carries the nonce it is given, so each request gets its own policy", () => {
		expect(productionPolicy({ nonce: "other" }).get("script-src")).toContain(
			"'nonce-other'",
		);
		expect(
			productionPolicy({ nonce: "other" }).get("script-src"),
		).not.toContain(`'nonce-${NONCE}'`);
	});

	it("allows 'unsafe-eval' in development only", () => {
		const development = parseDirectives(
			buildContentSecurityPolicy({ isDevelopment: true, nonce: NONCE }),
		);

		expect(development.get("script-src")).toContain("'unsafe-eval'");
		expect(productionPolicy().get("script-src")).not.toContain("'unsafe-eval'");
	});

	it("allows the Matomo origin to load the tracker, receive hits and serve the opt-out iframe", () => {
		const policy = productionPolicy({ matomoUrl: MATOMO_URL });

		expect(policy.get("script-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("connect-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("img-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("frame-src")).toEqual([MATOMO_ORIGIN]);
	});

	it("keeps the Matomo origin out of the directives Matomo does not need", () => {
		const policy = productionPolicy({ matomoUrl: MATOMO_URL });

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
		const policy = productionPolicy({
			matomoUrl: "https://matomo.example.fr/sub/path/",
		});

		expect(policy.get("script-src")).toContain(MATOMO_ORIGIN);
		expect(policy.get("script-src")?.join(" ")).not.toContain("/sub/path");
	});

	it.each([
		"",
		"not a url",
	])("ignores an unusable Matomo URL (%j)", (matomoUrl) => {
		expect(productionPolicy({ matomoUrl })).toEqual(productionPolicy());
	});

	it("lets the browser SDK reach the self-hosted Sentry host directly", () => {
		expect(
			productionPolicy({ sentryDsn: SENTRY_DSN }).get("connect-src"),
		).toEqual(["'self'", SENTRY_ORIGIN]);
	});

	it("reports violations to the Sentry security endpoint of the DSN project", () => {
		const policy = productionPolicy({ sentryDsn: SENTRY_DSN });

		expect(policy.get("report-uri")).toEqual([SENTRY_REPORT_URL]);
		expect(policy.get("report-to")).toEqual(["csp-endpoint"]);
	});

	it("keeps the Sentry origin out of every directive but connect-src", () => {
		const policy = productionPolicy({ sentryDsn: SENTRY_DSN });

		for (const [directive, sources] of policy) {
			if (directive === "connect-src" || directive === "report-uri") continue;
			expect(sources).not.toContain(SENTRY_ORIGIN);
		}
	});

	it("neither reports nor opens connect-src when Sentry is not configured", () => {
		const policy = productionPolicy();

		expect(policy.has("report-uri")).toBe(false);
		expect(policy.has("report-to")).toBe(false);
		expect(policy.get("connect-src")).toEqual(["'self'"]);
	});

	it.each([
		"",
		"not a url",
		"https://sentry.example.fr/42",
		"https://abc123@sentry.example.fr/",
		"https://abc123@sentry.example.fr/not-a-project",
		"ftp://abc123@sentry.example.fr/42",
		"https://abc123@sentry.example.fr/a;script-src*/42",
		"https://abc123@sentry.example.fr/a,b/42",
	])("ignores an unusable Sentry DSN (%j)", (sentryDsn) => {
		expect(productionPolicy({ sentryDsn })).toEqual(productionPolicy());
	});

	it("serialises directives separated by '; ' with no trailing separator", () => {
		const policy = buildContentSecurityPolicy({
			isDevelopment: false,
			nonce: NONCE,
			sentryDsn: SENTRY_DSN,
		});

		expect(policy).toMatch(/^default-src 'self'; /);
		expect(policy).not.toMatch(/;\s*$/);
		expect(policy).not.toMatch(/\n/);
	});
});

describe("generateNonce", () => {
	it("draws a 128-bit base64 value that isNonce accepts", () => {
		const nonce = generateNonce();

		expect(isNonce(nonce)).toBe(true);
		expect(atob(nonce)).toHaveLength(16);
	});

	it("never draws the same value twice", () => {
		const nonces = new Set(Array.from({ length: 50 }, generateNonce));

		expect(nonces.size).toBe(50);
	});
});

describe("isNonce", () => {
	it.each([
		null,
		undefined,
		"",
		'"><img src=x onerror=alert(1)>',
		"q1w2e3r4t5y6u7i8o9p0A==",
		"q1w2e3r4t5y6u7i8o9p0Awxx",
		"q1w2e3r4t5y6u7i8o9p0A w==",
	])("rejects %j", (value) => {
		expect(isNonce(value)).toBe(false);
	});
});

describe("sentryEndpointsOf", () => {
	it("derives the ingest origin and the security endpoint from a DSN", () => {
		expect(sentryEndpointsOf(SENTRY_DSN)).toEqual({
			origin: SENTRY_ORIGIN,
			securityReportUrl: SENTRY_REPORT_URL,
		});
	});

	it("keeps the port and the path prefix of a DSN served under a sub-path", () => {
		expect(
			sentryEndpointsOf("https://abc123@sentry.example.fr:8443/relay/7"),
		).toEqual({
			origin: "https://sentry.example.fr:8443",
			securityReportUrl:
				"https://sentry.example.fr:8443/relay/api/7/security/?sentry_key=abc123",
		});
	});

	it("returns nothing without a DSN", () => {
		expect(sentryEndpointsOf(undefined)).toBeUndefined();
	});
});

describe("buildContentSecurityPolicyHeaders", () => {
	it("declares the Reporting-Endpoints group the policy reports to", () => {
		expect(
			buildContentSecurityPolicyHeaders({
				isDevelopment: false,
				nonce: NONCE,
				sentryDsn: SENTRY_DSN,
			}),
		).toEqual({
			"Content-Security-Policy": buildContentSecurityPolicy({
				isDevelopment: false,
				nonce: NONCE,
				sentryDsn: SENTRY_DSN,
			}),
			"Reporting-Endpoints": `csp-endpoint="${SENTRY_REPORT_URL}"`,
		});
	});

	it("sends the policy alone when Sentry is not configured", () => {
		expect(
			buildContentSecurityPolicyHeaders({ isDevelopment: false, nonce: NONCE }),
		).toEqual({
			"Content-Security-Policy": buildContentSecurityPolicy({
				isDevelopment: false,
				nonce: NONCE,
			}),
		});
	});
});

describe("buildSecurityHeaders", () => {
	const BASELINE_HEADERS = {
		"x-frame-options": "DENY",
		"referrer-policy": "strict-origin-when-cross-origin",
		"permissions-policy":
			"accelerometer=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
		"x-content-type-options": "nosniff",
	};

	async function headersSentOn(pathname: string) {
		const response = await unstable_getResponseFromNextConfig({
			url: `http://localhost${pathname}`,
			nextConfig: { headers: async () => buildSecurityHeaders() },
		});
		// The testing helper answers with an empty text body, typed as such.
		return Object.fromEntries(
			[...response.headers].filter(([name]) => name !== "content-type"),
		);
	}

	it.each([
		"/",
		"/mentions-legales",
		"/admin",
		"/api/declaration-pdf",
		"/api/v1/files/0b7c1d1e-5f4a-4d7e-9a1b-123456789abc",
		"/_next/static/chunks/main.js",
	])("sends exactly the anti-framing, referrer, permissions and sniffing headers on %s", async (pathname) => {
		expect(await headersSentOn(pathname)).toEqual(BASELINE_HEADERS);
	});

	it("leaves the Content-Security-Policy to the middleware, so no response carries two", async () => {
		expect(await headersSentOn("/")).not.toHaveProperty(
			"content-security-policy",
		);
	});
});
