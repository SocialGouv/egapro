import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CampaignDeadlines } from "~/modules/domain";
import { createCaller } from "./helpers/declarationTestHelpers";
import { withLockMiddleware } from "./helpers/lockTestHelpers";

// The deadline branch of `declarationModifiableWriteProcedure` selects the
// applicable modification deadline through `isSecondDeclarationDeadlineApplicable`
// (#3955). It only fires for submitted declarations, so these tests exercise
// `updateStep1` (a modifiable write) with a submitted guard status and a
// campaign whose decl1 deadline is passed but decl2 deadline is still open.
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

// The updateStep1 handler recomputes indicator percentages after the write; that
// is orthogonal to the deadline guard under test, so it is stubbed to a no-op.
vi.mock("../declarationHelpers", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("../declarationHelpers")>();
	return {
		...original,
		applyPercentagesAfterUpdate: vi.fn().mockResolvedValue(undefined),
		deleteJobAndEmployeeCategories: vi.fn().mockResolvedValue(undefined),
	};
});

const mockGetCampaignDeadlines = vi.fn();
vi.mock("~/server/db/getCampaignDeadlines", () => ({
	getCampaignDeadlines: (year: number) => mockGetCampaignDeadlines(year),
}));

const GUARD_YEAR = 2027;
const STEP1_INPUT = { totalWomen: 10, totalMen: 20 };

// decl1 a year in the past, decl2 a year in the future — relative to the real
// clock the guard reads via `isDeadlinePassed(new Date())`. So a phase-1
// declaration is blocked (decl1 passed) while a phase-2 one is allowed (decl2
// still open), isolating exactly which deadline the predicate selects.
function deadlines(
	overrides: Partial<CampaignDeadlines> = {},
): CampaignDeadlines {
	const now = new Date();
	const past = new Date(now.getFullYear() - 1, 5, 1);
	const future = new Date(now.getFullYear() + 1, 11, 1);
	return {
		gipPublicationDate: null,
		campaignStartDate: null,
		decl1ModificationDeadline: past,
		decl1JustificationDeadline: past,
		decl1JointEvaluationDeadline: past,
		decl2ModificationDeadline: future,
		decl2JustificationDeadline: future,
		decl2JointEvaluationDeadline: future,
		pathChoiceDeadline: past,
		...overrides,
	};
}

type GuardMockOverrides = {
	declarationStatus: string;
	secondDeclarationStep?: number | null;
	secondDeclarationPathChoice?:
		| "justify"
		| "corrective_action"
		| "joint_evaluation"
		| null;
};

// Handler-side db: after the guard passes, updateStep1 runs its transaction
// (select existing → update → applyPercentagesAfterUpdate select+update). The
// existing row echoes the input totals so `hasChanged` is false (no category
// reset) and carries currentStep 1 so the step-change history insert is skipped —
// this test only exercises the guard, not the handler internals.
function handlerDb() {
	const existingRow = {
		id: "decl-1",
		currentStep: 1,
		totalWomen: STEP1_INPUT.totalWomen,
		totalMen: STEP1_INPUT.totalMen,
	};
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn().mockReturnValue({ where: updateWhere });
	const update = vi.fn().mockReturnValue({ set });
	const transaction = vi
		.fn()
		.mockImplementation(async (fn: (tx: unknown) => unknown) => {
			const limit = vi.fn().mockResolvedValue([existingRow]);
			const where = vi.fn().mockReturnValue({ limit });
			const from = vi.fn().mockReturnValue({ where });
			const select = vi.fn().mockReturnValue({ from });
			const values = vi.fn().mockResolvedValue(undefined);
			const insert = vi.fn().mockReturnValue({ values });
			return fn({ select, update, insert, delete: vi.fn() });
		});
	return { db: { update, transaction } as unknown, set };
}

async function callUpdateStep1(guard: GuardMockOverrides) {
	const { db, set } = handlerDb();
	const caller = await createCaller(
		withLockMiddleware(db, {
			declarationStatus: guard.declarationStatus,
			declarationYear: GUARD_YEAR,
			secondDeclarationStep: guard.secondDeclarationStep ?? null,
			secondDeclarationPathChoice: guard.secondDeclarationPathChoice ?? null,
		}),
	);
	return { caller, set };
}

describe("declarationModifiableWriteProcedure — second-declaration deadline guard (#3955)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCampaignDeadlines.mockResolvedValue(deadlines());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("allows a write in awaiting_revision_choice while decl2 is open even though decl1 has passed", async () => {
		const { caller, set } = await callUpdateStep1({
			declarationStatus: "awaiting_revision_choice",
		});

		await expect(caller.updateStep1(STEP1_INPUT)).resolves.toBeDefined();
		expect(set).toHaveBeenCalled();
	});

	it("blocks a write in awaiting_revision_choice once decl2 itself has passed", async () => {
		const now = new Date();
		mockGetCampaignDeadlines.mockResolvedValue(
			deadlines({
				decl2ModificationDeadline: new Date(now.getFullYear() - 1, 11, 1),
			}),
		);
		const { caller } = await callUpdateStep1({
			declarationStatus: "awaiting_revision_choice",
		});

		await expect(caller.updateStep1(STEP1_INPUT)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("keeps allowing a write in corrective_actions_chosen (nominal second declaration) against decl2", async () => {
		const { caller, set } = await callUpdateStep1({
			declarationStatus: "corrective_actions_chosen",
		});

		await expect(caller.updateStep1(STEP1_INPUT)).resolves.toBeDefined();
		expect(set).toHaveBeenCalled();
	});

	it("blocks a first-declaration write (awaiting_compliance_path_choice) once decl1 has passed", async () => {
		const { caller } = await callUpdateStep1({
			declarationStatus: "awaiting_compliance_path_choice",
		});

		await expect(caller.updateStep1(STEP1_INPUT)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("selects decl1 for a terminal status reached in round 1 (no second declaration started), blocking after decl1", async () => {
		const { caller } = await callUpdateStep1({
			declarationStatus: "demarche_completed",
			secondDeclarationStep: null,
			secondDeclarationPathChoice: null,
		});

		await expect(caller.updateStep1(STEP1_INPUT)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("selects decl2 for a terminal status once a second declaration was started, allowing while decl2 is open", async () => {
		const { caller, set } = await callUpdateStep1({
			declarationStatus: "demarche_completed",
			secondDeclarationStep: 3,
		});

		await expect(caller.updateStep1(STEP1_INPUT)).resolves.toBeDefined();
		expect(set).toHaveBeenCalled();
	});
});
