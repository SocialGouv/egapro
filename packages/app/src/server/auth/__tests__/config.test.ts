import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("~/server/db", () => ({
	db: {
		query: {
			users: {
				findFirst: (...args: unknown[]) => mockFindFirst(...args),
			},
		},
		insert: (...args: unknown[]) => mockInsert(...args),
		update: (...args: unknown[]) =>
			mockUpdate(...args) ?? {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			},
		transaction: (fn: (tx: unknown) => unknown) => mockTransaction(fn),
	},
}));
vi.mock("~/server/db/schema", () => ({
	users: { email: "email", id: "id" },
	companies: { siren: "siren" },
	userCompanies: {},
}));
vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn(),
}));

// Local override of the global `~/env` mock: the shared one carries no
// ADMIN_EMAILS, and the two-factor audit trail only exists for admin-eligible
// accounts. The address below matches none of the declarant fixtures.
vi.mock("~/env", () => ({
	env: {
		NODE_ENV: "test",
		ADMIN_EMAILS: "agent@example.fr",
		AUTH_SECRET: "test-secret",
		DATABASE_URL: "postgres://localhost/test",
		EGAPRO_PROCONNECT_CLIENT_ID: "test-client-id",
		EGAPRO_PROCONNECT_CLIENT_SECRET: "test-client-secret",
		EGAPRO_PROCONNECT_ISSUER: "https://proconnect.example.com",
		EGAPRO_WEEZ_API_URL: "https://weez.example.com/api",
		NEXTAUTH_URL: "http://localhost:3000/api/auth",
	},
}));

