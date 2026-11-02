import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentYear } from "~/modules/domain";
import {
	cseOpinions,
	declarationStatusHistory,
	declarations,
	files,
} from "~/server/db/schema";
import type { FormalNoticeDeclaration } from "~/server/services/formalNoticeExposure";

const mocks = vi.hoisted(() => ({
	enqueueReceipt: vi.fn(),
	getActiveLock: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

vi.mock("~/modules/mail/server", () => ({
	enqueueReceipt: mocks.enqueueReceipt,
}));

vi.mock("~/server/services/declarationLockService", () => ({
	getActiveLock: mocks.getActiveLock,
}));

type GapOpinionRow = {
	declarationId: string;
	declarationNumber: number;
	opinion: string | null;
};
type FileRow = { id: string; fileName: string; uploadedAt: Date };

const SIRET = "33978727700015";
const SIREN = "339787277";
const EMAIL = "declarant@example.fr";

const REPORT: FileRow = {
	id: "file-1",
	fileName: "evaluation-mise-en-demeure.pdf",
	uploadedAt: new Date("2027-06-01T10:00:00Z"),
};

const UNFAVORABLE_GAP_OPINION: GapOpinionRow = {
	declarationId: "decl-1",
	declarationNumber: 1,
	opinion: "unfavorable",
};

function declarationRow(
	overrides: Partial<FormalNoticeDeclaration> = {},
): FormalNoticeDeclaration {
	return {
		id: "decl-1",
		status: "demarche_completed",
		cseRequired: true,
		rulesVersion: "2027.1",
		firstDeclarationPathChoice: "justify",
		secondDeclarationPathChoice: null,
		...overrides,
	};
}

type Scenario = {
	declaration?: FormalNoticeDeclaration;
	gapOpinions?: GapOpinionRow[];
	files?: FileRow[];
};

function createMockDb(scenario: Scenario = {}) {
	const {
		declaration = declarationRow(),
		gapOpinions = [UNFAVORABLE_GAP_OPINION],
		files: fileRows = [REPORT],
	} = scenario;

	const rowsFor = (table: unknown): unknown[] => {
		if (table === declarations) return [declaration];
		if (table === cseOpinions) return gapOpinions;
		if (table === files) return fileRows;
		throw new Error("unexpected table");
	};
	const select = vi.fn(() => ({
		from: (table: unknown) => ({
			where: () => {
				const result = Promise.resolve(rowsFor(table));
				return Object.assign(result, { limit: () => result });
			},
		}),
	}));

	const historyValues = vi.fn().mockResolvedValue(undefined);
	const insert = vi.fn(() => ({ values: historyValues }));
	const projectionWhere = vi.fn().mockResolvedValue(undefined);
	const projectionSet = vi.fn(() => ({ where: projectionWhere }));
	const update = vi.fn(() => ({ set: projectionSet }));
	const execute = vi.fn().mockResolvedValue(undefined);
	const transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
		fn({ select, insert, update, execute }),
	);

	return {
		db: { select, transaction } as unknown,
		insert,
		historyValues,
		update,
		projectionSet,
		transaction,
	};
}

function createCaller(
	db: unknown,
	options: {
		email?: string;
		impersonation?: { siren: string; name: string };
	} = {},
) {
	const { email, impersonation } = options;
	return import("../formalNotice").then(({ formalNoticeRouter }) =>
		formalNoticeRouter.createCaller({
			db,
			session: {
				user: {
					id: "user-1",
					email,
					siret: impersonation ? null : SIRET,
					isAdmin: impersonation !== undefined,
					adminMfaAt: impersonation ? Math.floor(Date.now() / 1000) : null,
					impersonation: impersonation ?? null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never),
	);
}

async function captureError(promise: Promise<unknown>): Promise<TRPCError> {
	try {
		await promise;
	} catch (error) {
		if (error instanceof TRPCError) return error;
		throw error;
	}
	throw new Error("expected the call to be refused");
}

describe("formalNoticeRouter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.enqueueReceipt.mockResolvedValue(undefined);
		mocks.getActiveLock.mockResolvedValue(null);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("get", () => {
		it("exposes the deposit and returns the existing report", async () => {
			const { db } = createMockDb();
			const caller = await createCaller(db);

			expect(await caller.get()).toEqual({
				available: true,
				existingFile: REPORT,
				declarationId: "decl-1",
				siren: SIREN,
				year: getCurrentYear(),
			});
		});

		it("is unavailable without report when the gap opinion is favorable", async () => {
			const { db } = createMockDb({
				gapOpinions: [{ ...UNFAVORABLE_GAP_OPINION, opinion: "favorable" }],
				files: [],
			});
			const caller = await createCaller(db);

			expect(await caller.get()).toEqual({
				available: false,
				existingFile: null,
				declarationId: "decl-1",
				siren: SIREN,
				year: getCurrentYear(),
			});
		});

		it("stays readable while an admin impersonates the company", async () => {
			const { db } = createMockDb();
			const caller = await createCaller(db, {
				impersonation: { siren: SIREN, name: "Société Démo" },
			});

			expect(await caller.get()).toEqual({
				available: true,
				existingFile: REPORT,
				declarationId: "decl-1",
				siren: SIREN,
				year: getCurrentYear(),
			});
		});
	});

	describe("submit", () => {
		it("allows submission when the current user owns the active lock", async () => {
			const { db, historyValues } = createMockDb();
			mocks.getActiveLock.mockResolvedValue({ userId: "user-1" });
			const caller = await createCaller(db, { email: EMAIL });

			expect(await caller.submit()).toEqual({ success: true });
			expect(mocks.getActiveLock).toHaveBeenCalledWith(
				expect.anything(),
				"decl-1",
			);
			expect(historyValues).toHaveBeenCalledTimes(1);
		});

		it("rejects another user's active lock before writing or sending a receipt", async () => {
			const { db, insert, update } = createMockDb();
			mocks.getActiveLock.mockResolvedValue({ userId: "user-2" });
			const caller = await createCaller(db, { email: EMAIL });

			const error = await captureError(caller.submit());

			expect(error.code).toBe("CONFLICT");
			expect(error.message).toBe(
				"Déclaration verrouillée par un autre utilisateur.",
			);
			expect(insert).not.toHaveBeenCalled();
			expect(update).not.toHaveBeenCalled();
			expect(mocks.enqueueReceipt).not.toHaveBeenCalled();
		});

		it("records the event, keeps the démarche closed and sends the receipt", async () => {
			const { db, insert, historyValues, update, projectionSet } =
				createMockDb();
			const caller = await createCaller(db, { email: EMAIL });

			expect(await caller.submit()).toEqual({ success: true });

			expect(insert).toHaveBeenCalledWith(declarationStatusHistory);
			expect(historyValues).toHaveBeenCalledWith([
				{
					declarationId: "decl-1",
					eventType: "formal_notice_joint_evaluation_submit",
					value: null,
					round: null,
					actorUserId: "user-1",
				},
			]);
			expect(update).toHaveBeenCalledWith(declarations);
			expect(projectionSet).toHaveBeenCalledWith({
				status: "demarche_completed",
				updatedAt: expect.any(Date),
			});
			expect(mocks.enqueueReceipt).toHaveBeenCalledWith({
				kind: "formalNoticeJointEvaluation",
				to: EMAIL,
				siren: SIREN,
				year: getCurrentYear(),
				userId: "user-1",
				isResend: false,
			});
		});

		it("accepts a company without CSE and no gap opinion", async () => {
			const { db, historyValues } = createMockDb({
				declaration: declarationRow({ cseRequired: false }),
				gapOpinions: [],
			});
			const caller = await createCaller(db, { email: EMAIL });

			expect(await caller.submit()).toEqual({ success: true });
			expect(historyValues).toHaveBeenCalledTimes(1);
		});

		it("records the event but sends no receipt when the session has no email", async () => {
			const { db, historyValues } = createMockDb();
			const caller = await createCaller(db);

			expect(await caller.submit()).toEqual({ success: true });
			expect(historyValues).toHaveBeenCalledTimes(1);
			expect(mocks.enqueueReceipt).not.toHaveBeenCalled();
		});

		it("refuses a démarche that is not exposed to the formal notice", async () => {
			const { db, insert, update } = createMockDb({
				gapOpinions: [{ ...UNFAVORABLE_GAP_OPINION, opinion: "favorable" }],
			});
			const caller = await createCaller(db, { email: EMAIL });

			const error = await captureError(caller.submit());

			expect(error.code).toBe("PRECONDITION_FAILED");
			expect(error.message).toBe(
				"Le rapport de l'évaluation conjointe suite à une mise en demeure ne peut pas être transmis pour cette démarche.",
			);
			expect(insert).not.toHaveBeenCalled();
			expect(update).not.toHaveBeenCalled();
			expect(mocks.enqueueReceipt).not.toHaveBeenCalled();
		});

		it("refuses a démarche that is not closed yet", async () => {
			const { db, insert } = createMockDb({
				declaration: declarationRow({ status: "awaiting_cse_opinion" }),
			});
			const caller = await createCaller(db, { email: EMAIL });

			const error = await captureError(caller.submit());

			expect(error.code).toBe("PRECONDITION_FAILED");
			expect(insert).not.toHaveBeenCalled();
		});

		it("refuses the submission until the report is deposited", async () => {
			const { db, insert, update } = createMockDb({ files: [] });
			const caller = await createCaller(db, { email: EMAIL });

			const error = await captureError(caller.submit());

			expect(error.code).toBe("PRECONDITION_FAILED");
			expect(error.message).toBe(
				"Le rapport de l'évaluation conjointe doit être déposé avant sa transmission.",
			);
			expect(insert).not.toHaveBeenCalled();
			expect(update).not.toHaveBeenCalled();
			expect(mocks.enqueueReceipt).not.toHaveBeenCalled();
		});

		it("refuses the submission while an admin impersonates the company", async () => {
			const { db, transaction } = createMockDb();
			const caller = await createCaller(db, {
				email: EMAIL,
				impersonation: { siren: SIREN, name: "Société Démo" },
			});

			await expect(caller.submit()).rejects.toThrow("Mode mimoquage");
			expect(transaction).not.toHaveBeenCalled();
			expect(mocks.enqueueReceipt).not.toHaveBeenCalled();
		});
	});
});
