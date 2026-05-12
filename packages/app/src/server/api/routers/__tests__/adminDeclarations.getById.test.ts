import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const DECL_ID_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
const DECL_ID_3 = "6ba7b812-9dad-11d1-80b4-00c04fd430c8";

const adminSession = {
	user: { id: "admin-1", email: "admin@example.fr", isAdmin: true },
	expires: "",
};

const baseDeclaration = {
	id: DECL_ID_1,
	siren: "123456789",
	year: 2026,
	status: "submitted",
	currentStep: 6,
	totalWomen: 50,
	totalMen: 50,
	remunerationScore: 85,
	firstDeclarationPathChoice: null,
	secondDeclarationPathChoice: null,
	demarcheCompletedAt: null,
	secondDeclarationSubmittedAt: null,
	createdAt: new Date("2026-03-01"),
	updatedAt: new Date("2026-03-15"),
	cancelledAt: null,
	companyName: "ACME Corp",
	companyAddress: "1 rue de Paris",
	companyNafCode: "6201Z",
	companyWorkforce: 200,
	companyHasCse: true,
	declarantEmail: "alice@example.fr",
	declarantFirstName: "Alice",
	declarantLastName: "Dupont",
	declarantPhone: null,
};

function buildDb(options: {
	declaration: typeof baseDeclaration | null;
	siblings?: {
		id: string;
		status: string;
		cancelledAt: Date | null;
		updatedAt: Date;
	}[];
}) {
	const { declaration, siblings = [] } = options;

	let selectCallCount = 0;
	return {
		select: vi.fn().mockImplementation(() => {
			selectCallCount++;
			const callIndex = selectCallCount;
			const chain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockImplementation(() => {
					if (callIndex === 1)
						return Promise.resolve(declaration ? [declaration] : []);
					return chain;
				}),
				orderBy: vi.fn().mockResolvedValue(callIndex === 4 ? siblings : []),
			};
			if (callIndex === 2 || callIndex === 3) {
				chain.where = vi.fn().mockResolvedValue([]);
			}
			return chain;
		}),
	};
}

describe("adminDeclarationsRouter — getById", () => {
	beforeEach(() => vi.resetAllMocks());

	it("returns null when declaration not found", async () => {
		const db = buildDb({ declaration: null });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getById({ id: DECL_ID_3 });

		expect(result).toBeNull();
	});

	it("includes empty siblings array when no sibling declarations exist", async () => {
		const db = buildDb({ declaration: baseDeclaration, siblings: [] });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getById({ id: DECL_ID_1 });

		expect(result).not.toBeNull();
		expect(result?.siblings).toEqual([]);
	});

	it("includes siblings with correct status derivation for cancelled sibling", async () => {
		const cancelledAt = new Date("2026-04-01");
		const siblings = [
			{
				id: DECL_ID_2,
				status: "draft",
				cancelledAt,
				updatedAt: new Date("2026-04-01"),
			},
		];
		const db = buildDb({ declaration: baseDeclaration, siblings });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getById({ id: DECL_ID_1 });

		expect(result?.siblings).toHaveLength(1);
		expect(result?.siblings[0]?.id).toBe(DECL_ID_2);
		expect(result?.siblings[0]?.status).toBe("cancelled");
		expect(result?.siblings[0]?.cancelledAt).toEqual(cancelledAt);
	});

	it("includes siblings with original status for active sibling", async () => {
		const siblings = [
			{
				id: DECL_ID_2,
				status: "submitted",
				cancelledAt: null,
				updatedAt: new Date("2026-03-10"),
			},
		];
		const db = buildDb({ declaration: baseDeclaration, siblings });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getById({ id: DECL_ID_1 });

		expect(result?.siblings[0]?.status).toBe("submitted");
		expect(result?.siblings[0]?.cancelledAt).toBeNull();
	});
});
