import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: {
		siren: "siren",
		year: "year",
		draft: "draft",
		draftUpdatedAt: "draftUpdatedAt",
		cancelledAt: "cancelledAt",
		declarantId: "declarantId",
	},
	userCompanies: {
		siren: "siren",
		userId: "userId",
	},
}));

const mockLogAction = vi.fn();
vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

const mockGetDefaultCampaignDeadlines = vi.fn();
vi.mock("~/modules/domain", async (importOriginal) => {
	const original = await importOriginal<typeof import("~/modules/domain")>();
	return {
		...original,
		getDefaultCampaignDeadlines: (...args: unknown[]) =>
			mockGetDefaultCampaignDeadlines(...args),
	};
});

const SIREN = "123456789";
const YEAR = 2024;
const USER_SIRET = "12345678900015";
const FORBIDDEN_MSG = "Accès refusé à ce SIREN.";

type SelectResponse = unknown[];

function createMockDb(responses: SelectResponse[] = []) {
	let limitCallIndex = 0;

	const mockLimit = vi.fn().mockImplementation(() => {
		const result = responses[limitCallIndex] ?? [];
		limitCallIndex++;
		return Promise.resolve(result);
	});

	const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

	const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
	const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
	const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

	const mockValues = vi.fn().mockResolvedValue(undefined);
	const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

	return {
		db: {
			select: mockSelect,
			update: mockUpdate,
			insert: mockInsert,
		} as unknown,
		mocks: {
			select: mockSelect,
			update: mockUpdate,
			insert: mockInsert,
			set: mockSet,
			values: mockValues,
			updateWhere: mockUpdateWhere,
		},
	};
}

