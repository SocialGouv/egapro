import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CampaignDeadlines,
	DECLARATION_SUPERSEDED_MESSAGE,
	type SubmissionHistoryEvent,
} from "~/modules/domain";
import {
	declarationStatusHistory,
	declarations,
	jobCategories,
} from "~/server/db/schema";
import { deleteJobAndEmployeeCategories } from "../declarationHelpers";
import { createCaller } from "./helpers/declarationTestHelpers";
import { withLockMiddleware } from "./helpers/lockTestHelpers";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

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

const STEP1_INPUT = {
	totalWomen: 10,
	totalMen: 20,
	hourlyWomen: 10,
	hourlyMen: 20,
};

const STEP4_INPUT: Parameters<Caller["updateStep4"]>[0] = {
	annual: [
		{ threshold: "25000", women: 10, men: 12 },
		{ threshold: "35000", women: 8, men: 9 },
		{ threshold: "50000", women: 5, men: 6 },
		{},
	],
	hourly: [
		{ threshold: "15", women: 20, men: 22 },
		{ threshold: "20", women: 15, men: 18 },
		{ threshold: "30", women: 10, men: 11 },
		{},
	],
};

const CATEGORY_DATA = {
	womenCount: 10,
	menCount: 15,
	annualBaseWomen: "30000",
	annualVariableWomen: "2000",
	hourlyBaseWomen: "18",
	hourlyVariableWomen: "1.5",
	annualBaseMen: "32000",
	annualVariableMen: "2500",
	hourlyBaseMen: "19",
	hourlyVariableMen: "1.8",
};

const INITIAL_CATEGORIES_INPUT = {
	declarationType: "initial" as const,
	source: "dads",
	categories: [{ name: "Cadres", detail: "Senior", data: CATEGORY_DATA }],
};

const CORRECTION_CATEGORIES_INPUT = {
	declarationType: "correction" as const,
	source: "dads",
	categories: [
		{
			name: "Cadres",
			detail: "Senior",
			data: { ...CATEGORY_DATA, womenCount: 12, menCount: 18 },
		},
	],
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
};

const SECOND_DECLARATION_SUBMITTED: SubmissionHistoryEvent[] = [
	{ eventType: "submit", round: null },
	{ eventType: "path_choice", round: 1 },
	{ eventType: "second_declaration_submit", round: null },
];

function allDeadlines(at: Date): CampaignDeadlines {
	return {
		gipPublicationDate: at,
		campaignStartDate: at,
		decl1ModificationDeadline: at,
		decl1JustificationDeadline: at,
		decl1JointEvaluationDeadline: at,
		decl2ModificationDeadline: at,
		decl2JustificationDeadline: at,
		decl2JointEvaluationDeadline: at,
		decl2CseOpinionDeadline: at,
		pathChoiceDeadline: at,
		pathChoiceRound1Deadline: at,
	};
}

const LONG_PAST = new Date(2000, 0, 1);
const FAR_FUTURE = new Date(2100, 0, 1);

function thenableRows(rows: unknown[]) {
	return Object.assign(Promise.resolve(rows), {
		limit: vi.fn().mockResolvedValue(rows),
	});
}

// The step handlers only need the existing row; its totals echo STEP1_INPUT so
// `hasChanged` stays false unless a test passes different totals.
function createStepDb() {
	const existingRow = {
		id: "decl-1",
		currentStep: 1,
		...STEP1_INPUT,
	};
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn().mockReturnValue({ where: updateWhere });
	const update = vi.fn().mockReturnValue({ set });
	const txDelete = vi.fn();
	const transaction = vi
		.fn()
		.mockImplementation(async (fn: (tx: unknown) => unknown) => {
			const select = vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableRows([existingRow])),
				}),
			});
			const values = vi.fn().mockResolvedValue(undefined);
			const insert = vi.fn().mockReturnValue({ values });
			return fn({ select, update, insert, delete: txDelete });
		});
	return { db: { update, transaction } as unknown, set, transaction };
}

