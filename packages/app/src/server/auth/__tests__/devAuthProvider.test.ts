import type { Provider } from "next-auth/providers/index";
import { beforeEach, describe, expect, it, vi } from "vitest";

const BASE_ENV = {
	AUTH_SECRET: "test-secret",
	DATABASE_URL: "postgres://localhost/test",
	EGAPRO_GATEWAY_SHARED_SECRET: "test-gateway-shared-secret-at-least-32-chars",
	EGAPRO_PROCONNECT_CLIENT_ID: "test-client-id",
	EGAPRO_PROCONNECT_CLIENT_SECRET: "test-client-secret",
	EGAPRO_PROCONNECT_ISSUER: "https://proconnect.example.com",
	EGAPRO_SUIT_API_URL: "https://api.suit.example.com",
	EGAPRO_WEEZ_API_URL: "https://weez.example.com/api",
	NEXTAUTH_URL: "http://localhost:3000/api/auth",
};

/** Re-import the auth config with a specific env, bypassing the global mock. */
async function loadProviders(overrides: Record<string, unknown>) {
	vi.resetModules();
	vi.doMock("~/env", () => ({ env: { ...BASE_ENV, ...overrides } }));
	vi.doMock("~/server/db", () => ({ db: {} }));
	vi.doMock("~/server/db/schema", () => ({
		adminImpersonationEvents: {},
		companies: {},
		userCompanies: {},
		users: {},
	}));
	vi.doMock("~/server/services/weez", () => ({
		fetchCompanyBySiren: vi.fn(),
	}));
	const { authConfig } = await import("../config");
	return authConfig.providers;
}

/**
 * Resolve a provider the way next-auth does at runtime: `CredentialsProvider`
 * nests the caller's options under `options` instead of spreading them, and
 * `parseProviders` merges them on top of the defaults (see
 * `next-auth/core/lib/providers.js`). Asserting on the raw array would test
 * the placeholder id `credentials`, not the effective one.
 */
function resolveProvider(provider: Provider) {
	const { options, ...rest } = provider as Provider & {
		options?: Record<string, unknown>;
	};
	return { ...rest, ...(options ?? {}) } as Record<string, unknown>;
}

function findDevProvider(providers: Provider[]) {
	return providers
		.map(resolveProvider)
		.find((provider) => provider.id === "dev-auth");
}

type AuthorizeFn = (
	credentials: Record<string, string> | undefined,
) => unknown | Promise<unknown>;

describe("dev-auth provider registration", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("is absent by default", async () => {
		const providers = await loadProviders({
			EGAPRO_DEV_AUTH: false,
			NODE_ENV: "development",
		});
		expect(findDevProvider(providers)).toBeUndefined();
		expect(providers).toHaveLength(1);
	});

	it("is registered when EGAPRO_DEV_AUTH is on outside production", async () => {
		const providers = await loadProviders({
			EGAPRO_DEV_AUTH: true,
			NODE_ENV: "development",
		});
		expect(findDevProvider(providers)).toBeDefined();
	});

	it("throws rather than registering in production", async () => {
		await expect(
			loadProviders({ EGAPRO_DEV_AUTH: true, NODE_ENV: "production" }),
		).rejects.toThrow(/NODE_ENV=production/);
	});

	it("still registers ProConnect when dev auth is on", async () => {
		const providers = await loadProviders({
			EGAPRO_DEV_AUTH: true,
			NODE_ENV: "development",
		});
		expect(
			providers.map(resolveProvider).find((p) => p.id === "proconnect"),
		).toBeDefined();
	});

	it("registers no provider when ProConnect is unconfigured and dev auth is off", async () => {
		const providers = await loadProviders({
			EGAPRO_DEV_AUTH: false,
			EGAPRO_PROCONNECT_CLIENT_ID: undefined,
			EGAPRO_PROCONNECT_CLIENT_SECRET: undefined,
			EGAPRO_PROCONNECT_ISSUER: undefined,
			NODE_ENV: "development",
		});
		expect(providers).toHaveLength(0);
	});
});

describe("dev-auth authorize", () => {
	async function getAuthorize() {
		const providers = await loadProviders({
			EGAPRO_DEV_AUTH: true,
			NODE_ENV: "development",
		});
		const provider = findDevProvider(providers);
		if (!provider) throw new Error("dev-auth provider not registered");
		return provider.authorize as AuthorizeFn;
	}

	it("returns a ProConnect-shaped profile for a valid email and SIRET", async () => {
		const authorize = await getAuthorize();
		const user = await authorize({
			email: "declarant@example.fr",
			siret: "55210055400013",
		});
		expect(user).toEqual({
			email: "declarant@example.fr",
			firstName: "declarant",
			id: "declarant@example.fr",
			lastName: null,
			name: "declarant",
			siret: "55210055400013",
		});
	});

	it("accepts a SIRET typed with spaces", async () => {
		const authorize = await getAuthorize();
		const user = await authorize({
			email: "declarant@example.fr",
			siret: "552 100 554 00013",
		});
		expect(user).toMatchObject({ siret: "55210055400013" });
	});

	it("rejects a malformed email", async () => {
		const authorize = await getAuthorize();
		expect(
			await authorize({ email: "nope", siret: "55210055400013" }),
		).toBeNull();
	});

	it("rejects a SIRET that is not 14 digits", async () => {
		const authorize = await getAuthorize();
		expect(
			await authorize({ email: "declarant@example.fr", siret: "552100554" }),
		).toBeNull();
	});

	it("rejects missing credentials", async () => {
		const authorize = await getAuthorize();
		expect(await authorize(undefined)).toBeNull();
	});
});
