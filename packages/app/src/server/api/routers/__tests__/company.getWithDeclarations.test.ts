import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getRepresentationWorkforceHistoryMock } = vi.hoisted(() => ({
	getRepresentationWorkforceHistoryMock: vi.fn(),
}));

vi.mock("~/server/services/suit");
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/getRepresentationWorkforceHistory", () => ({
	getRepresentationWorkforceHistory: getRepresentationWorkforceHistoryMock,
}));

function makeCompanyRow() {
	return {
		siren: "339787277",
		name: "Test Company",
		address: "1 rue de Paris",
		nafCode: "6202A",
		workforceEma: "100.00",
		hasCse: true,
	};
}

function makeSelectMock(declRows: unknown[]) {
	let selectCallCount = 0;
	return vi.fn().mockImplementation(() => {
		selectCallCount++;
		if (selectCallCount === 1) {
			return {
				from: vi.fn().mockReturnValue({
					leftJoin: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([makeCompanyRow()]),
							}),
						}),
					}),
				}),
			};
		}
		if (selectCallCount === 2) {
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockResolvedValue(declRows),
					}),
				}),
			};
		}
		if (selectCallCount === 4) {
			return {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			};
		}
		return {
			from: vi.fn().mockReturnValue({
				innerJoin: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([]),
				}),
			}),
		};
	});
}

async function makeCaller(declRows: unknown[]) {
	const mockDb = { select: makeSelectMock(declRows) } as unknown;
	const { companyRouter } = await import("../company");
	return companyRouter.createCaller({
		db: mockDb,
		session: { user: { id: "user-1" }, expires: "" },
		headers: new Headers(),
	} as never);
}

function makeDeclRow(year: number) {
	return {
		siren: "339787277",
		year,
		status: "submitted",
		currentStep: 6,
		updatedAt: new Date(),
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		secondDeclarationSubmittedAt: null,
		demarcheCompletedAt: null,
		cseOpinionCompletedAt: null,
	};
}

describe("companyRouter.getWithDeclarations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		getRepresentationWorkforceHistoryMock.mockResolvedValue([]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns company with declaration list", async () => {
		const caller = await makeCaller([makeDeclRow(2026)]);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		expect(result.company.siren).toBe("339787277");
		expect(result.declarations).toBeDefined();
	});

	it("excludes cancelled declarations from the timeline", async () => {
		const caller = await makeCaller([makeDeclRow(2026)]);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		const remunerationDecls = result.declarations.filter(
			(d) => d.type === "remuneration",
		);
		expect(remunerationDecls).toHaveLength(1);
	});

	it("offers the representation démarche when the whole window reaches the threshold", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue([
			{ year: 2026, workforceEma: 1200 },
			{ year: 2025, workforceEma: 1050 },
			{ year: 2024, workforceEma: 1400 },
		]);
		const caller = await makeCaller([]);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			true,
		);
	});

	it("hides the representation démarche when a year of the window is below the threshold", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue([
			{ year: 2026, workforceEma: 1200 },
			{ year: 2025, workforceEma: 940 },
			{ year: 2024, workforceEma: 1400 },
		]);
		const caller = await makeCaller([]);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			false,
		);
		expect(result.declarations.some((d) => d.type === "remuneration")).toBe(
			true,
		);
	});

	it("offers the representation démarche when no workforce is known", async () => {
		getRepresentationWorkforceHistoryMock.mockResolvedValue([]);
		const caller = await makeCaller([]);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		expect(result.declarations.some((d) => d.type === "representation")).toBe(
			true,
		);
	});
});
