import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetToken } = vi.hoisted(() => ({
	mockGetToken: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({ getToken: mockGetToken }));
vi.mock("~/env", () => ({
	env: {
		AUTH_SECRET: "test-secret",
		NODE_ENV: "production",
		NEXT_PUBLIC_MATOMO_URL: "https://matomo.example.fr",
		NEXT_PUBLIC_SENTRY_DSN: "https://abc123@sentry.example.fr/42",
		EGAPRO_GATEWAY_SHARED_SECRET:
			"test-gateway-shared-secret-at-least-32-chars",
	},
}));

import { config, middleware } from "~/middleware";
import {
	ADMIN,
	API_SEARCH,
	API_V1_PREFIX,
	CSE_OPINION,
	DECLARATION_REMUNERATION,
	MY_SPACE,
} from "~/modules/routes";
import {
	buildContentSecurityPolicyHeaders,
	isNonce,
} from "~/server/security/securityHeaders.js";
import { adminToken, makeRequest } from "./middlewareRequest";

describe("content security policy", () => {
	beforeEach(() => {
		mockGetToken.mockReset();
		mockGetToken.mockResolvedValue(adminToken(0));
	});

	function nonceOf(response: Response) {
		const policy = response.headers.get("content-security-policy") ?? "";
		return /'nonce-([^']+)'/.exec(policy)?.[1];
	}

	// Next.js hands the rewritten request headers to the renderer through these.
	function forwardedRequestHeader(response: Response, name: string) {
		return response.headers.get(`x-middleware-request-${name}`);
	}

	const PAGES = [
		"/",
		"/mentions-legales",
		"/login",
		"/index-egapro/recherche",
		"/admin/declarations",
		"/mon-espace",
		"/declaration-remuneration/commencer",
		"/api/public/docs",
		"/api/v1/docs",
		"/api/v1/filesystem",
		"/api/declaration-pdf",
		"/api/representation-pdf",
		"/api/transmitted-pdf",
		"/api/prefill-pdf",
	];

	it.each(
		PAGES,
	)("sends the policy built for a fresh nonce on %s", async (pathname) => {
		const response = await middleware(makeRequest(pathname));
		const nonce = nonceOf(response);

		expect(isNonce(nonce)).toBe(true);
		expect(response.headers.get("content-security-policy")).toBe(
			buildContentSecurityPolicyHeaders({
				isDevelopment: false,
				nonce: nonce ?? "",
				matomoUrl: "https://matomo.example.fr",
				sentryDsn: "https://abc123@sentry.example.fr/42",
			})["Content-Security-Policy"],
		);
		expect(response.headers.get("reporting-endpoints")).toBe(
			'csp-endpoint="https://sentry.example.fr/api/42/security/?sentry_key=abc123"',
		);
	});

	it.each(
		PAGES,
	)("hands the same nonce and policy to the renderer on %s", async (pathname) => {
		const response = await middleware(makeRequest(pathname));

		expect(forwardedRequestHeader(response, "x-nonce")).toBe(nonceOf(response));
		expect(forwardedRequestHeader(response, "content-security-policy")).toBe(
			response.headers.get("content-security-policy"),
		);
	});

	it("overrides a nonce the client tried to choose", async () => {
		const response = await middleware(
			makeRequest("/", { "x-nonce": "chosen-by-the-client" }),
		);

		expect(forwardedRequestHeader(response, "x-nonce")).not.toBe(
			"chosen-by-the-client",
		);
		expect(forwardedRequestHeader(response, "x-nonce")).toBe(nonceOf(response));
	});

	it.each([
		"/api/export/generate",
		"/api/export/download?year=2026",
		"/api/gip-mds/import",
	])("hands the cron's bearer token to the handler of %s untouched", async (pathname) => {
		const response = await middleware(
			makeRequest(pathname, { authorization: "Bearer cron-token" }),
		);

		expect(response.status).toBe(200);
		expect(forwardedRequestHeader(response, "authorization")).toBe(
			"Bearer cron-token",
		);
	});

	it("draws a different nonce on every request", async () => {
		const nonces = new Set<string | undefined>();
		for (let i = 0; i < 20; i++) {
			nonces.add(nonceOf(await middleware(makeRequest("/"))));
		}

		expect(nonces.size).toBe(20);
	});

	it("still sends the policy on a redirect to the login page", async () => {
		mockGetToken.mockResolvedValue(null);
		const response = await middleware(makeRequest("/mon-espace"));

		expect(response.headers.get("location")).toContain("/login");
		expect(nonceOf(response)).toBeDefined();
	});

	it.each([
		"/api/v1/files",
		"/api/v1/files/0b7c1d1e-5f4a-4d7e-9a1b-123456789abc",
	])("sends no policy on %s, so the browser PDF viewer can render the stored file inline", async (pathname) => {
		const response = await middleware(makeRequest(pathname));

		expect(response.headers.get("content-security-policy")).toBeNull();
		expect(response.headers.get("reporting-endpoints")).toBeNull();
		expect(forwardedRequestHeader(response, "x-nonce")).toBeNull();
		expect(response.headers.get("x-middleware-next")).toBeTruthy();
	});

	it("still checks the gateway header on a stored file", async () => {
		const response = await middleware(
			makeRequest("/api/v1/files/abc", { "x-gateway-forwarded": "wrong" }),
		);

		expect(response.status).toBe(403);
	});
});

describe("matcher coverage", () => {
	function matches(pathname: string) {
		return unstable_doesMiddlewareMatch({
			config,
			url: `http://localhost${pathname}`,
		});
	}

	// Renaming a section in `~/modules/routes` must not leave it outside the
	// middleware, unguarded and without a nonce.
	it("covers every section the middleware guards", () => {
		for (const section of [
			ADMIN,
			MY_SPACE,
			DECLARATION_REMUNERATION,
			CSE_OPINION,
		]) {
			expect(matches(section)).toBe(true);
			expect(matches(`${section}/deep/link`)).toBe(true);
		}
		expect(matches(`${API_V1_PREFIX}export/declarations`)).toBe(true);
		expect(matches(API_SEARCH)).toBe(true);
	});

	it.each([
		"/",
		"/mentions-legales",
		"/login",
		"/api/public/docs",
		"/api/auth/session",
		"/api/v1/files/abc",
	])("runs on %s, so every HTML response gets a nonce", (pathname) => {
		expect(matches(pathname)).toBe(true);
	});

	it.each([
		"/_next/static/chunks/main.js",
		"/_next/image?url=%2Fassets%2Flogo.png&w=64&q=75",
		"/favicon.ico",
	])("skips the build asset %s", (pathname) => {
		expect(matches(pathname)).toBe(false);
	});
});
