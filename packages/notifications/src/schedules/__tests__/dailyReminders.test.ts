import { beforeEach, describe, expect, it, vi } from "vitest";

import { civilDateBefore, getDefaultReminderDeadlines } from "../../dates.js";

const { mocks } = vi.hoisted(() => ({
	mocks: {
		ensureDedupTable: vi.fn(),
		getCampaignDeadlines: vi.fn(),
		findDraftDeclarations: vi.fn(),
		findAwaitingCompliancePathChoiceFirstRound: vi.fn(),
		findAwaitingCompliancePathChoiceSecondRound: vi.fn(),
		findCorrectiveSecondDeclarationPending: vi.fn(),
		findJointEvaluationPendingFirstRound: vi.fn(),
		findJointEvaluationPendingSecondRound: vi.fn(),
		findCseOpinionPending: vi.fn(),
		findCompletedPreviousCycle: vi.fn(),
		findOpenCycleRecipients: vi.fn(),
		dispatchReminder: vi.fn(),
	},
}));

vi.mock("../../eligibility/index.js", () => ({
	ensureDedupTable: mocks.ensureDedupTable,
	getCampaignDeadlines: mocks.getCampaignDeadlines,
	findDraftDeclarations: mocks.findDraftDeclarations,
	findAwaitingCompliancePathChoiceFirstRound:
		mocks.findAwaitingCompliancePathChoiceFirstRound,
	findAwaitingCompliancePathChoiceSecondRound:
		mocks.findAwaitingCompliancePathChoiceSecondRound,
	findCorrectiveSecondDeclarationPending:
		mocks.findCorrectiveSecondDeclarationPending,
	findJointEvaluationPendingFirstRound:
		mocks.findJointEvaluationPendingFirstRound,
	findJointEvaluationPendingSecondRound:
		mocks.findJointEvaluationPendingSecondRound,
	findCseOpinionPending: mocks.findCseOpinionPending,
	findCompletedPreviousCycle: mocks.findCompletedPreviousCycle,
	findOpenCycleRecipients: mocks.findOpenCycleRecipients,
}));

vi.mock("../dispatch.js", () => ({ dispatchReminder: mocks.dispatchReminder }));

import { handleDailyDeadlineReminders } from "../handlers.js";

const RECIPIENT = {
	siren: "552100554",
	year: 2027,
	email: "user@example.fr",
	userId: "user-1",
};

const fakeSql = {} as never;

// Resolve the payload that `handleDailyDeadlineReminders` handed to
// `dispatchReminder` for a given notification type (+ optional variant, when a
// single type is dispatched with several variants the same day).
function dispatchFor(type: string, variant?: string) {
	const call = mocks.dispatchReminder.mock.calls.find(
		([params]) =>
			params.type === type &&
			(variant === undefined || params.variant === variant),
	);
	if (!call) throw new Error(`no dispatch for ${type} ${variant ?? ""}`);
	const params = call[0];
	return { params, payload: params.payloadFor(RECIPIENT) };
}

// 08:00 on a given civil day, Europe/Paris.
function parisMorning(civilDate: string, offsetHours: "+01:00" | "+02:00") {
	return new Date(`${civilDate}T08:00:00${offsetHours}`);
}

describe("date helpers", () => {
	it("defaults mirror the domain getDefaultCampaignDeadlines", () => {
		const d = getDefaultReminderDeadlines(2027);
		expect(d.decl1Modification).toBe("2027-06-01T00:00:00.000Z");
		expect(d.decl1JointEvaluation).toBe("2027-08-01T00:00:00.000Z");
		expect(d.decl2Modification).toBe("2027-12-01T00:00:00.000Z");
		expect(d.decl2JointEvaluation).toBe("2028-02-01T00:00:00.000Z");
		expect(d.pathChoiceRound1).toBe("2027-07-01T00:00:00.000Z");
		expect(d.pathChoiceRound2).toBe("2028-01-01T00:00:00.000Z");
	});

	it("civilDateBefore subtracts calendar days across month boundaries", () => {
		expect(civilDateBefore("2027-06-01T00:00:00.000Z", 30)).toBe("2027-05-02");
		expect(civilDateBefore("2027-06-01T00:00:00.000Z", 10)).toBe("2027-05-22");
		expect(civilDateBefore("2027-12-01T00:00:00.000Z", 15)).toBe("2027-11-16");
		expect(civilDateBefore("2028-01-01T00:00:00.000Z", 15)).toBe("2027-12-17");
	});
});

