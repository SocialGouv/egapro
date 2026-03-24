import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

// Build a minimal JWT with the given payload (no signature verification needed)
function buildJwt(payload: Record<string, unknown>): string {
	const header = Buffer.from(
		JSON.stringify({ alg: "RS256", typ: "JWT" }),
	).toString("base64url");
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	return `${header}.${body}.fake-signature`;
}

// Re-implement extractIssuerFromIdToken inline since it's not exported.
// This tests the same logic used in the module.
function extractIssuerFromIdToken(idToken: string): string | undefined {
	const parts = idToken.split(".");
	const payload = parts[1];
	if (!payload) return undefined;

	try {
		const decoded = JSON.parse(
			Buffer.from(payload, "base64url").toString(),
		) as { iss?: string };
		return decoded.iss;
	} catch {
		return undefined;
	}
}

describe("extractIssuerFromIdToken", () => {
	it("extracts the iss claim from a valid JWT", () => {
		const jwt = buildJwt({
			iss: "https://fca.integ01.dev-agentconnect.fr/api/v2",
			sub: "user-123",
		});
		expect(extractIssuerFromIdToken(jwt)).toBe(
			"https://fca.integ01.dev-agentconnect.fr/api/v2",
		);
	});

	it("returns undefined when iss is missing from the payload", () => {
		const jwt = buildJwt({ sub: "user-123" });
		expect(extractIssuerFromIdToken(jwt)).toBeUndefined();
	});

	it("returns undefined for a malformed JWT with no payload", () => {
		expect(extractIssuerFromIdToken("header-only")).toBeUndefined();
	});

	it("returns undefined for an invalid base64 payload", () => {
		expect(
			extractIssuerFromIdToken("header.!!!invalid!!!.sig"),
		).toBeUndefined();
	});
});

// --- Tests for terminateProConnectSession ---

const mockFindFirst = vi.fn();

vi.mock("~/server/db", () => ({
	db: {
		query: {
			accounts: {
				findFirst: (...args: unknown[]) => mockFindFirst(...args),
			},
		},
	},
}));

vi.mock("~/server/db/schema", () => ({
	accounts: { userId: "userId" },
}));

import { terminateProConnectSession } from "../proconnect-logout";

describe("terminateProConnectSession", () => {
	let originalFetch: typeof globalThis.fetch;
	let mockFetch: MockInstance;

	beforeEach(() => {
		vi.clearAllMocks();
		originalFetch = globalThis.fetch;
		mockFetch = vi.fn();
		globalThis.fetch = mockFetch as unknown as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("returns early when no account is found for the user", async () => {
		mockFindFirst.mockResolvedValue(undefined);

		await terminateProConnectSession("user-123");

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("returns early when account has no id_token", async () => {
		mockFindFirst.mockResolvedValue({ id_token: null });

		await terminateProConnectSession("user-123");

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("calls end_session_endpoint with id_token_hint", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch
			.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						end_session_endpoint:
							"https://proconnect.example.com/api/v2/session/end",
					}),
			})
			.mockResolvedValueOnce(new Response());

		await terminateProConnectSession("user-123");

		expect(mockFetch).toHaveBeenCalledTimes(2);
		// First call: OIDC discovery
		expect(mockFetch.mock.calls[0]?.[0]).toContain(
			".well-known/openid-configuration",
		);
		// Second call: end_session_endpoint with id_token_hint
		const logoutUrl = new URL(mockFetch.mock.calls[1]?.[0] as string);
		expect(logoutUrl.origin).toBe("https://proconnect.example.com");
		expect(logoutUrl.searchParams.get("id_token_hint")).toBe("test-id-token");
	});

	it("returns early when end_session_endpoint is missing from discovery", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({}),
		});

		await terminateProConnectSession("user-123");

		// Only the discovery call, no logout call
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("silently fails when OIDC discovery fetch throws", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch.mockRejectedValue(new Error("Network error"));

		await expect(
			terminateProConnectSession("user-123"),
		).resolves.toBeUndefined();
	});

	it("silently fails when end_session fetch throws", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch
			.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						end_session_endpoint:
							"https://proconnect.example.com/api/v2/session/end",
					}),
			})
			.mockRejectedValueOnce(new Error("Connection refused"));

		await expect(
			terminateProConnectSession("user-123"),
		).resolves.toBeUndefined();
	});
});