const mockLogAction = vi.fn();
vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
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
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockInsert.mockReset();
		mockUpdate.mockReset();
		mockTransaction.mockReset();
		mockLogAction.mockReset();
	});

	describe("jwt callback", () => {
		it("upserts user and populates token on sign-in (existing user)", async () => {
			const dbUser = {
				id: "uuid-123",
				phone: "0123456789",
			};
			mockFindFirst.mockResolvedValue(dbUser);

			const token = { sub: "sub-123" } as JWT;
			const user = {
				id: "proconnect-sub",
				email: "test@example.com",
				name: "Test",
				siret: "12345678901234",
				firstName: "Test",
				lastName: "User",
			} as User & { siret: string; firstName: string; lastName: string };

			const result = await callJwt({
				token,
				user,
				account: { id_token: "oidc-id-token" } as Account,
				trigger: "signIn",
			});

			expect(result.id).toBe("uuid-123");
			expect(result.siret).toBe("12345678901234");
			expect(result.phone).toBe("0123456789");
			expect(result.id_token).toBe("oidc-id-token");
		});

		it("creates user when not found in DB", async () => {
			mockFindFirst.mockResolvedValue(undefined);
			mockInsert.mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: "new-uuid",
							phone: null,
						},
					]),
				}),
			});

			const token = { sub: "sub-123" } as JWT;
			const user = {
				id: "proconnect-sub",
				email: "new@example.com",
				name: "New User",
			} as User;

			const result = await callJwt({
				token,
				user,
				account: {} as Account,
				trigger: "signIn",
			});

			expect(result.id).toBe("new-uuid");
			expect(mockInsert).toHaveBeenCalled();
		});

		it("stores id_token as null when account has none", async () => {
			mockFindFirst.mockResolvedValue({
				id: "uuid-123",
				phone: null,
			});

			const token = { sub: "sub-123" } as JWT;
			const user = {
				id: "proconnect-sub",
				email: "test@example.com",
			} as User;

			const result = await callJwt({
				token,
				user,
				account: {} as Account,
				trigger: "signIn",
			});

			expect(result.id_token).toBeNull();
		});

		it("preserves existing token data when no user is provided", async () => {
			const token = {
				sub: "sub-123",
				id: "user-123",
				siret: "12345678901234",
				phone: "0123456789",
				id_token: "stored-token",
			} as JWT;

			const result = await callJwt({ token, account: null });

			expect(result.id).toBe("user-123");
			expect(result.siret).toBe("12345678901234");
			expect(result.phone).toBe("0123456789");
			expect(result.id_token).toBe("stored-token");
		});
	});

	const DECLARANT_EMAIL = "declarant@example.fr";

	const proconnectUser = {
		id: "proconnect-sub",
		email: DECLARANT_EMAIL,
		name: "Alice Martin",
		firstName: "Alice",
		lastName: "Martin",
	} as User & { firstName: string; lastName: string };

	const namelessProconnectUser = {
		id: "proconnect-sub",
		email: DECLARANT_EMAIL,
	} as User;

	function signIn(
		existingUser: Record<string, unknown>,
		user: User = proconnectUser,
		token: JWT = { sub: "sub-123" } as JWT,
	) {
		mockFindFirst.mockResolvedValue({
			id: "uuid-123",
			phone: null,
			isAdmin: false,
			...existingUser,
		});
		return callJwt({
			token,
			user,
			account: {} as Account,
			trigger: "signIn",
		});
	}

	describe("jwt callback — ProConnect identity seeding", () => {
		function armUpdate() {
			const where = vi.fn().mockResolvedValue(undefined);
			const set = vi.fn().mockReturnValue({ where });
			mockUpdate.mockReturnValue({ set });
			return set;
		}

		it("seeds both names when the DB row carries none", async () => {
			const set = armUpdate();

			await signIn({ firstName: null, lastName: null });

			expect(set).toHaveBeenCalledWith({
				firstName: "Alice",
				lastName: "Martin",
			});
		});

		it("seeds only the half that is missing", async () => {
			const set = armUpdate();

			await signIn({ firstName: "Camille", lastName: null });

			expect(set).toHaveBeenCalledWith({ lastName: "Martin" });
		});

		it("never overwrites a name already stored, so a Mon profil edit survives the next login", async () => {
			armUpdate();

			await signIn({ firstName: "Camille", lastName: "Durand" });

			expect(mockUpdate).not.toHaveBeenCalled();
		});

		it("leaves the DB row untouched when ProConnect sends no name", async () => {
			armUpdate();

			await signIn({ firstName: null, lastName: null }, namelessProconnectUser);

			expect(mockUpdate).not.toHaveBeenCalled();
		});
	});

	describe("jwt callback — display name", () => {
		it("derives the display name from the DB row, overriding the ProConnect one", async () => {
			const result = await signIn(
				{ firstName: "Camille", lastName: "Durand" },
				proconnectUser,
				{ sub: "sub-123", name: "Alice Martin" } as JWT,
			);

			expect(result.name).toBe("Camille Durand");
		});

		it("orders the display name as firstName then lastName", async () => {
			const result = await signIn(
				{ firstName: "Martin", lastName: "Camille" },
				namelessProconnectUser,
			);

			expect(result.name).toBe("Martin Camille");
		});

		it("reflects the name just seeded from ProConnect on a first login", async () => {
			const result = await signIn({ firstName: null, lastName: null });

			expect(result.name).toBe("Alice Martin");
		});

		it.each([
			["firstName", { firstName: "Camille", lastName: null }, "Camille"],
			["lastName", { firstName: null, lastName: "Durand" }, "Durand"],
		])("joins without a stray space when only %s is stored", async (_field, existingUser, expected) => {
			const result = await signIn(existingUser, namelessProconnectUser);

			expect(result.name).toBe(expected);
		});

		it("falls back to the e-mail when the DB row carries no name", async () => {
			const result = await signIn(
				{ firstName: null, lastName: null },
				namelessProconnectUser,
			);

			expect(result.name).toBe(DECLARANT_EMAIL);
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

		it("exposes the two-factor instant so the backoffice guards can read it", () => {
			const result = callSession({
				session: {
					user: { name: "Test" },
					expires: "2026-12-31T00:00:00.000Z",
				},
				token: { sub: "sub-123", id: "user-456", adminMfaAt: 1_772_000_000 },
			});

			expect(result.user.adminMfaAt).toBe(1_772_000_000);
		});

		it("exposes a null two-factor instant when the token carries none", () => {
			const result = callSession({
				session: {
					user: { name: "Test" },
					expires: "2026-12-31T00:00:00.000Z",
				},
				token: { sub: "sub-123", id: "user-456" },
			});

			expect(result.user.adminMfaAt).toBeNull();
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

	describe("jwt callback — admin two-factor marker", () => {
		const ADMIN_EMAIL = "agent@example.fr";
		const AUTH_TIME = 1_772_000_000;

		/** A ProConnect id_token carrying the given claims, signature aside. */
		function idToken(claims: Record<string, unknown>) {
			const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
			return `header.${payload}.signature`;
		}

		function signInWith(
			claims: Record<string, unknown> | null,
			email = DECLARANT_EMAIL,
		) {
			mockFindFirst.mockResolvedValue({
				id: "uuid-123",
				phone: null,
				firstName: "Alice",
				lastName: "Martin",
				isAdmin: false,
			});
			return callJwt({
				token: { sub: "sub-123" } as JWT,
				user: { id: "proconnect-sub", email } as User,
				account: (claims
					? { id_token: idToken(claims) }
					: {}) as unknown as Account,
				trigger: "signIn",
			});
		}

		it("dates the session with auth_time when ProConnect reports a second factor", async () => {
			const result = await signInWith({
				acr: "eidas1-mfa",
				auth_time: AUTH_TIME,
			});

			expect(result.adminMfaAt).toBe(AUTH_TIME);
		});

		it("falls back to the server clock when the accepted level carries no auth_time", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-03-10T08:00:00.000Z"));
			try {
				const result = await signInWith({ acr: "eidas1-mfa" });

				expect(result.adminMfaAt).toBe(
					Math.floor(Date.parse("2026-03-10T08:00:00.000Z") / 1000),
				);
			} finally {
				vi.useRealTimers();
			}
		});

		it.each([
			["a non-numeric auth_time", "1772000000"],
			["an auth_time of zero", 0],
			["a negative auth_time", -1],
		])("ignores %s and dates from the server clock", async (_label, authTime) => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-03-10T08:00:00.000Z"));
			try {
				const result = await signInWith({
					acr: "eidas1-mfa",
					auth_time: authTime,
				});

				expect(result.adminMfaAt).toBe(
					Math.floor(Date.parse("2026-03-10T08:00:00.000Z") / 1000),
				);
			} finally {
				vi.useRealTimers();
			}
		});

		it("truncates a fractional auth_time to whole seconds", async () => {
			const result = await signInWith({
				acr: "eidas1-mfa",
				auth_time: AUTH_TIME + 0.75,
			});

			expect(result.adminMfaAt).toBe(AUTH_TIME);
		});

		it.each([
			"eidas1",
			"eidas2",
			"eidas3",
		])("signs the user in and leaves the session undated for %s", async (acr) => {
			const result = await signInWith({ acr, auth_time: AUTH_TIME });

			expect(result.id).toBe("uuid-123");
			expect(result.adminMfaAt).toBeUndefined();
		});

		it.each([
			["the id_token carries no acr", { auth_time: AUTH_TIME }],
			["acr is not a string", { acr: 1, auth_time: AUTH_TIME }],
		])("leaves the session undated when %s", async (_label, claims) => {
			const result = await signInWith(claims);

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("leaves the session undated when the account carries no id_token", async () => {
			const result = await signInWith(null);

			expect(result.adminMfaAt).toBeUndefined();
		});

		it.each([
			["is not a JWT at all", "not-a-jwt"],
			["has an undecodable payload", "header..signature"],
			["has a payload that is not JSON", "header.bm90LWpzb24.signature"],
		])("leaves the session undated when the id_token %s", async (_label, raw) => {
			mockFindFirst.mockResolvedValue({
				id: "uuid-123",
				phone: null,
				isAdmin: false,
			});

			const result = await callJwt({
				token: { sub: "sub-123" } as JWT,
				user: { id: "proconnect-sub", email: DECLARANT_EMAIL } as User,
				account: { id_token: raw } as unknown as Account,
				trigger: "signIn",
			});

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("records the two-factor passage of an admin account", async () => {
			await signInWith(
				{ acr: "eidas1-mfa", auth_time: AUTH_TIME },
				ADMIN_EMAIL,
			);

			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "auth.admin_mfa",
					status: "success",
					userId: "uuid-123",
					userEmail: ADMIN_EMAIL,
					metadata: { acr: "eidas1-mfa", authTime: AUTH_TIME },
				}),
			);
		});

		it("records a refusal when the level of an admin account proves no second factor", async () => {
			await signInWith({ acr: "eidas1", auth_time: AUTH_TIME }, ADMIN_EMAIL);

			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "auth.admin_mfa",
					status: "failure",
					metadata: { acr: "eidas1", authTime: null },
				}),
			);
		});

		it("logs the level and the instant, never the token nor the raw claims", async () => {
			await signInWith(
				{ acr: "eidas1-mfa", auth_time: AUTH_TIME, sub: "proconnect-sub" },
				ADMIN_EMAIL,
			);

			const [entry] = mockLogAction.mock.calls[0] as [
				{ metadata: Record<string, unknown> },
			];
			expect(Object.keys(entry.metadata).sort()).toEqual(["acr", "authTime"]);
			expect(JSON.stringify(entry)).not.toContain("header.");
		});

		it("does not open an admin audit trail for a declarant sign-in", async () => {
			await signInWith({ acr: "eidas1-mfa", auth_time: AUTH_TIME });

			expect(mockLogAction).not.toHaveBeenCalled();
		});
	});

	describe("jwt callback — adminMfaAt is not client-writable", () => {
		it("ignores an adminMfaAt pushed through a client session update", async () => {
			const result = await callJwt({
				token: { sub: "sub-123", id: "uuid-123", isAdmin: true } as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			});

			expect(result.adminMfaAt).toBeUndefined();
		});

		it("never lets a session update refresh a marker already on the token", async () => {
			const result = await callJwt({
				token: {
					sub: "sub-123",
					id: "uuid-123",
					isAdmin: true,
					adminMfaAt: 1_772_000_000,
				} as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			});

			expect(result.adminMfaAt).toBe(1_772_000_000);
		});

		it("ignores an adminMfaAt pushed by a non-admin session update", async () => {
			const result = await callJwt({
				token: { sub: "sub-123", id: "uuid-123", isAdmin: false } as JWT,
				trigger: "update",
				session: { adminMfaAt: 9_999_999_999 },
			});

			expect(result.adminMfaAt).toBeUndefined();
		});
	});

	describe("proconnect authorization request", () => {
		function proconnectProvider() {
			return authConfig.providers.find(
				(provider) => (provider as { id?: string }).id === "proconnect",
			) as { authorization: { params: Record<string, unknown> } };
		}

		it("asks for the declarant scopes and nothing more", () => {
			expect(proconnectProvider().authorization.params).toEqual({
				scope: "openid email given_name usual_name siret",
			});
		});

		it.each([
			"claims",
			"max_age",
			"acr_values",
		])("never carries %s on the declarant journey", (param) => {
			expect(proconnectProvider().authorization.params).not.toHaveProperty(
				param,
			);
		});
	});
});