describe("handleDailyDeadlineReminders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.ensureDedupTable.mockResolvedValue(undefined);
		mocks.getCampaignDeadlines.mockImplementation((_sql, year) =>
			Promise.resolve(getDefaultReminderDeadlines(year)),
		);
		for (const find of [
			mocks.findDraftDeclarations,
			mocks.findAwaitingCompliancePathChoiceFirstRound,
			mocks.findAwaitingCompliancePathChoiceSecondRound,
			mocks.findCorrectiveSecondDeclarationPending,
			mocks.findJointEvaluationPendingFirstRound,
			mocks.findJointEvaluationPendingSecondRound,
		]) {
			find.mockResolvedValue([RECIPIENT]);
		}
		mocks.dispatchReminder.mockResolvedValue({
			scheduled: 1,
			skippedAlreadySent: 0,
			enqueued: 1,
			enqueueErrors: 0,
		});
	});

	it("sends the declaration reminder J-30 before the modification deadline", async () => {
		// 2 May 2027 = 1er juin 2027 − 30 days.
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2027-05-02", "+02:00"),
		);
		const { params, payload } = dispatchFor("declaration_deadline_reminder");
		expect(params.variant).toBe("d30");
		expect(payload).toMatchObject({
			year: 2027,
			deadline: "2027-06-01T00:00:00.000Z",
			daysRemaining: 30,
		});
	});

	it("sends the path-choice round-1 reminder J-15 before 1er juillet", async () => {
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2027-06-16", "+02:00"),
		);
		const { payload } = dispatchFor("compliance_path_choice_reminder", "first");
		expect(payload).toMatchObject({
			year: 2027,
			deadline: "2027-07-01T00:00:00.000Z",
			round: "first",
		});
	});

	it("sends the path-choice round-2 reminder J-15 before 1er janvier N+1", async () => {
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2027-12-17", "+01:00"),
		);
		const { payload } = dispatchFor(
			"compliance_path_choice_reminder",
			"second",
		);
		expect(payload).toMatchObject({
			year: 2027,
			deadline: "2028-01-01T00:00:00.000Z",
			round: "second",
		});
	});

	it("sends the second-declaration reminder J-30 before 1er décembre", async () => {
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2027-11-01", "+01:00"),
		);
		const { params, payload } = dispatchFor("second_declaration_reminder");
		expect(params.variant).toBe("d30");
		expect(payload).toMatchObject({
			year: 2027,
			deadline: "2027-12-01T00:00:00.000Z",
			daysRemaining: 30,
		});
	});

	it("sends the joint-evaluation round-1 reminder J-30 before 1er septembre", async () => {
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2027-07-02", "+02:00"),
		);
		const { params, payload } = dispatchFor("joint_evaluation_reminder");
		expect(params.variant).toBe("first-d30");
		expect(payload).toMatchObject({
			year: 2027,
			deadline: "2027-08-01T00:00:00.000Z",
			round: "first",
		});
	});

	it("fires the round-2 joint evaluation reminder for the previous campaign year", async () => {
		// 2 Jan 2028 = 1er février 2028 (decl2 joint-eval deadline of campaign
		// 2027) − 30 days: campaign year must be resolved to 2027, not 2028.
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2028-01-02", "+01:00"),
		);
		const { params, payload } = dispatchFor("joint_evaluation_reminder");
		expect(params.variant).toBe("second-d30");
		expect(payload).toMatchObject({
			year: 2027,
			deadline: "2028-02-01T00:00:00.000Z",
			round: "second",
		});
	});

	it("sends nothing on a day that is not a reminder offset", async () => {
		await handleDailyDeadlineReminders(
			fakeSql,
			parisMorning("2027-03-15", "+01:00"),
		);
		expect(mocks.dispatchReminder).not.toHaveBeenCalled();
	});

	it("isolates a failing reminder block from the others", async () => {
		// 2 May 2027 triggers the declaration reminder; make its eligibility throw
		// and confirm the tick still returns without bubbling the error.
		mocks.findDraftDeclarations.mockRejectedValueOnce(new Error("db down"));
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		await expect(
			handleDailyDeadlineReminders(
				fakeSql,
				parisMorning("2027-05-02", "+02:00"),
			),
		).resolves.toMatchObject({ enqueued: 0 });
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
