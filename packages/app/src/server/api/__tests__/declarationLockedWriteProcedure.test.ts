import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildLockHolder } from "~/server/api/routers/__tests__/helpers/lockTestHelpers";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

const mockGetActiveLock = vi.fn();
vi.mock("~/server/services/declarationLockService", () => ({
	getActiveLock: (...args: unknown[]) => mockGetActiveLock(...args),
}));

import { createTRPCRouter, declarationLockedWriteProcedure } from "../trpc";

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const USER_SIRET = "33978727700015";
const DECLARATION_ID = "decl-1";

const router = createTRPCRouter({
	write: declarationLockedWriteProcedure.mutation(({ ctx }) => ({
		ok: true,
		declarationId: ctx.declarationId,
	})),
});

// fetchCurrentDeclarationId (inherited from declarationWriteProcedure) resolves
// the current-year declaration id off ctx.db before the lock check runs.
function createDb() {
	const limit = vi.fn().mockResolvedValue([{ id: DECLARATION_ID }]);
	const where = vi.fn().mockReturnValue({ limit });
	const from = vi.fn().mockReturnValue({ where });
	const select = vi.fn().mockReturnValue({ from });
	return { select } as unknown;
}

function createCaller(db: unknown) {
	return router.createCaller({
		db,
		session: {
			user: {
				id: USER_ID,
				email: "user@example.com",
				siret: USER_SIRET,
				isAdmin: false,
				impersonation: null,
			},
			expires: "",
		},
		headers: new Headers(),
	} as never);
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("declarationLockedWriteProcedure", () => {
	it("passes when the current user holds an active lock", async () => {
		mockGetActiveLock.mockResolvedValue(buildLockHolder({ userId: USER_ID }));

		await expect(createCaller(createDb()).write()).resolves.toEqual({
			ok: true,
			declarationId: DECLARATION_ID,
		});
		expect(mockGetActiveLock).toHaveBeenCalledWith(
			expect.anything(),
			DECLARATION_ID,
		);
	});

	it("throws CONFLICT when there is no lock at all", async () => {
		mockGetActiveLock.mockResolvedValue(null);

		await expect(createCaller(createDb()).write()).rejects.toMatchObject({
			code: "CONFLICT",
		});
	});

	it("throws CONFLICT when the active lock is held by another co-declarant (S2)", async () => {
		mockGetActiveLock.mockResolvedValue(
			buildLockHolder({ userId: OTHER_USER_ID }),
		);

		await expect(createCaller(createDb()).write()).rejects.toBeInstanceOf(
			TRPCError,
		);
		await expect(createCaller(createDb()).write()).rejects.toMatchObject({
			code: "CONFLICT",
			message: "Déclaration verrouillée par un autre utilisateur.",
		});
	});

	it("throws CONFLICT when the lock has expired (getActiveLock returns null on lazy expiry)", async () => {
		// getActiveLock already filters out expired rows, so an expired lock is
		// indistinguishable from no lock at the middleware boundary.
		mockGetActiveLock.mockResolvedValue(null);

		await expect(createCaller(createDb()).write()).rejects.toMatchObject({
			code: "CONFLICT",
		});
	});
});