function createCategoriesDb(options: {
	status: string;
	historyEvents: SubmissionHistoryEvent[];
}) {
	const declaration = { id: "decl-1", status: options.status, currentStep: 4 };
	const existingJobs = [{ id: "job-1", categoryIndex: 0, name: "Cadres" }];
	const rowsByTable = new Map<unknown, unknown[]>([
		[declarations, [declaration]],
		[declarationStatusHistory, options.historyEvents],
		[jobCategories, existingJobs],
	]);

	const select = vi.fn().mockReturnValue({
		from: vi.fn().mockImplementation((table: unknown) => ({
			where: vi
				.fn()
				.mockReturnValue(thenableRows(rowsByTable.get(table) ?? [])),
		})),
	});
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn().mockReturnValue({ where: updateWhere });
	const update = vi.fn().mockReturnValue({ set });
	const deleteWhere = vi.fn().mockResolvedValue(undefined);
	const txDelete = vi.fn().mockReturnValue({ where: deleteWhere });
	const returning = vi.fn().mockResolvedValue([{ id: "job-new" }]);
	const values = vi
		.fn()
		.mockImplementation(() =>
			Object.assign(Promise.resolve(undefined), { returning }),
		);
	const insert = vi.fn().mockReturnValue({ values });
	const transaction = vi
		.fn()
		.mockImplementation(async (fn: (tx: unknown) => unknown) =>
			fn({ select, update, insert, delete: txDelete }),
		);

	return {
		db: { transaction } as unknown,
		set,
		insert,
		update,
		txDelete,
	};
}

async function stepCaller(historyEvents: SubmissionHistoryEvent[] = []) {
	const ctx = createStepDb();
	const caller = await createCaller(
		withLockMiddleware(ctx.db, { subsequentEvents: historyEvents }),
	);
	return { caller, ...ctx };
}

async function categoriesCaller(options: {
	status: string;
	historyEvents: SubmissionHistoryEvent[];
}) {
	const ctx = createCategoriesDb(options);
	const caller = await createCaller(withLockMiddleware(ctx.db));
	return { caller, ...ctx };
}

const SUPERSEDED = {
	code: "FORBIDDEN",
	message: DECLARATION_SUPERSEDED_MESSAGE,
};

