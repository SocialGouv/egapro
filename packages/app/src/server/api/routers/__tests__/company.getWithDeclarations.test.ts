import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/services/suit");
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

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

describe("companyRouter.getWithDeclarations", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns company with declaration list", async () => {
		const declRows = [
			{
				siren: "339787277",
				year: 2026,
				status: "submitted",
				currentStep: 6,
				updatedAt: new Date(),
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				secondDeclarationSubmittedAt: null,
				demarcheCompletedAt: null,
				cseOpinionCompletedAt: null,
			},
		];

		const mockDb = { select: makeSelectMock(declRows) } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		expect(result.company.siren).toBe("339787277");
		expect(result.declarations).toBeDefined();
	});

	it("excludes cancelled declarations from the timeline", async () => {
		const activeDeclRows = [
			{
				siren: "339787277",
				year: 2026,
				status: "submitted",
				currentStep: 6,
				updatedAt: new Date(),
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				secondDeclarationSubmittedAt: null,
				demarcheCompletedAt: null,
				cseOpinionCompletedAt: null,
			},
		];

		const mockDb = { select: makeSelectMock(activeDeclRows) } as unknown;

		const { companyRouter } = await import("../company");
		const caller = companyRouter.createCaller({
			db: mockDb,
			session: { user: { id: "user-1" }, expires: "" },
			headers: new Headers(),
		} as never);

		const result = await caller.getWithDeclarations({ siren: "339787277" });

		const remunerationDecls = result.declarations.filter(
			(d) => d.type === "remuneration",
		);
		expect(remunerationDecls).toHaveLength(1);
	});
});
