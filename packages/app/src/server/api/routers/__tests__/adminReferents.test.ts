import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/schema", () => ({
	referents: {
		id: "id",
		region: "region",
		county: "county",
		name: "name",
		type: "type",
		value: "value",
		principal: "principal",
		substituteName: "substituteName",
		substituteEmail: "substituteEmail",
		createdAt: "createdAt",
	},
}));

const mockInsertValues = vi.fn();
const mockUpdateSet = vi.fn();
const mockDeleteCalled = vi.fn();
const mockTransaction = vi.fn();

type SelectQueue = unknown[];
let selectQueue: SelectQueue = [];

function makeChain(): unknown {
	const results = selectQueue.shift() ?? [];
	const thenable = Promise.resolve(results);
	const chain: Record<string, unknown> = {
		from: () => chain,
		where: () => chain,
		orderBy: () => chain,
		limit: () => chain,
		offset: () => chain,
		then: thenable.then.bind(thenable),
		catch: thenable.catch.bind(thenable),
		finally: thenable.finally.bind(thenable),
	};
	return chain;
}

function createMockDb() {
	const db = {
		select: vi.fn(() => makeChain()),
		insert: vi.fn(() => ({
			values: (v: unknown) => {
				mockInsertValues(v);
				return {
					returning: () => Promise.resolve([{ id: "new-id" }]),
				};
			},
		})),
		update: vi.fn(() => ({
			set: (v: unknown) => {
				mockUpdateSet(v);
				return { where: () => Promise.resolve(undefined) };
			},
		})),
		delete: vi.fn(() => {
			mockDeleteCalled();
			return { where: () => Promise.resolve(undefined) };
		}),
		transaction: mockTransaction.mockImplementation(async (fn) => fn(db)),
	};
	return db;
}

async function createCaller(mockDb: unknown, isAdmin = true) {
	const { adminReferentsRouter } = await import("../adminReferents");
	return adminReferentsRouter.createCaller({
		db: mockDb,
		session: {
			user: { id: "admin-1", email: "admin@gov.fr", isAdmin },
			expires: "",
		},
		headers: new Headers(),
	} as never);
}

describe("adminReferentsRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		selectQueue = [];
	});

	describe("authorization", () => {
		it("rejects non-admin users", async () => {
			const caller = await createCaller(createMockDb(), false);
			await expect(
				caller.search({
					page: 1,
					pageSize: 20,
					sortBy: "region",
					sortOrder: "asc",
				}),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
		});
	});

	describe("search", () => {
		it("returns rows and pagination metadata", async () => {
			const rows = [
				{
					id: "r-1",
					region: "11",
					county: "75",
					name: "Jean",
					type: "email",
					value: "j@gouv.fr",
					principal: true,
					substituteName: null,
					substituteEmail: null,
					createdAt: new Date(),
				},
			];
			selectQueue = [rows, [{ total: 1 }]];
			const caller = await createCaller(createMockDb());

			const result = await caller.search({
				page: 1,
				pageSize: 20,
				sortBy: "region",
				sortOrder: "asc",
			});

			expect(result).toMatchObject({
				rows,
				total: 1,
				page: 1,
				pageSize: 20,
				totalPages: 1,
			});
		});

		it("applies filters on query, region and county", async () => {
			selectQueue = [[], [{ total: 0 }]];
			const caller = await createCaller(createMockDb());

			const result = await caller.search({
				query: "Jean",
				region: "11",
				county: "75",
				page: 2,
				pageSize: 10,
				sortBy: "name",
				sortOrder: "desc",
			});

			expect(result.rows).toEqual([]);
			expect(result.total).toBe(0);
			expect(result.totalPages).toBe(1);
		});
	});

	describe("create", () => {
		it("inserts a referent and strips empty optional strings", async () => {
			const caller = await createCaller(createMockDb());

			const result = await caller.create({
				region: "11",
				county: "75",
				name: "Jean",
				type: "email",
				value: "jean@gouv.fr",
				principal: true,
				substituteName: "   ",
				substituteEmail: "",
			});

			expect(result).toEqual({ id: "new-id" });
			expect(mockInsertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					region: "11",
					county: "75",
					name: "Jean",
					substituteName: undefined,
					substituteEmail: undefined,
				}),
			);
		});
	});

	describe("update", () => {
		it("updates a referent and returns its id", async () => {
			const caller = await createCaller(createMockDb());

			const result = await caller.update({
				id: "11111111-1111-4111-8111-111111111111",
				region: "11",
				county: "",
				name: "Jean",
				type: "url",
				value: "https://gouv.fr/contact",
				principal: false,
				substituteName: "",
				substituteEmail: "",
			});

			expect(result).toEqual({ id: "11111111-1111-4111-8111-111111111111" });
			expect(mockUpdateSet).toHaveBeenCalledWith(
				expect.objectContaining({ county: undefined }),
			);
		});
	});

	describe("delete", () => {
		it("deletes the given ids", async () => {
			const caller = await createCaller(createMockDb());

			const result = await caller.delete({
				ids: [
					"11111111-1111-4111-8111-111111111111",
					"22222222-2222-4222-8222-222222222222",
				],
			});

			expect(result).toEqual({ deleted: 2 });
			expect(mockDeleteCalled).toHaveBeenCalled();
		});
	});

	describe("import", () => {
		it("clears and re-inserts all referents in a transaction", async () => {
			const caller = await createCaller(createMockDb());

			const result = await caller.import([
				{
					region: "11",
					county: "75",
					name: "Jean",
					type: "email",
					value: "jean@gouv.fr",
					principal: true,
					substituteName: "",
					substituteEmail: "",
				},
				{
					region: "11",
					county: "",
					name: "Marie",
					type: "url",
					value: "https://gouv.fr",
					principal: false,
					substituteName: "",
					substituteEmail: "",
				},
			]);

			expect(result).toEqual({ imported: 2 });
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockDeleteCalled).toHaveBeenCalled();
			expect(mockInsertValues).toHaveBeenCalledTimes(2);
		});
	});

	describe("exportAll", () => {
		it("returns all referents ordered by region then county", async () => {
			const rows = [
				{
					region: "11",
					county: "75",
					name: "Jean",
					type: "email" as const,
					value: "j@gouv.fr",
					principal: true,
					substituteName: null,
					substituteEmail: null,
				},
			];
			selectQueue = [rows];
			const caller = await createCaller(createMockDb());

			const result = await caller.exportAll();

			expect(result).toEqual(rows);
		});
	});
});
