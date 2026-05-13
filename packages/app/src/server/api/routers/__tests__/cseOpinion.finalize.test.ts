import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: {
		id: "id",
		siren: "siren",
		year: "year",
		cseOpinionCompletedAt: "cseOpinionCompletedAt",
		updatedAt: "updatedAt",
	},
	cseOpinions: {
		id: "id",
		declarationId: "declarationId",
	},
	files: {
		id: "id",
		declarationId: "declarationId",
		type: "type",
	},
}));

vi.mock("~/server/services/s3", () => ({
	deleteFile: vi.fn(),
}));

const mockWhere = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();

let selectCallCount = 0;

function createMockDbForFinalize(opinionCount: number, fileCount: number) {
	selectCallCount = 0;

	const declarationResult = [{ id: "decl-1" }];
	const queue: unknown[][] = [
		[{ count: opinionCount }],
		[{ count: fileCount }],
	];

	mockLimit.mockImplementation(() =>
		Promise.resolve(selectCallCount <= 1 ? declarationResult : []),
	);
	mockWhere.mockImplementation(() => {
		if (selectCallCount <= 1) {
			return Object.assign(Promise.resolve(declarationResult), {
				limit: mockLimit,
			});
		}
		const result = queue.shift() ?? [];
		return Object.assign(Promise.resolve(result), { limit: mockLimit });
	});
	mockFrom.mockReturnValue({ where: mockWhere });
	mockSelect.mockImplementation(() => {
		selectCallCount++;
		return { from: mockFrom };
	});

	mockUpdateReturning.mockResolvedValue([{ siren: "339787277", year: 2025 }]);
	mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
	mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
	mockUpdate.mockReturnValue({ set: mockUpdateSet });

	return {
		select: mockSelect,
		update: mockUpdate,
	} as unknown;
}

function createCaller(
	mockDb: unknown,
	siret: string | null = "33978727700015",
	impersonation: { siren: string; name: string } | null = null,
) {
	return import("../cseOpinion").then(({ cseOpinionRouter }) =>
		cseOpinionRouter.createCaller({
			db: mockDb,
			session: {
				user: {
					id: "user-1",
					siret,
					isAdmin: impersonation !== null,
					impersonation,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never),
	);
}

describe("cseOpinionRouter.finalize", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sets cseOpinionCompletedAt when opinions and at least one file exist", async () => {
		const mockDb = createMockDbForFinalize(2, 1);
		const caller = await createCaller(mockDb);

		const result = await caller.finalize();

		expect(result).toEqual({ success: true });
		expect(mockUpdate).toHaveBeenCalled();
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				cseOpinionCompletedAt: expect.any(Date),
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("throws PRECONDITION_FAILED when no opinions exist", async () => {
		const mockDb = createMockDbForFinalize(0, 1);
		const caller = await createCaller(mockDb);

		await expect(caller.finalize()).rejects.toThrow(
			"Les avis du CSE doivent être renseignés avant validation.",
		);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("throws PRECONDITION_FAILED when no file has been uploaded", async () => {
		const mockDb = createMockDbForFinalize(2, 0);
		const caller = await createCaller(mockDb);

		await expect(caller.finalize()).rejects.toThrow(
			"Au moins un fichier d'avis CSE doit être transmis.",
		);
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("refuses to finalize when the admin is impersonating", async () => {
		const mockDb = createMockDbForFinalize(2, 1);
		const caller = await createCaller(mockDb, null, {
			siren: "339787277",
			name: "Acme",
		});

		await expect(caller.finalize()).rejects.toThrow("Mode mimoquage");
		expect(mockUpdate).not.toHaveBeenCalled();
	});
});
