import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const adminSession = {
	user: {
		id: "admin-1",
		email: "admin@example.fr",
		isAdmin: true,
		adminMfaAt: Math.floor(Date.now() / 1000),
	},
	expires: "",
};

const dialect = new PgDialect({ casing: "snake_case" });

function renderSql(value: unknown): string {
	return dialect.sqlToQuery(value as never).sql;
}

function buildDb(years: number[]) {
	const orderBy = vi.fn().mockResolvedValue(years.map((year) => ({ year })));
	const from = vi.fn().mockReturnValue({ orderBy });
	return {
		selectDistinct: vi.fn().mockReturnValue({ from }),
		__from: from,
		__orderBy: orderBy,
	};
}

async function callListYears(db: ReturnType<typeof buildDb>) {
	const { adminDeclarationsRouter } = await import("../adminDeclarations");
	return adminDeclarationsRouter.createCaller({
		db,
		session: adminSession,
		headers: new Headers(),
	} as never);
}

describe("adminDeclarationsRouter — listYears", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns the distinct years as plain numbers", async () => {
		const db = buildDb([2026, 2025, 2024]);
		const caller = await callListYears(db);

		const result = await caller.listYears();

		expect(result).toEqual([2026, 2025, 2024]);
	});

	it("selects distinct years from the declarations table", async () => {
		const db = buildDb([2026]);
		const caller = await callListYears(db);

		await caller.listYears();

		expect(db.selectDistinct).toHaveBeenCalledTimes(1);
	});

	it("orders the years in descending order", async () => {
		const db = buildDb([2026, 2025]);
		const caller = await callListYears(db);

		await caller.listYears();

		const orderBySql = renderSql(db.__orderBy.mock.calls[0]?.[0]);
		expect(orderBySql).toContain("desc");
	});

	it("rejects non-admin callers", async () => {
		const db = buildDb([]);
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: {
				user: { id: "u", email: "u@x", isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);

		await expect(caller.listYears()).rejects.toThrow(/administrateurs/i);
	});
});