function createCaller(
	mockDb: unknown,
	siret: string | null = USER_SIRET,
	impersonation: { siren: string; name: string } | null = null,
) {
	return import("~/server/api/routers/declarationDraft").then(
		({ declarationDraftRouter }) =>
			declarationDraftRouter.createCaller({
				db: mockDb,
				session: {
					user: {
						id: "user-1",
						email: "user@example.com",
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

function futureDeadline() {
	return {
		decl1ModificationDeadline: new Date(Date.now() + 365 * 24 * 3600 * 1000),
	};
}

function pastDeadline() {
	return { decl1ModificationDeadline: new Date(Date.now() - 1000) };
}

describe("declarationDraftRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetDefaultCampaignDeadlines.mockReturnValue(futureDeadline());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("get", () => {
		it("returns null when no declaration row exists", async () => {
			const { db } = createMockDb([[{ siren: SIREN }], []]);
			const caller = await createCaller(db);

			const result = await caller.get({ siren: SIREN, year: YEAR });

			expect(result).toBeNull();
		});

		it("returns null when draft column is null", async () => {
			const { db } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: null, draftUpdatedAt: new Date() }],
			]);
			const caller = await createCaller(db);

			const result = await caller.get({ siren: SIREN, year: YEAR });

			expect(result).toBeNull();
		});

		it("returns the draft when valid and not expired", async () => {
			const draftData = { main: { step1: { workforce: 50 } } };
			const { db } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: draftData, draftUpdatedAt: new Date() }],
			]);
			const caller = await createCaller(db);

			const result = await caller.get({ siren: SIREN, year: YEAR });

			expect(result).toEqual(draftData);
		});

		it("returns null when draft is older than 30 days (TTL expired)", async () => {
			const draftData = { main: { step1: { workforce: 50 } } };
			const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 3600 * 1000);
			const { db } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: draftData, draftUpdatedAt: thirtyOneDaysAgo }],
			]);
			const caller = await createCaller(db);

			const result = await caller.get({ siren: SIREN, year: YEAR });

			expect(result).toBeNull();
		});

		it("returns null when decl1ModificationDeadline has passed", async () => {
			mockGetDefaultCampaignDeadlines.mockReturnValue(pastDeadline());

			const draftData = { main: { step1: { workforce: 50 } } };
			const { db } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: draftData, draftUpdatedAt: new Date() }],
			]);
			const caller = await createCaller(db);

			const result = await caller.get({ siren: SIREN, year: YEAR });

			expect(result).toBeNull();
		});

		it("throws FORBIDDEN when user does not own the siren", async () => {
			const { db } = createMockDb([[]]);
			const caller = await createCaller(db);

			await expect(caller.get({ siren: SIREN, year: YEAR })).rejects.toThrow(
				FORBIDDEN_MSG,
			);
		});

		it("returns null without DB call when admin is impersonating", async () => {
			const { db, mocks } = createMockDb();
			const impersonation = { siren: SIREN, name: "Acme" };
			const caller = await createCaller(db, null, impersonation);

			const result = await caller.get({ siren: SIREN, year: YEAR });

			expect(result).toBeNull();
			expect(mocks.select).not.toHaveBeenCalled();
		});
	});

	describe("save", () => {
		it("inserts a new row when no declaration exists", async () => {
			const { db, mocks } = createMockDb([[{ siren: SIREN }], []]);
			const caller = await createCaller(db);

			const result = await caller.save({
				siren: SIREN,
				year: YEAR,
				slice: { kind: "main", step: "step1", data: { workforce: 50 } },
			});

			expect(result).toEqual({ ok: true });
			expect(mocks.insert).toHaveBeenCalled();
			expect(mocks.update).not.toHaveBeenCalled();
		});

		it("updates the existing row when a declaration exists", async () => {
			const existingDraft = { main: { step1: { workforce: 40 } } };
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			const result = await caller.save({
				siren: SIREN,
				year: YEAR,
				slice: { kind: "main", step: "step1", data: { workforce: 50 } },
			});

			expect(result).toEqual({ ok: true });
			expect(mocks.update).toHaveBeenCalled();
			expect(mocks.insert).not.toHaveBeenCalled();
		});

		it("merges new slice without overwriting existing slices", async () => {
			const existingDraft = { main: { step1: { workforce: 50 } } };
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			await caller.save({
				siren: SIREN,
				year: YEAR,
				slice: { kind: "second", step: "form", data: { foo: "bar" } },
			});

			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({
					draft: {
						main: { step1: { workforce: 50 } },
						second: { form: { foo: "bar" } },
					},
				}),
			);
		});

		it("throws FORBIDDEN when user does not own the siren", async () => {
			const { db } = createMockDb([[]]);
			const caller = await createCaller(db);

			await expect(
				caller.save({
					siren: SIREN,
					year: YEAR,
					slice: { kind: "main", step: "step1", data: {} },
				}),
			).rejects.toThrow(FORBIDDEN_MSG);
		});

		it("returns ok without DB mutation when admin is impersonating", async () => {
			const { db, mocks } = createMockDb();
			const impersonation = { siren: SIREN, name: "Acme" };
			const caller = await createCaller(db, null, impersonation);

			const result = await caller.save({
				siren: SIREN,
				year: YEAR,
				slice: { kind: "main", step: "step1", data: { workforce: 50 } },
			});

			expect(result).toEqual({ ok: true });
			expect(mocks.update).not.toHaveBeenCalled();
			expect(mocks.insert).not.toHaveBeenCalled();
		});

		it("emits DRAFT_SAVE audit log without slice data payload", async () => {
			const { auditMiddleware } = await import("~/server/audit/trpcMiddleware");

			const input = {
				siren: SIREN,
				year: YEAR,
				slice: { kind: "main", step: "step1", data: { workforce: 50 } },
			};

			await auditMiddleware({
				ctx: {
					session: {
						user: { id: "user-1", email: "u@e.fr", siret: USER_SIRET },
					},
					headers: new Headers(),
				},
				path: "declarationDraft.save",
				getRawInput: async () => input,
				next: async () => ({ ok: true as const }),
			} as never);

			expect(mockLogAction).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "declaration_draft.save",
					status: "success",
				}),
			);

			const callArg = mockLogAction.mock.calls[0]?.[0] as Record<
				string,
				unknown
			>;
			const metadata = callArg?.metadata as Record<string, unknown> | undefined;
			const slice = metadata?.slice as Record<string, unknown> | undefined;
			expect(slice).not.toHaveProperty("data");
		});
	});

	describe("clear", () => {
		it("sets draft and draftUpdatedAt to null when no kind is given", async () => {
			const { db, mocks } = createMockDb([[{ siren: SIREN }]]);
			const caller = await createCaller(db);

			const result = await caller.clear({ siren: SIREN, year: YEAR });

			expect(result).toEqual({ ok: true });
			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({ draft: null, draftUpdatedAt: null }),
			);
		});

		it("drops only the specified kind slice while preserving others", async () => {
			const existingDraft = {
				main: { step1: { workforce: 50 } },
				cse: { opinions: { opinion: "favorable" } },
			};
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			const result = await caller.clear({
				siren: SIREN,
				year: YEAR,
				kind: "main",
			});

			expect(result).toEqual({ ok: true });
			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({
					draft: { cse: { opinions: { opinion: "favorable" } } },
				}),
			);
		});

		it("sets draft to null when clearing the last remaining slice", async () => {
			const existingDraft = { main: { step1: { workforce: 50 } } };
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			await caller.clear({ siren: SIREN, year: YEAR, kind: "main" });

			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({ draft: null, draftUpdatedAt: null }),
			);
		});

		it("returns ok early when partial clear finds no existing draft", async () => {
			const { db, mocks } = createMockDb([[{ siren: SIREN }], []]);
			const caller = await createCaller(db);

			const result = await caller.clear({
				siren: SIREN,
				year: YEAR,
				kind: "main",
			});

			expect(result).toEqual({ ok: true });
			expect(mocks.update).not.toHaveBeenCalled();
		});

		it("throws FORBIDDEN when user does not own the siren", async () => {
			const { db } = createMockDb([[]]);
			const caller = await createCaller(db);

			await expect(caller.clear({ siren: SIREN, year: YEAR })).rejects.toThrow(
				FORBIDDEN_MSG,
			);
		});

		it("returns ok without DB mutation when admin is impersonating", async () => {
			const { db, mocks } = createMockDb();
			const impersonation = { siren: SIREN, name: "Acme" };
			const caller = await createCaller(db, null, impersonation);

			const result = await caller.clear({ siren: SIREN, year: YEAR });

			expect(result).toEqual({ ok: true });
			expect(mocks.update).not.toHaveBeenCalled();
		});

		it("drops only the specified step while preserving other steps in the same kind", async () => {
			const existingDraft = {
				main: { "1": { totalWomen: 50 }, "2": { payGap: 3.5 } },
			};
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			const result = await caller.clear({
				siren: SIREN,
				year: YEAR,
				kind: "main",
				step: "1",
			});

			expect(result).toEqual({ ok: true });
			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({
					draft: { main: { "2": { payGap: 3.5 } } },
				}),
			);
		});

		it("removes the kind bucket when clearing its last step", async () => {
			const existingDraft = {
				main: { "1": { totalWomen: 50 } },
				cse: { opinions: { opinion: "favorable" } },
			};
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			await caller.clear({
				siren: SIREN,
				year: YEAR,
				kind: "main",
				step: "1",
			});

			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({
					draft: { cse: { opinions: { opinion: "favorable" } } },
				}),
			);
		});

		it("sets draft to null when clearing the last step of the last kind", async () => {
			const existingDraft = { main: { "1": { totalWomen: 50 } } };
			const { db, mocks } = createMockDb([
				[{ siren: SIREN }],
				[{ draft: existingDraft }],
			]);
			const caller = await createCaller(db);

			await caller.clear({
				siren: SIREN,
				year: YEAR,
				kind: "main",
				step: "1",
			});

			expect(mocks.set).toHaveBeenCalledWith(
				expect.objectContaining({ draft: null, draftUpdatedAt: null }),
			);
		});
	});
});
