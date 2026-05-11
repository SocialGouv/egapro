import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/modules/domain", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/domain")>();
	return {
		...actual,
		getCurrentYear: vi.fn().mockReturnValue(2026),
	};
});

const DECL_ID_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_3 = "6ba7b812-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_4 = "6ba7b813-9dad-11d1-80b4-00c04fd430c8";

const adminSession = {
	user: { id: "admin-1", email: "admin@example.fr", isAdmin: true },
	expires: "",
};

const userSession = {
	user: { id: "user-1", email: "user@example.fr", isAdmin: false },
	expires: "",
};

function buildDb(
	declarationRow: {
		id: string;
		year: number;
		cancelledAt: Date | null;
	} | null,
) {
	const updateChain = {
		set: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue(undefined),
	};
	return {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi
						.fn()
						.mockResolvedValue(declarationRow ? [declarationRow] : []),
				}),
			}),
		}),
		update: vi.fn().mockReturnValue(updateChain),
		__updateChain: updateChain,
	};
}

describe("adminDeclarationsRouter — cancel", () => {
	beforeEach(() => vi.resetAllMocks());

	it("cancels an active declaration in the current year", async () => {
		const db = buildDb({ id: DECL_ID_1, year: 2026, cancelledAt: null });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.cancel({ id: DECL_ID_1 });

		expect(result.id).toBe(DECL_ID_1);
		expect(result.cancelledAt).toBeInstanceOf(Date);
		expect(db.update).toHaveBeenCalled();
		expect(db.__updateChain.set).toHaveBeenCalledWith(
			expect.objectContaining({ cancelledAt: expect.any(Date) }),
		);
	});

	it("rejects with BAD_REQUEST when the declaration belongs to a past campaign", async () => {
		const db = buildDb({ id: DECL_ID_2, year: 2025, cancelledAt: null });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const error = await caller.cancel({ id: DECL_ID_2 }).catch((e) => e);
		expect(error).toBeInstanceOf(TRPCError);
		expect((error as TRPCError).code).toBe("BAD_REQUEST");
		expect((error as TRPCError).message).toMatch(/campagne passée/);
		expect(db.update).not.toHaveBeenCalled();
	});

	it("rejects with BAD_REQUEST when the declaration is already cancelled", async () => {
		const db = buildDb({
			id: DECL_ID_3,
			year: 2026,
			cancelledAt: new Date("2026-04-01"),
		});
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const error = await caller.cancel({ id: DECL_ID_3 }).catch((e) => e);
		expect(error).toBeInstanceOf(TRPCError);
		expect((error as TRPCError).code).toBe("BAD_REQUEST");
		expect((error as TRPCError).message).toMatch(/déjà annulée/);
		expect(db.update).not.toHaveBeenCalled();
	});

	it("rejects with UNAUTHORIZED when the caller is not an admin", async () => {
		const db = buildDb({ id: DECL_ID_4, year: 2026, cancelledAt: null });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: userSession,
			headers: new Headers(),
		} as never);

		await expect(caller.cancel({ id: DECL_ID_4 })).rejects.toThrow(
			/administrateurs/i,
		);
		expect(db.update).not.toHaveBeenCalled();
	});
});

describe("adminDeclarationsRouter — cancel audit wiring", () => {
	it("AUDIT_ACTIONS.ADMIN_DECLARATION_CANCEL is wired with category mutation", async () => {
		const { AUDIT_ACTIONS, AUDIT_ACTION_CATEGORIES } = await import(
			"~/modules/audit/shared/actionKeys"
		);
		expect(AUDIT_ACTIONS.ADMIN_DECLARATION_CANCEL).toBe(
			"admin_declaration.cancel",
		);
		expect(
			AUDIT_ACTION_CATEGORIES[AUDIT_ACTIONS.ADMIN_DECLARATION_CANCEL],
		).toBe("mutation");
	});
});
