import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	fetchGipCsv: vi.fn(),
	importGipCsvToDb: vi.fn(),
}));

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

// The global ~/env mock in src/test/setup.ts is a closed allowlist that leaves
// EGAPRO_GIP_MDS_API_URL undefined; the import needs it set.
vi.mock("~/env.js", () => ({
	env: {
		EGAPRO_GIP_MDS_API_URL: "https://api.suit.example.com/gipmds/latest",
	},
}));

vi.mock("~/server/services/gipMds", () => ({
	fetchGipCsv: mocks.fetchGipCsv,
	importGipCsvToDb: mocks.importGipCsvToDb,
}));

const adminSession = {
	user: { id: "admin-1", email: "admin@example.fr", isAdmin: true },
	expires: "",
};

const declarantSession = {
	user: { id: "u-1", email: "declarant@example.fr", isAdmin: false },
	expires: "",
};

async function buildCaller(session: unknown) {
	const { gipMdsRouter } = await import("../gipMds");
	return gipMdsRouter.createCaller({
		db: {},
		session,
		headers: new Headers(),
	} as never);
}

describe("gipMdsRouter.importFromUrl — access control", () => {
	beforeEach(() => vi.clearAllMocks());

	it("rejects an authenticated non-admin declarant", async () => {
		const caller = await buildCaller(declarantSession);

		await expect(caller.importFromUrl()).rejects.toThrow(/administrateurs/i);
		// The wipe-and-reinsert must not even start.
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
		expect(mocks.importGipCsvToDb).not.toHaveBeenCalled();
	});

	it("rejects an anonymous caller", async () => {
		const caller = await buildCaller(null);

		await expect(caller.importFromUrl()).rejects.toThrow();
		expect(mocks.fetchGipCsv).not.toHaveBeenCalled();
	});

	it("lets an admin run the import", async () => {
		mocks.fetchGipCsv.mockResolvedValue("csv");
		mocks.importGipCsvToDb.mockResolvedValue({ inserted: 3 });
		const caller = await buildCaller(adminSession);

		await expect(caller.importFromUrl()).resolves.toEqual({ inserted: 3 });
		expect(mocks.fetchGipCsv).toHaveBeenCalledWith(
			"https://api.suit.example.com/gipmds/latest",
		);
	});
});
