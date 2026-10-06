import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { describe, expect, it } from "vitest";

import {
	API_DECLARATION_PDF,
	API_PREFILL_PDF,
	API_REPRESENTATION_PDF,
	API_TRANSMITTED_PDF,
	API_V1_FILES,
} from "~/modules/routes";
import {
	buildContentSecurityPolicy,
	buildSecurityHeaders,
	FILE_ROUTES_WITHOUT_CSP,
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
	function headersAppliedTo(pathname: string, isDevelopment = false) {
		return buildSecurityHeaders({ isDevelopment, matomoUrl: MATOMO_URL })
			.filter(({ source }) =>
				getPathMatch(source, { strict: true, removeUnnamedParams: true })(
					pathname,
				),
			)
			.flatMap(({ headers }) => headers);
	}

	function cspOf(pathname: string, isDevelopment = false) {
		return headersAppliedTo(pathname, isDevelopment).filter(
			({ key }) => key === "Content-Security-Policy",
		);
	}

	const PAGES = [
		"/",
		"/mentions-legales",
		"/index-egapro/recherche",
		"/admin",
		"/api/public/docs",
		"/api/v1/docs",
		"/api/v1/openapi.json",
		"/api/v1/filesystem",
		"/api/declaration-pdf-preview",
	];

	const FILE_ROUTES = [
		"/api/declaration-pdf",
		"/api/representation-pdf",
		"/api/transmitted-pdf",
		"/api/prefill-pdf",
		"/api/prefill-pdf/",
		"/api/v1/files",
		"/api/v1/files/0b7c1d1e-5f4a-4d7e-9a1b-123456789abc",
	];

	const BASELINE_HEADERS = {
		"X-Frame-Options": "DENY",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Permissions-Policy":
			"accelerometer=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
		"X-Content-Type-Options": "nosniff",
	};

	it("exempts exactly the routes that stream PDFs and stored files", () => {
		expect(FILE_ROUTES_WITHOUT_CSP).toEqual([
			API_DECLARATION_PDF,
			API_REPRESENTATION_PDF,
			API_TRANSMITTED_PDF,
			API_PREFILL_PDF,
			API_V1_FILES,
		]);
	});

	it.each(PAGES)("sends a single CSP on %s", (pathname) => {
		expect(cspOf(pathname)).toEqual([
			{
				key: "Content-Security-Policy",
				value: buildContentSecurityPolicy({
					isDevelopment: false,
					matomoUrl: MATOMO_URL,
				}),
			},
		]);
	});

	it.each(
		FILE_ROUTES,
	)("sends no CSP on %s, so the browser PDF viewer can render it", (pathname) => {
		expect(cspOf(pathname)).toEqual([]);
	});

	it.each([
		...PAGES,
		...FILE_ROUTES,
	])("sends the anti-framing, referrer, permissions and sniffing headers once on %s", (pathname) => {
		const headers = headersAppliedTo(pathname).filter(
			({ key }) => key !== "Content-Security-Policy",
		);

		expect(
			Object.fromEntries(headers.map(({ key, value }) => [key, value])),
		).toEqual(BASELINE_HEADERS);
		expect(headers).toHaveLength(Object.keys(BASELINE_HEADERS).length);
	});

	it("leaves Strict-Transport-Security to the ingress, which already sends it", () => {
		const keys = headersAppliedTo("/").map(({ key }) => key.toLowerCase());

		expect(keys).not.toContain("strict-transport-security");
	});

	it("carries the development policy when built for development", () => {
		expect(cspOf("/", true)[0]?.value).toContain("'unsafe-eval'");
	});
});
