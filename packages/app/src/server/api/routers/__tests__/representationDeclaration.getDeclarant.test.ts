import { describe, expect, it, vi } from "vitest";

import { REPRESENTATION_YEAR as YEAR } from "~/modules/declaration-representation/__tests__/fixtures";
import { users } from "~/server/db/schema";
import {
	buildSession,
	compileSql,
	createCaller,
	createMockDb,
	impersonatingSession,
	installRouterTestEnv,
	SIREN,
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

const DECLARANT = {
	firstName: "Jeanne",
	lastName: "Dupont",
	email: "jeanne.dupont@example.fr",
	phone: "0601020304",
};

describe("representationDeclarationRouter.getDeclarant", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	it("returns the contact of the user recorded on the transmitted declaration", async () => {
		const mock = createMockDb([DECLARANT]);

		const result = await createCaller(mock.db).getDeclarant({ year: YEAR });

		expect(result).toEqual(DECLARANT);
	});

	it("resolves the declarant from the declaration, never from the session user", async () => {
		const mock = createMockDb([DECLARANT]);

		await createCaller(mock.db).getDeclarant({ year: YEAR });

		const [joinedTable, joinCondition] = mock.innerJoin.mock.calls[0] ?? [];
		expect(joinedTable).toBe(users);
		expect(compileSql(joinCondition)).toBe(
			'"app_representation_declaration"."declarant_id" = "app_user"."id"',
		);
	});

	it("only reads a transmitted declaration of the session SIREN for the year", async () => {
		const mock = createMockDb([]);

		await createCaller(mock.db).getDeclarant({ year: YEAR });

		expect(whereParams(mock)).toEqual([SIREN, YEAR, "submitted"]);
	});

	it("ignores a SIREN supplied by the client", async () => {
		const mock = createMockDb([]);

		await createCaller(mock.db).getDeclarant({
			year: YEAR,
			siren: "999999999",
		} as never);

		expect(whereParams(mock)).toEqual([SIREN, YEAR, "submitted"]);
	});

	it("reads the impersonated SIREN when an admin mimics a company", async () => {
		const mock = createMockDb([]);

		await createCaller(mock.db, impersonatingSession("987654321")).getDeclarant(
			{ year: YEAR },
		);

		expect(whereParams(mock)).toEqual(["987654321", YEAR, "submitted"]);
	});

	it("returns null when no user is recorded on the declaration", async () => {
		const mock = createMockDb([]);

		const result = await createCaller(mock.db).getDeclarant({ year: YEAR });

		expect(result).toBeNull();
	});

	it("rejects a session without a usable SIRET", async () => {
		const caller = createCaller(
			createMockDb().db,
			buildSession({ siret: null }),
		);

		await expect(caller.getDeclarant({ year: YEAR })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "SIRET manquant ou invalide dans la session",
		});
	});
});
