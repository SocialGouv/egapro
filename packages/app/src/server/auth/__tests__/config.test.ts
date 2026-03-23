import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/schema", () => ({
	users: {},
	accounts: {},
	companies: {},
	userCompanies: {},
}));
vi.mock("@auth/drizzle-adapter", () => ({
	DrizzleAdapter: () => ({}),
}));
vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn(),
}));

import { authConfig } from "../config";

const { callbacks } = authConfig;

// NextAuth callback types are stricter than runtime behavior — cast params via unknown.
function callJwt(params: Record<string, unknown>) {
	return callbacks.jwt(
		params as unknown as Parameters<typeof callbacks.jwt>[0],
	);
}

function callSession(params: Record<string, unknown>) {
	return callbacks.session(
		params as unknown as Parameters<typeof callbacks.session>[0],
	);
}

describe("auth config", () => {
	describe("jwt callback", () => {
		it("populates token with user data on sign-in", async () => {
			const token = { sub: "sub-123" } as JWT;
			const user = {
				id: "user-123",
				siret: "12345678901234",
				phone: "0123456789",
			} as User & { siret: string; phone: string };

			const result = await callJwt({
				token,
				user,
				account: {} as Account,
				trigger: "signIn",
			});

			expect(result.id).toBe("user-123");
			expect(result.siret).toBe("12345678901234");
			expect(result.phone).toBe("0123456789");
		});

		it("sets siret and phone to null when user has no extra fields", async () => {
			const token = { sub: "sub-123" } as JWT;
			const user = { id: "user-456" } as User;

			const result = await callJwt({
				token,
				user,
				account: {} as Account,
				trigger: "signIn",
			});

			expect(result.id).toBe("user-456");
			expect(result.siret).toBeNull();
			expect(result.phone).toBeNull();
		});

		it("preserves existing token data when no user is provided", async () => {
			const token = {
				sub: "sub-123",
				id: "user-123",
				siret: "12345678901234",
				phone: "0123456789",
			} as JWT;

			const result = await callJwt({ token, account: null });

			expect(result.id).toBe("user-123");
			expect(result.siret).toBe("12345678901234");
			expect(result.phone).toBe("0123456789");
		});
	});

	describe("session callback", () => {
		it("maps token data to session user", () => {
			const result = callSession({
				session: {
					user: { name: "Test User", email: "test@example.com" },
					expires: "2026-12-31T00:00:00.000Z",
				},
				token: {
					sub: "sub-123",
					id: "user-123",
					siret: "12345678901234",
					phone: "0123456789",
				},
			});

			expect(result.user.id).toBe("user-123");
			expect(result.user.siret).toBe("12345678901234");
			expect(result.user.phone).toBe("0123456789");
			expect(result.user.name).toBe("Test User");
			expect(result.user.email).toBe("test@example.com");
		});

		it("defaults siret and phone to null when token has no values", () => {
			const result = callSession({
				session: {
					user: { name: "Test" },
					expires: "2026-12-31T00:00:00.000Z",
				},
				token: { sub: "sub-123", id: "user-456" },
			});

			expect(result.user.siret).toBeNull();
			expect(result.user.phone).toBeNull();
		});
	});

	describe("redirect callback", () => {
		const baseUrl = "http://localhost:3000";

		it("redirects to /mon-espace when url equals baseUrl", () => {
			const result = callbacks.redirect({ url: baseUrl, baseUrl });
			expect(result).toBe(`${baseUrl}/mon-espace`);
		});

		it("redirects to /mon-espace when url is baseUrl + /", () => {
			const result = callbacks.redirect({
				url: `${baseUrl}/`,
				baseUrl,
			});
			expect(result).toBe(`${baseUrl}/mon-espace`);
		});

		it("redirects to /mon-espace when url is /", () => {
			const result = callbacks.redirect({ url: "/", baseUrl });
			expect(result).toBe(`${baseUrl}/mon-espace`);
		});

		it("preserves path when url starts with baseUrl and has a non-root path", () => {
			const url = `${baseUrl}/dashboard`;
			const result = callbacks.redirect({ url, baseUrl });
			expect(result).toBe(url);
		});

		it("prefixes relative url with baseUrl", () => {
			const result = callbacks.redirect({ url: "/dashboard", baseUrl });
			expect(result).toBe(`${baseUrl}/dashboard`);
		});

		it("redirects to /mon-espace for external urls", () => {
			const result = callbacks.redirect({
				url: "https://evil.com/steal",
				baseUrl,
			});
			expect(result).toBe(`${baseUrl}/mon-espace`);
		});
	});

	describe("session strategy", () => {
		it("uses jwt strategy", () => {
			expect(authConfig.session?.strategy).toBe("jwt");
		});

		it("has a 30-day max age", () => {
			expect(authConfig.session?.maxAge).toBe(30 * 24 * 60 * 60);
		});
	});

	describe("pages", () => {
		it("uses /login as the sign-in page", () => {
			expect(authConfig.pages?.signIn).toBe("/login");
		});
	});
});
