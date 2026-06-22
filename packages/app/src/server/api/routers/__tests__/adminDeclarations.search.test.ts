import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const DECL_ID_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const adminSession = {
	user: { id: "admin-1", email: "admin@example.fr", isAdmin: true },
	expires: "",
};

type Row = {
	id: string;
	siren: string;
	year: number;
	status: string;
	cancelledAt: Date | null;
	remunerationScore: number | null;
	createdAt: Date;
	updatedAt: Date;
	companyName: string;
	declarantEmail: string;
	declarantFirstName: string | null;
	declarantLastName: string | null;
};

function buildDb(rows: Row[]) {
	const chain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn().mockResolvedValue(rows),
	};
	const countChain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue([{ total: rows.length }]),
	};
	return {
		select: vi
			.fn()
			.mockImplementationOnce(() => chain)
			.mockImplementationOnce(() => countChain),
		__chain: chain,
	};
}

const activeRow: Row = {
	id: DECL_ID_1,
	siren: "123456789",
	year: 2026,
	status: "awaiting_compliance_path_choice",
	cancelledAt: null,
	remunerationScore: 85,
	createdAt: new Date("2026-03-01"),
	updatedAt: new Date("2026-03-01"),
	companyName: "ACME Corp",
	declarantEmail: "alice@example.fr",
	declarantFirstName: "Alice",
	declarantLastName: "Dupont",
};

const cancelledRow: Row = {
	...activeRow,
	id: DECL_ID_2,
	cancelledAt: new Date("2026-04-01"),
};

describe("adminDeclarationsRouter — search", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns only cancelled rows when status=cancelled", async () => {
		const db = buildDb([cancelledRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({ status: "cancelled" });

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.id).toBe(DECL_ID_2);
	});

	it("includes both active and cancelled rows by default (no status filter)", async () => {
		const db = buildDb([activeRow, cancelledRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({});

		expect(result.rows).toHaveLength(2);
	});

	it("excludes cancelled rows when filtering by submitted status", async () => {
		const db = buildDb([activeRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({
			status: "awaiting_compliance_path_choice",
		});

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.id).toBe(DECL_ID_1);
	});

	it("includes cancelledAt field in search results", async () => {
		const db = buildDb([cancelledRow]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.search({ status: "cancelled" });

		expect(result.rows[0]?.cancelledAt).toBeInstanceOf(Date);
	});
});
