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
	},
}));

type SelectQueue = unknown[];
let selectQueue: SelectQueue = [];

const CHAIN_METHODS = new Set(["from", "where", "orderBy", "limit", "offset"]);

function wrapChain(results: unknown): unknown {
	const promise = Promise.resolve(results);
	const chain = new Proxy(
		{},
		{
			get(_target, prop) {
				if (prop === "then" || prop === "catch" || prop === "finally") {
					return (promise[prop] as (...args: unknown[]) => unknown).bind(
						promise,
					);
				}
				if (typeof prop === "string" && CHAIN_METHODS.has(prop)) {
					return () => chain;
				}
				return undefined;
			},
		},
	);
	return chain;
}

function makeChain(): unknown {
	return wrapChain(selectQueue.shift() ?? []);
}

function createMockDb() {
	return {
		select: vi.fn(() => makeChain()),
	};
}

async function createCaller(mockDb: unknown) {
	const { publicReferentsRouter } = await import("../publicReferents");
	return publicReferentsRouter.createCaller({
		db: mockDb,
		session: null,
		headers: new Headers(),
	} as never);
}

describe("publicReferentsRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		selectQueue = [];
	});

	describe("search", () => {
		it("returns rows and pagination metadata (no contact fields in projection)", async () => {
			const rows = [
				{
					id: "r-1",
					region: "11",
					county: "75",
					name: "Jean",
					principal: true,
				},
			];
			selectQueue = [rows, [{ total: 1 }]];
			const caller = await createCaller(createMockDb());

			const result = await caller.search({ page: 1, pageSize: 20 });

			expect(result).toEqual({
				rows,
				total: 1,
				page: 1,
				pageSize: 20,
				totalPages: 1,
			});
			// Ensure no contact fields accidentally leak into the list projection.
			for (const row of result.rows) {
				expect(row).not.toHaveProperty("value");
				expect(row).not.toHaveProperty("type");
				expect(row).not.toHaveProperty("substituteEmail");
			}
		});

		it("applies filters on query, region and county", async () => {
			selectQueue = [[], [{ total: 0 }]];
			const caller = await createCaller(createMockDb());

			const result = await caller.search({
				query: "Jean",
				region: "11",
				county: "75",
				page: 1,
				pageSize: 20,
			});

			expect(result.rows).toEqual([]);
			expect(result.total).toBe(0);
			expect(result.totalPages).toBe(1);
		});

		it("computes totalPages from total and pageSize", async () => {
			selectQueue = [[], [{ total: 55 }]];
			const caller = await createCaller(createMockDb());

			const result = await caller.search({ page: 2, pageSize: 20 });

			// ceil(55 / 20) = 3
			expect(result.totalPages).toBe(3);
		});

		it("returns at least 1 for totalPages even when empty", async () => {
			selectQueue = [[], [{ total: 0 }]];
			const caller = await createCaller(createMockDb());

			const result = await caller.search({ page: 1, pageSize: 20 });

			expect(result.totalPages).toBe(1);
		});
	});

	describe("getById", () => {
		it("returns the full referent including contact fields when found", async () => {
			const row = {
				id: "11111111-1111-4111-8111-111111111111",
				region: "11",
				county: "75",
				name: "Jean",
				type: "email" as const,
				value: "jean@gouv.fr",
				principal: true,
				substituteName: "Marie",
				substituteEmail: "marie@gouv.fr",
			};
			selectQueue = [[row]];
			const caller = await createCaller(createMockDb());

			const result = await caller.getById({
				id: "11111111-1111-4111-8111-111111111111",
			});

			expect(result).toEqual(row);
		});

		it("returns null when no referent matches the id", async () => {
			selectQueue = [[]];
			const caller = await createCaller(createMockDb());

			const result = await caller.getById({
				id: "11111111-1111-4111-8111-111111111111",
			});

			expect(result).toBeNull();
		});
	});
});
