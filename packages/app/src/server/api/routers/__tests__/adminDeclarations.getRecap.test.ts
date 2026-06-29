import { getTableName } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	declarationStatusHistory,
	declarations,
	employeeCategories,
	jobCategories,
} from "~/server/db/schema";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const DECL_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const MISSING_ID = "6ba7b899-9dad-11d1-80b4-00c04fd430c8";

const adminSession = {
	user: { id: "admin-1", email: "admin@example.fr", isAdmin: true },
	expires: "",
};

const baseDeclarationRow = {
	id: DECL_ID,
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
	step2GapForExistingIndicators: null,
	step2HasAllIndicators: null,
	step2IndicatorScores: null,
	step3GapForJobCategories: null,
	step3IndicatorScore: null,
	step4HasReferenceClassification: null,
	step4ReferenceClassificationSource: null,
};

type JoinedRow = {
	declaration: typeof baseDeclarationRow;
	companyName: string;
	companySiren: string;
	companyNafCode: string | null;
	companyAddress: string | null;
	companyWorkforce: number | null;
	declarantEmail: string;
	declarantFirstName: string | null;
	declarantLastName: string | null;
};

const baseJoinedRow: JoinedRow = {
	declaration: baseDeclarationRow,
	companyName: "ACME Corp",
	companySiren: "123456789",
	companyNafCode: "6201Z",
	companyAddress: "1 rue de Paris",
	companyWorkforce: 200,
	declarantEmail: "alice@example.fr",
	declarantFirstName: "Alice",
	declarantLastName: "Dupont",
};

function buildDb(options: {
	row: JoinedRow | null;
	hasSecondSubmit?: boolean;
	jobs?: Array<{ id: string; source: string | null }>;
	empCats?: Array<unknown>;
}) {
	const { row, hasSecondSubmit = false, jobs = [], empCats = [] } = options;

	const resultByTable: Record<string, unknown[]> = {
		[getTableName(declarations)]: row ? [row] : [],
		[getTableName(declarationStatusHistory)]: hasSecondSubmit
			? [{ id: "h1" }]
			: [],
		[getTableName(jobCategories)]: jobs,
		[getTableName(employeeCategories)]: empCats,
	};

	return {
		select: vi.fn().mockImplementation(() => {
			let result: unknown[] = [];
			const resolve = () => {
				const promise = Promise.resolve(result);
				return Object.assign(promise, {
					limit: vi.fn().mockImplementation(() => Promise.resolve(result)),
				});
			};
			const chain = {
				from: vi.fn().mockImplementation((table: unknown) => {
					result = resultByTable[getTableName(table as never)] ?? [];
					return chain;
				}),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockImplementation(resolve),
			};
			return chain;
		}),
	};
}

describe("adminDeclarationsRouter — getRecap", () => {
	beforeEach(() => vi.resetAllMocks());

	it("throws NOT_FOUND when declaration does not exist", async () => {
		const db = buildDb({ row: null });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		await expect(caller.getRecap({ id: MISSING_ID })).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("returns full recap shape for a submitted declaration without correction", async () => {
		const db = buildDb({ row: baseJoinedRow });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getRecap({ id: DECL_ID });

		expect(result.company).toEqual({
			name: "ACME Corp",
			siren: "123456789",
			nafCode: "6201Z",
			address: "1 rue de Paris",
			workforce: 200,
		});
		expect(result.declarationYear).toBe(2026);
		expect(result.referencePeriod).toBe("01/01/2026 - 31/12/2026");
		expect(result.declarantName).toBe("Alice Dupont");
		expect(result.declarantEmail).toBe("alice@example.fr");
		expect(result.isCorrection).toBe(false);
		expect(result.totalWomen).toBe(50);
		expect(result.totalMen).toBe(50);
		expect(result.step5Categories).toEqual([]);
		expect(result.step5Source).toBeNull();
	});

	it("flags isCorrection=true when a second_declaration_submit event exists", async () => {
		const db = buildDb({ row: baseJoinedRow, hasSecondSubmit: true });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getRecap({ id: DECL_ID });

		expect(result.isCorrection).toBe(true);
	});

	it("exposes step5Source from the first job category when jobs exist", async () => {
		const db = buildDb({
			row: baseJoinedRow,
			jobs: [{ id: "j1", source: "convention-collective" }],
			empCats: [],
		});
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getRecap({ id: DECL_ID });

		expect(result.step5Source).toBe("convention-collective");
	});

	it("returns empty declarantName when first and last names are both null", async () => {
		const row = {
			...baseJoinedRow,
			declarantFirstName: null,
			declarantLastName: null,
		};
		const db = buildDb({ row });
		const { adminDeclarationsRouter } = await import("../adminDeclarations");
		const caller = adminDeclarationsRouter.createCaller({
			db,
			session: adminSession,
			headers: new Headers(),
		} as never);

		const result = await caller.getRecap({ id: DECL_ID });

		expect(result.declarantName).toBe("");
	});
});
