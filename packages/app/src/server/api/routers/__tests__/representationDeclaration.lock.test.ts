import { beforeEach, describe, expect, it, vi } from "vitest";

import { REPRESENTATION_YEAR as YEAR } from "~/modules/declaration-representation/__tests__/fixtures";
import { DEFAULT_LOCK_TIMEOUT_MINUTES } from "~/modules/domain";
import {
	ALREADY_SUBMITTED_MESSAGE,
	CLOSED_CAMPAIGN,
	CLOSED_MESSAGE,
	createCaller,
	createMockDb,
	IMPERSONATION_MESSAGE,
	impersonatingSession,
	installRouterTestEnv,
	SIREN,
	USER_ID,
} from "./representationDeclarationHarness";

const lockMocks = vi.hoisted(() => ({
	getActiveRepresentationLock: vi.fn(),
	acquireOrRefreshRepresentationLock: vi.fn(),
	refreshRepresentationLock: vi.fn(),
	releaseRepresentationLock: vi.fn(),
}));
vi.mock(
	"~/server/services/representationDeclarationLockService",
	async (importOriginal) => ({
		...(await importOriginal<
			typeof import("~/server/services/representationDeclarationLockService")
		>()),
		...lockMocks,
	}),
);

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

const HOLDER = {
	userId: "user-2",
	email: "camille.martin@example.fr",
	firstName: "Camille",
	lastName: "Martin",
	expiresAt: new Date("2026-06-15T10:00:00.000Z"),
};

describe("representationDeclarationRouter lock procedures", () => {
	installRouterTestEnv(mockGetRepresentationCampaign);

	beforeEach(() => {
		for (const mock of Object.values(lockMocks)) mock.mockReset();
	});

	describe("getLockState", () => {
		it("reports an unlocked declaration", async () => {
			lockMocks.getActiveRepresentationLock.mockResolvedValue(null);

			const result = await createCaller(createMockDb().db).getLockState({
				year: YEAR,
			});

			expect(result).toEqual({ locked: false, isOwnLock: false, holder: null });
			expect(lockMocks.getActiveRepresentationLock).toHaveBeenCalledWith(
				expect.anything(),
				SIREN,
				YEAR,
			);
		});

		it("exposes the holder of a lock taken by someone else", async () => {
			lockMocks.getActiveRepresentationLock.mockResolvedValue(HOLDER);

			const result = await createCaller(createMockDb().db).getLockState({
				year: YEAR,
			});

			expect(result).toEqual({
				locked: true,
				isOwnLock: false,
				holder: {
					firstName: HOLDER.firstName,
					lastName: HOLDER.lastName,
					email: HOLDER.email,
					expiresAt: HOLDER.expiresAt,
				},
			});
		});

		it("recognises the session user's own lock", async () => {
			lockMocks.getActiveRepresentationLock.mockResolvedValue({
				...HOLDER,
				userId: USER_ID,
			});

			const result = await createCaller(createMockDb().db).getLockState({
				year: YEAR,
			});

			expect(result.isOwnLock).toBe(true);
		});
	});

	describe("acquireLock", () => {
		const ACQUIRED = { acquired: true, holder: { ...HOLDER, userId: USER_ID } };

		beforeEach(() => {
			lockMocks.acquireOrRefreshRepresentationLock.mockResolvedValue(ACQUIRED);
		});

		it("acquires with the default timeout when no setting is stored", async () => {
			const mock = createMockDb([{ status: "draft" }]);

			const result = await createCaller(mock.db).acquireLock({ year: YEAR });

			expect(result).toEqual(ACQUIRED);
			expect(lockMocks.acquireOrRefreshRepresentationLock).toHaveBeenCalledWith(
				mock.db,
				SIREN,
				YEAR,
				USER_ID,
				DEFAULT_LOCK_TIMEOUT_MINUTES,
			);
		});

		it("uses the lock timeout configured by the administrators", async () => {
			const mock = createMockDb([{ status: "draft", minutes: 12 }]);

			await createCaller(mock.db).acquireLock({ year: YEAR });

			expect(lockMocks.acquireOrRefreshRepresentationLock).toHaveBeenCalledWith(
				mock.db,
				SIREN,
				YEAR,
				USER_ID,
				12,
			);
		});

		it("acquires on a declaration that has not been started yet", async () => {
			const mock = createMockDb([]);

			const result = await createCaller(mock.db).acquireLock({ year: YEAR });

			expect(result).toEqual(ACQUIRED);
		});

		it("refuses once the campaign is closed", async () => {
			mockGetRepresentationCampaign.mockResolvedValue(CLOSED_CAMPAIGN);

			await expect(
				createCaller(createMockDb().db).acquireLock({ year: YEAR }),
			).rejects.toMatchObject({ code: "FORBIDDEN", message: CLOSED_MESSAGE });
			expect(
				lockMocks.acquireOrRefreshRepresentationLock,
			).not.toHaveBeenCalled();
		});

		it("refuses on a submitted declaration", async () => {
			const mock = createMockDb([{ status: "submitted" }]);

			await expect(
				createCaller(mock.db).acquireLock({ year: YEAR }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
				message: ALREADY_SUBMITTED_MESSAGE,
			});
			expect(
				lockMocks.acquireOrRefreshRepresentationLock,
			).not.toHaveBeenCalled();
		});

		it("refuses while impersonating a company", async () => {
			await expect(
				createCaller(createMockDb().db, impersonatingSession()).acquireLock({
					year: YEAR,
				}),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
				message: IMPERSONATION_MESSAGE,
			});
			expect(
				lockMocks.acquireOrRefreshRepresentationLock,
			).not.toHaveBeenCalled();
		});
	});

	describe("heartbeat", () => {
		it("refreshes the lock held by the session user", async () => {
			lockMocks.refreshRepresentationLock.mockResolvedValue(true);
			const mock = createMockDb([]);

			const result = await createCaller(mock.db).heartbeat({ year: YEAR });

			expect(result).toEqual({ held: true });
			expect(lockMocks.refreshRepresentationLock).toHaveBeenCalledWith(
				mock.db,
				SIREN,
				YEAR,
				USER_ID,
				DEFAULT_LOCK_TIMEOUT_MINUTES,
			);
		});

		it("reports a lock that is no longer held", async () => {
			lockMocks.refreshRepresentationLock.mockResolvedValue(false);

			const result = await createCaller(createMockDb().db).heartbeat({
				year: YEAR,
			});

			expect(result).toEqual({ held: false });
		});

		it("drops the lock without refreshing once the campaign is closed", async () => {
			mockGetRepresentationCampaign.mockResolvedValue(CLOSED_CAMPAIGN);

			const result = await createCaller(createMockDb().db).heartbeat({
				year: YEAR,
			});

			expect(result).toEqual({ held: false });
			expect(lockMocks.refreshRepresentationLock).not.toHaveBeenCalled();
		});
	});

	describe("releaseLock", () => {
		it("releases the lock of the session user", async () => {
			lockMocks.releaseRepresentationLock.mockResolvedValue(undefined);
			const mock = createMockDb();

			const result = await createCaller(mock.db).releaseLock({ year: YEAR });

			expect(result).toEqual({ released: true });
			expect(lockMocks.releaseRepresentationLock).toHaveBeenCalledWith(
				mock.db,
				SIREN,
				YEAR,
				USER_ID,
			);
		});
	});
});
