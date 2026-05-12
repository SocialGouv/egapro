import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/services/s3", () => ({
	deleteFile: vi.fn(),
}));

function createMockDbForFinalize(
	opinionCount: number,
	fileCount: number,
	declaration: Record<string, unknown> | null = {
		id: "decl-1",
		status: "awaiting_cse_opinion",
		rulesVersion: "2027.1",
	},
) {
	const declarationLookupRow = { id: "decl-1" };

	let selectCallCount = 0;
	const limit = vi.fn();
	const where = vi.fn();
	const from = vi.fn();
	const select = vi.fn();

	limit.mockImplementation(() => {
		const call = selectCallCount;
		if (call === 1) return Promise.resolve([declarationLookupRow]);
		if (call === 4) {
			return Promise.resolve(declaration ? [declaration] : []);
		}
		return Promise.resolve([]);
	});

	where.mockImplementation(() => {
		const call = selectCallCount;
		if (call === 2) {
			return Object.assign(Promise.resolve([{ count: opinionCount }]), {
				limit,
			});
		}
		if (call === 3) {
			return Object.assign(Promise.resolve([{ count: fileCount }]), {
				limit,
			});
		}
		return Object.assign(Promise.resolve([declarationLookupRow]), { limit });
	});

	from.mockReturnValue({ where });
	select.mockImplementation(() => {
		selectCallCount++;
		return { from };
	});

	const updateWhere = vi.fn().mockResolvedValue(undefined);
	const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
	const update = vi.fn().mockReturnValue({ set: updateSet });

	return {
		db: {
			select,
			update,
		} as unknown,
		updateSet,
		update,
	};
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

	it("transitions awaiting_cse_opinion → demarche_completed and sets both timestamps", async () => {
		const ctx = createMockDbForFinalize(2, 1);
		const caller = await createCaller(ctx.db);

		const result = await caller.finalize();

		expect(result).toEqual({ success: true });
		expect(ctx.update).toHaveBeenCalled();
		expect(ctx.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "demarche_completed",
				cseOpinionCompletedAt: expect.any(Date),
				demarcheCompletedAt: expect.any(Date),
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("throws PRECONDITION_FAILED when no opinions exist", async () => {
		const ctx = createMockDbForFinalize(0, 1);
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow(
			"Les avis du CSE doivent être renseignés avant validation.",
		);
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("throws PRECONDITION_FAILED when no file has been uploaded", async () => {
		const ctx = createMockDbForFinalize(2, 0);
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow(
			"Au moins un fichier d'avis CSE doit être transmis.",
		);
		expect(ctx.update).not.toHaveBeenCalled();
	});

	it("throws NOT_FOUND when declaration row vanished between lookup and finalize", async () => {
		const ctx = createMockDbForFinalize(2, 1, null);
		const caller = await createCaller(ctx.db);

		await expect(caller.finalize()).rejects.toThrow("Déclaration introuvable");
	});

	it("refuses to finalize when the admin is impersonating", async () => {
		const ctx = createMockDbForFinalize(2, 1);
		const caller = await createCaller(ctx.db, null, {
			siren: "339787277",
			name: "Acme",
		});

		await expect(caller.finalize()).rejects.toThrow("Mode mimoquage");
		expect(ctx.update).not.toHaveBeenCalled();
	});
});