describe("declarationModifiableWriteProcedure — only the latest submission is modifiable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetCampaignDeadlines.mockResolvedValue(allDeadlines(LONG_PAST));
	});

	afterEach(() => {
		expect(mockGetCampaignDeadlines).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});

	it("lets a submitted first declaration with nothing downstream be modified, every deadline being past", async () => {
		const { caller, set } = await stepCaller([
			{ eventType: "submit", round: null },
		]);

		await expect(caller.updateStep1(STEP1_INPUT)).resolves.toEqual({
			success: true,
		});
		expect(set).toHaveBeenCalled();
	});

	it("saves step 2 of the second declaration in corrective_actions_chosen, every deadline being past", async () => {
		const { caller, set } = await categoriesCaller({
			status: "corrective_actions_chosen",
			historyEvents: [
				{ eventType: "submit", round: null },
				{ eventType: "path_choice", round: 1 },
			],
		});

		await expect(
			caller.updateEmployeeCategories(CORRECTION_CATEGORIES_INPUT),
		).resolves.toEqual({ success: true });
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ secondDeclarationStep: 2 }),
		);
	});

	describe("once a second declaration was submitted, deadlines far ahead", () => {
		beforeEach(() => {
			mockGetCampaignDeadlines.mockResolvedValue(allDeadlines(FAR_FUTURE));
		});

		it.each([
			["updateStep1", (c: Caller) => c.updateStep1(STEP1_INPUT)],
			["updateStep2", (c: Caller) => c.updateStep2({})],
			["updateStep3", (c: Caller) => c.updateStep3({})],
			["updateStep4", (c: Caller) => c.updateStep4(STEP4_INPUT)],
			["submit", (c: Caller) => c.submit()],
		] as const)("rejects %s", async (_name, call) => {
			const { caller, transaction } = await stepCaller(
				SECOND_DECLARATION_SUBMITTED,
			);

			await expect(call(caller)).rejects.toMatchObject(SUPERSEDED);
			expect(transaction).not.toHaveBeenCalled();
		});

		it("rejects an initial employee-categories write", async () => {
			const { caller } = await categoriesCaller({
				status: "awaiting_revision_choice",
				historyEvents: SECOND_DECLARATION_SUBMITTED,
			});

			await expect(
				caller.updateEmployeeCategories(INITIAL_CATEGORIES_INPUT),
			).rejects.toMatchObject(SUPERSEDED);
		});

		it("still accepts a correction employee-categories write in awaiting_revision_choice", async () => {
			const { caller, set } = await categoriesCaller({
				status: "awaiting_revision_choice",
				historyEvents: SECOND_DECLARATION_SUBMITTED,
			});

			await expect(
				caller.updateEmployeeCategories(CORRECTION_CATEGORIES_INPUT),
			).resolves.toEqual({ success: true });
			expect(set).toHaveBeenCalledWith(
				expect.objectContaining({ secondDeclarationStep: 2 }),
			);
		});
	});

	it.each<SubmissionHistoryEvent>([
		{ eventType: "joint_evaluation_submit", round: 1 },
		{ eventType: "cse_opinion_submit", round: null },
	])("rejects updateStep1 once a $eventType exists", async (event) => {
		const { caller, transaction } = await stepCaller([
			{ eventType: "submit", round: null },
			event,
		]);

		await expect(caller.updateStep1(STEP1_INPUT)).rejects.toMatchObject(
			SUPERSEDED,
		);
		expect(transaction).not.toHaveBeenCalled();
	});

	it("lets a first declaration closed without any downstream submission (demarche_completed) be modified", async () => {
		const { caller, set } = await stepCaller([
			{ eventType: "submit", round: null },
			{ eventType: "path_choice", round: 1 },
			{ eventType: "demarche_complete", round: null },
		]);

		await expect(caller.updateStep1(STEP1_INPUT)).resolves.toEqual({
			success: true,
		});
		expect(set).toHaveBeenCalled();
	});

	it("never erases categories once a second declaration was submitted", async () => {
		const step = await stepCaller(SECOND_DECLARATION_SUBMITTED);

		await expect(
			step.caller.updateStep1({ ...STEP1_INPUT, totalWomen: 99 }),
		).rejects.toMatchObject(SUPERSEDED);
		expect(step.transaction).not.toHaveBeenCalled();

		const categories = await categoriesCaller({
			status: "awaiting_revision_choice",
			historyEvents: SECOND_DECLARATION_SUBMITTED,
		});

		await expect(
			categories.caller.updateEmployeeCategories(INITIAL_CATEGORIES_INPUT),
		).rejects.toMatchObject(SUPERSEDED);
		expect(deleteJobAndEmployeeCategories).not.toHaveBeenCalled();
		expect(categories.txDelete).not.toHaveBeenCalled();
		expect(categories.insert).not.toHaveBeenCalled();
		expect(categories.update).not.toHaveBeenCalled();
	});

	it("rebuilds the categories on an initial write in corrective_actions_chosen, before any second declaration is submitted", async () => {
		const { caller, insert, set } = await categoriesCaller({
			status: "corrective_actions_chosen",
			historyEvents: [
				{ eventType: "submit", round: null },
				{ eventType: "path_choice", round: 1 },
			],
		});

		await expect(
			caller.updateEmployeeCategories(INITIAL_CATEGORIES_INPUT),
		).resolves.toEqual({ success: true });
		expect(deleteJobAndEmployeeCategories).toHaveBeenCalledWith(
			expect.anything(),
			"decl-1",
		);
		expect(insert).toHaveBeenCalledWith(jobCategories);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ currentStep: 5 }),
		);
	});
});

type Caller = Awaited<ReturnType<typeof createCaller>>;
