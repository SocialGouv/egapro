import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, type Mock, vi } from "vitest";

import {
	VALID_REFERENCE_PERIOD,
	REPRESENTATION_YEAR as YEAR,
} from "~/modules/declaration-representation/__tests__/fixtures";
import { representationDeclarationRouter } from "~/server/api/routers/representationDeclaration";

export const SIREN = "123456789";
export const SIRET = `${SIREN}00015`;
export const USER_ID = "user-1";
export const NOW = new Date("2026-06-15T09:30:00.000Z");
export const CAMPAIGN_YEAR = YEAR + 1;
export const CLOSED_MESSAGE =
	"La campagne de représentation équilibrée est close : la déclaration ne peut plus être modifiée.";
export const IMPERSONATION_MESSAGE =
	"Mode mimoquage actif : cette action est en lecture seule et ne peut pas être effectuée.";

export const OPEN_CAMPAIGN = {
	campaignStartDate: new Date("2026-01-01T00:00:00.000Z"),
	campaignEndDate: new Date("2026-12-31T00:00:00.000Z"),
	declarationDeadline: new Date("2026-03-01T00:00:00.000Z"),
};

export const CLOSED_CAMPAIGN = {
	campaignStartDate: new Date("2027-01-01T00:00:00.000Z"),
	campaignEndDate: new Date("2027-12-31T00:00:00.000Z"),
	declarationDeadline: new Date("2027-03-01T00:00:00.000Z"),
};

export const DRAFT = { currentStep: 3, ...VALID_REFERENCE_PERIOD };

export function createMockDb(rows: unknown[] = []) {
	const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
	const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
	const insert = vi.fn().mockReturnValue({ values });
	const limit = vi.fn().mockResolvedValue(rows);
	const where = vi.fn().mockReturnValue({ limit });
	const from = vi.fn().mockReturnValue({ where });
	const select = vi.fn().mockReturnValue({ from });

	return {
		db: { select, insert } as unknown,
		insert,
		values,
		onConflictDoUpdate,
		where,
	};
}

export type MockDb = ReturnType<typeof createMockDb>;

export function buildSession(overrides: Record<string, unknown> = {}) {
	return {
		user: {
			id: USER_ID,
			email: "declarant@exemple.fr",
			siret: SIRET,
			isAdmin: false,
			impersonation: null,
			...overrides,
		},
		expires: "",
	};
}

export function impersonatingSession(siren = SIREN) {
	return buildSession({ isAdmin: true, impersonation: { siren } });
}

export function createCaller(db: unknown, session = buildSession()) {
	return representationDeclarationRouter.createCaller({
		db,
		session,
		headers: new Headers(),
	} as never);
}

export function insertedValues(mock: MockDb) {
	return mock.values.mock.calls[0]?.[0] as Record<string, unknown>;
}

export function conflictSet(mock: MockDb) {
	return mock.onConflictDoUpdate.mock.calls[0]?.[0] as {
		target: unknown[];
		set: Record<string, unknown>;
	};
}

export function whereParams(mock: MockDb) {
	const clause = mock.where.mock.calls[0]?.[0];
	return new PgDialect().sqlToQuery(clause as never).params;
}

export function installRouterTestEnv(campaignMock: Mock) {
	beforeEach(() => {
		// Only `Date` is faked: the tRPC timing middleware awaits a real setTimeout.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		campaignMock.mockReset();
		campaignMock.mockResolvedValue(OPEN_CAMPAIGN);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});
}
