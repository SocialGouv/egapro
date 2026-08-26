import { describe, expect, it, vi } from "vitest";

import { REPRESENTATION_YEAR as YEAR } from "~/modules/declaration-representation/__tests__/fixtures";
import {
	CLOSED_CAMPAIGN,
	CLOSED_MESSAGE,
	compileSql,
	conflictSet,
	createCaller,
	createMockDb,
	DRAFT,
	IMPERSONATION_MESSAGE,
	impersonatingSession,
	insertedValues,
	installRouterTestEnv,
	type MockDb,
	NOW,
	SIREN,
	USER_ID,
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

describe("representationDeclarationRouter.saveDraft", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	async function saveDraft(
		mock: MockDb,
		session?: ReturnType<typeof impersonatingSession>,
	) {
		return createCaller(mock.db, session).saveDraft({
			year: YEAR,
			draft: DRAFT,
			currentStep: 3,
		});
	}

	it("creates the row as a draft owned by the session company", async () => {
		const mock = createMockDb();

		await saveDraft(mock);

		expect(insertedValues(mock)).toEqual({
			siren: SIREN,
			year: YEAR,
			declarantId: USER_ID,
			status: "draft",
			draft: DRAFT,
			draftUpdatedAt: NOW,
			currentStep: 3,
			updatedAt: NOW,
		});
	});

	it("targets the (siren, year) unique constraint on conflict", async () => {
		const mock = createMockDb();

		await saveDraft(mock);

		expect(conflictSet(mock).target).toEqual([
			expect.objectContaining({ name: "siren" }),
			expect.objectContaining({ name: "year" }),
		]);
	});

	it("touches no column beyond the draft, its step and the status guard", async () => {
		const mock = createMockDb();

		await saveDraft(mock);

		expect(Object.keys(conflictSet(mock).set).sort()).toEqual([
			"currentStep",
			"draft",
			"draftUpdatedAt",
			"status",
			"updatedAt",
		]);
	});

	// SQL rewrites the status, not the caller, so a `submitted` row can never be degraded.
	it("reopens a not-subject declaration as a draft and leaves any other status alone", async () => {
		const mock = createMockDb();

		await saveDraft(mock);
		const statusSql = compileSql(conflictSet(mock).set.status);

		expect(statusSql).toBe(
			`CASE WHEN "app_representation_declaration"."status" = 'not_subject'` +
				` THEN 'draft' ELSE "app_representation_declaration"."status" END`,
		);
	});

	it("refuses to save once the campaign is closed (S23)", async () => {
		mockGetRepresentationCampaign.mockResolvedValue(CLOSED_CAMPAIGN);
		const mock = createMockDb();

		await expect(saveDraft(mock)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: CLOSED_MESSAGE,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});

	it("refuses to save while an admin mimics the company", async () => {
		const mock = createMockDb();

		await expect(saveDraft(mock, impersonatingSession())).rejects.toMatchObject(
			{
				code: "FORBIDDEN",
				message: IMPERSONATION_MESSAGE,
			},
		);
		expect(mock.insert).not.toHaveBeenCalled();
	});
});
