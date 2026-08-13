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
