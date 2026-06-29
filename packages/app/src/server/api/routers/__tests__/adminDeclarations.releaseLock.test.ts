import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const DECL_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const adminSession = {
	user: { id: "admin-1", email: "admin@example.fr", isAdmin: true },
	expires: "",
};

const userSession = {
	user: { id: "user-1", email: "user@example.fr", isAdmin: false },
	expires: "",
};

type LockRow = {
	userId: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	expiresAt: Date;
};

function buildDb(lock: LockRow | null) {
	const deleteChain = {
		where: vi.fn().mockResolvedValue(undefined),
	};
	const select = vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({
			innerJoin: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(lock ? [lock] : []),
				}),
			}),
		}),
	});
	const del = vi.fn().mockReturnValue(deleteChain);
	return { select, delete: del, __deleteChain: deleteChain };
}

const activeLock: LockRow = {
	userId: "user-9",
	email: "editor@example.fr",
	firstName: "Bob",
	lastName: "Martin",
	expiresAt: new Date("2026-03-20T10:00:00Z"),
};

describe("adminDeclarationsRouter — releaseLock", () => {
	beforeEach(() => vi.resetAllMocks());

	it("releases the lock of a locked declaration", async () => {
		const db = buildDb(activeLock);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.releaseLock({ declarationId: DECL_ID });

		expect(result).toEqual({ declarationId: DECL_ID });
		expect(db.delete).toHaveBeenCalledTimes(1);
		expect(db.__deleteChain.where).toHaveBeenCalledTimes(1);
	});

	it("rejects with BAD_REQUEST when no active lock exists", async () => {
		const db = buildDb(null);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const error = await caller
			.releaseLock({ declarationId: DECL_ID })
			.catch((e) => e);
		expect(error).toBeInstanceOf(TRPCError);
		expect((error as TRPCError).code).toBe("BAD_REQUEST");
		expect((error as TRPCError).message).toMatch(/aucun verrou actif/);
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("rejects with UNAUTHORIZED when the caller is not an admin", async () => {
		const db = buildDb(activeLock);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: userSession,
			headers: new Headers(),
		} as never);

		await expect(
			caller.releaseLock({ declarationId: DECL_ID }),
		).rejects.toThrow(/administrateurs/i);
		expect(db.delete).not.toHaveBeenCalled();
	});
});

describe("adminDeclarationsRouter — releaseLock audit wiring", () => {
	it("AUDIT_ACTIONS.ADMIN_DECLARATION_RELEASE_LOCK is wired with category mutation", async () => {
		const { AUDIT_ACTIONS, AUDIT_ACTION_CATEGORIES } = await import(
			"~/modules/audit/shared/actionKeys"
		);
		expect(AUDIT_ACTIONS.ADMIN_DECLARATION_RELEASE_LOCK).toBe(
			"admin_declaration.release_lock",
		);
		expect(
			AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.ADMIN_DECLARATION_RELEASE_LOCK],
		).toBe("mutation");
	});
});
