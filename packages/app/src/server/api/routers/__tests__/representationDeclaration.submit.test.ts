import { describe, expect, it, vi } from "vitest";

import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	FULL_REPRESENTATION_PAYLOAD as FULL_PAYLOAD,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	NOT_COMPUTABLE_PAYLOAD,
	OFFLINE_PUBLICATION,
	SINGLE_EXECUTIVE,
	VALID_REFERENCE_PERIOD,
	VALIDATION_MESSAGES,
	REPRESENTATION_YEAR as YEAR,
} from "~/modules/declaration-representation/__tests__/fixtures";
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

describe("representationDeclarationRouter.submit", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	async function submit(
		mock: MockDb,
		payload: Record<string, unknown>,
		session?: ReturnType<typeof impersonatingSession>,
	) {
		return createCaller(mock.db, session).submit({ year: YEAR, payload });
	}

	it("stores a complete declaration as submitted (S19)", async () => {
		const mock = createMockDb();

		await submit(mock, FULL_PAYLOAD);

		expect(insertedValues(mock)).toEqual({
			siren: SIREN,
			year: YEAR,
			declarantId: USER_ID,
			referencePeriodStart: "2025-01-01",
			referencePeriodEnd: "2025-12-31",
			executiveWomenPercent: "60",
			executiveMenPercent: "40",
			notComputableReasonExecutives: null,
			memberWomenPercent: "55",
			memberMenPercent: "45",
			notComputableReasonMembers: null,
			publishDate: "2026-03-01",
			publishUrl: "https://exemple.fr/egalite-professionnelle",
			publishModalities: null,
			status: "submitted",
			submittedAt: NOW,
			updatedAt: NOW,
			draft: null,
			draftUpdatedAt: null,
		});
	});

	it.each([
		["no executive", NO_EXECUTIVES, "aucun_cadre_dirigeant"],
		["a single executive", SINGLE_EXECUTIVE, "un_seul_cadre_dirigeant"],
	])("derives the executives motive when there is %s", async (_label, executives, reason) => {
		const mock = createMockDb();

		await submit(mock, {
			...VALID_REFERENCE_PERIOD,
			...executives,
			...COMPUTABLE_MEMBERS,
			...OFFLINE_PUBLICATION,
		});

		expect(insertedValues(mock)).toMatchObject({
			executiveWomenPercent: null,
			executiveMenPercent: null,
			notComputableReasonExecutives: reason,
		});
	});

	it("derives the members motive when there is no management body", async () => {
		const mock = createMockDb();

		await submit(mock, {
			...VALID_REFERENCE_PERIOD,
			...COMPUTABLE_EXECUTIVES,
			...NO_MANAGEMENT_BODY,
			...OFFLINE_PUBLICATION,
		});

		expect(insertedValues(mock)).toMatchObject({
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
		});
	});

	it("stores the publication modalities when there is no website", async () => {
		const mock = createMockDb();

		await submit(mock, {
			...VALID_REFERENCE_PERIOD,
			...COMPUTABLE_EXECUTIVES,
			...COMPUTABLE_MEMBERS,
			...OFFLINE_PUBLICATION,
		});

		expect(insertedValues(mock)).toMatchObject({
			publishDate: "2026-03-01",
			publishUrl: null,
			publishModalities: OFFLINE_PUBLICATION.publishModalities,
		});
	});

	it("leaves the publication columns empty when no gap is computable", async () => {
		const mock = createMockDb();

		await submit(mock, NOT_COMPUTABLE_PAYLOAD);

		expect(insertedValues(mock)).toMatchObject({
			notComputableReasonExecutives: "aucun_cadre_dirigeant",
			notComputableReasonMembers: "aucune_instance_dirigeante",
			publishDate: null,
			publishUrl: null,
			publishModalities: null,
		});
	});

	it("replaces the previous submission on conflict (S22)", async () => {
		const mock = createMockDb();

		await submit(mock, FULL_PAYLOAD);
		const { target, set } = conflictSet(mock);

		expect(target).toEqual([
			expect.objectContaining({ name: "siren" }),
			expect.objectContaining({ name: "year" }),
		]);
		expect(set).toMatchObject({
			status: "submitted",
			submittedAt: NOW,
			draft: null,
			draftUpdatedAt: null,
		});
	});

	it("never overwrites the SIREN or the declarant on conflict", async () => {
		const mock = createMockDb();

		await submit(mock, FULL_PAYLOAD);

		expect(conflictSet(mock).set).not.toHaveProperty("siren");
		expect(conflictSet(mock).set).not.toHaveProperty("declarantId");
	});

	it.each([
		[
			"percentages that do not sum to 100 (S6)",
			{ ...FULL_PAYLOAD, executiveMenPercent: 30 },
			VALIDATION_MESSAGES.sum,
		],
		[
			"a publication date within the reference period (S11)",
			{ ...FULL_PAYLOAD, publishDate: "2025-12-31" },
			VALIDATION_MESSAGES.publishDateAfterPeriod,
		],
		[
			"publication data while no gap is computable (S12)",
			{ ...NOT_COMPUTABLE_PAYLOAD, publishDate: "2026-03-01" },
			VALIDATION_MESSAGES.publicationNotRequired,
		],
		[
			"a reference period ending on another year (S4)",
			{
				...FULL_PAYLOAD,
				referencePeriodStart: "2024-01-01",
				referencePeriodEnd: "2024-12-31",
			},
			VALIDATION_MESSAGES.periodYear,
		],
	])("rejects %s", async (_label, payload, message) => {
		const mock = createMockDb();

		await expect(submit(mock, payload)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});

	it("refuses to submit once the campaign is closed (S23)", async () => {
		mockGetRepresentationCampaign.mockResolvedValue(CLOSED_CAMPAIGN);
		const mock = createMockDb();

		await expect(submit(mock, FULL_PAYLOAD)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: CLOSED_MESSAGE,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});

	it("refuses to submit while an admin mimics the company", async () => {
		const mock = createMockDb();

		await expect(
			submit(mock, FULL_PAYLOAD, impersonatingSession()),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: IMPERSONATION_MESSAGE,
		});
		expect(mock.insert).not.toHaveBeenCalled();
	});
});
