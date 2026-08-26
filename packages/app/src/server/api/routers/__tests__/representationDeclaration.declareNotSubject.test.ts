import { describe, expect, it, vi } from "vitest";

import { REPRESENTATION_YEAR as YEAR } from "~/modules/declaration-representation/__tests__/fixtures";
import {
	CLOSED_CAMPAIGN,
	CLOSED_MESSAGE,
	conflictSet,
	createCaller,
	createMockDb,
	IMPERSONATION_MESSAGE,
	impersonatingSession,
	insertedValues,
	installRouterTestEnv,
	type MockDb,
	NOW,
	SIREN,
	USER_ID,
	whereParams,
} from "./representationDeclarationHarness";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const mockGetRepresentationCampaign = vi.fn();
vi.mock("~/server/db/getRepresentationCampaign", () => ({
	getRepresentationCampaign: (year: number) =>
		mockGetRepresentationCampaign(year),
}));

const ALREADY_SUBMITTED_MESSAGE =
	"La déclaration des écarts de représentation a déjà été transmise pour cette année.";

const NOT_SUBJECT_COLUMNS = {
	status: "not_subject",
	currentStep: 0,
	draft: null,
	draftUpdatedAt: null,
	declarantId: USER_ID,
	updatedAt: NOW,
};

describe("representationDeclarationRouter.declareNotSubject", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	async function declareNotSubject(
		mock: MockDb,
		session?: ReturnType<typeof impersonatingSession>,
	) {
		return createCaller(mock.db, session).declareNotSubject({ year: YEAR });
	}

	it("records the choice on a company that never started the démarche", async () => {
		const mock = createMockDb();

		await expect(declareNotSubject(mock)).resolves.toEqual({ success: true });
		expect(insertedValues(mock)).toEqual({
			siren: SIREN,
			year: YEAR,
			...NOT_SUBJECT_COLUMNS,
		});
	});

	it("looks the existing declaration up on the session company and the input year", async () => {
		const mock = createMockDb();

		await declareNotSubject(mock);

		expect(whereParams(mock)).toEqual([SIREN, YEAR]);
	});

	it("wipes the draft of a company that had started the démarche (S1)", async () => {
		const mock = createMockDb([{ status: "draft" }]);

		await declareNotSubject(mock);

		expect(conflictSet(mock).set).toEqual(NOT_SUBJECT_COLUMNS);
		expect(conflictSet(mock).target).toEqual([
			expect.objectContaining({ name: "siren" }),
			expect.objectContaining({ name: "year" }),
		]);
	});

	// A non-subject company transmitted nothing: dating a transmission would make
	// it appear on the public surfaces, which key off `submitted_at`.
	it("never stamps a submission date, on either the insert or the update path", async () => {
		const mock = createMockDb([{ status: "draft" }]);

		await declareNotSubject(mock);

		expect(insertedValues(mock)).not.toHaveProperty("submittedAt");
		expect(conflictSet(mock).set).not.toHaveProperty("submittedAt");
	});

	it("resets the current step so the subjection screen is shown again", async () => {
		const mock = createMockDb([{ status: "draft" }]);

		await declareNotSubject(mock);

		expect(conflictSet(mock).set).toMatchObject({
			currentStep: 0,
			draft: null,
			draftUpdatedAt: null,
		});
	});

	it("refuses to bury a declaration that was already transmitted (S2)", async () => {
		const mock = createMockDb([{ status: "submitted" }]);

		await expect(declareNotSubject(mock)).rejects.toMatchObject({
			code: "CONFLICT",
			message: ALREADY_SUBMITTED_MESSAGE,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});

	it("refuses to record the choice once the campaign is closed (S3)", async () => {
		mockGetRepresentationCampaign.mockResolvedValue(CLOSED_CAMPAIGN);
		const mock = createMockDb();

		await expect(declareNotSubject(mock)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: CLOSED_MESSAGE,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});

	it("refuses to record the choice while an admin mimics the company", async () => {
		const mock = createMockDb();

		await expect(
			declareNotSubject(mock, impersonatingSession()),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: IMPERSONATION_MESSAGE,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});
});
