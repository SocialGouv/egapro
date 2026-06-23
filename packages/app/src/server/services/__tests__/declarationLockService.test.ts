import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/server/db/schema", () => ({
	declarationLocks: {
		id: "id",
		declarationId: "declarationId",
		lockedByUserId: "lockedByUserId",
		lockedAt: "lockedAt",
		lastHeartbeatAt: "lastHeartbeatAt",
		expiresAt: "expiresAt",
	},
	users: {
		id: "id",
		email: "email",
		firstName: "firstName",
		lastName: "lastName",
	},
}));

const DECLARATION_ID = "decl-1";
const USER_ID = "user-1";
const TIMEOUT_MINUTES = 30;
const NOW = new Date("2025-06-23T10:00:00.000Z");
const EXPECTED_EXPIRY = new Date(NOW.getTime() + TIMEOUT_MINUTES * 60_000);

const HOLDER = {
	userId: USER_ID,
	email: "user-1@example.fr",
	firstName: "Alice",
	lastName: "Martin",
	expiresAt: EXPECTED_EXPIRY,
};

function selectChain(rows: unknown[]) {
	const limit = vi.fn().mockResolvedValue(rows);
	const where = vi.fn().mockReturnValue({ limit });
	const innerJoin = vi.fn().mockReturnValue({ where });
	const from = vi.fn().mockReturnValue({ innerJoin });
	return { select: vi.fn().mockReturnValue({ from }), where, limit };
}

function insertChain(returnedRows: unknown[]) {
	const returning = vi.fn().mockResolvedValue(returnedRows);
	const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
	const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
	return {
		insert: vi.fn().mockReturnValue({ values }),
		values,
		onConflictDoUpdate,
		returning,
	};
}

function updateChain(returnedRows: unknown[]) {
	const returning = vi.fn().mockResolvedValue(returnedRows);
	const where = vi.fn().mockReturnValue({ returning });
	const set = vi.fn().mockReturnValue({ where });
	return { update: vi.fn().mockReturnValue({ set }), set, where, returning };
}

function deleteChain() {
	const where = vi.fn().mockResolvedValue(undefined);
	return { delete: vi.fn().mockReturnValue({ where }), where };
}

const service = () => import("~/server/services/declarationLockService");

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("getActiveLock", () => {
	it("returns the holder row when the join yields an active lock", async () => {
		const select = selectChain([HOLDER]);
		const { getActiveLock } = await service();

		const result = await getActiveLock(select as never, DECLARATION_ID);

		expect(result).toEqual(HOLDER);
	});

	it("returns null when no active lock row is returned", async () => {
		const select = selectChain([]);
		const { getActiveLock } = await service();

		expect(await getActiveLock(select as never, DECLARATION_ID)).toBeNull();
	});
});

describe("acquireOrRefreshLock", () => {
	it("acquired=true when the upsert returns a row, stamping now + timeout", async () => {
		const insert = insertChain([{ id: "lock-1" }]);
		const db = { ...insert, ...selectChain([HOLDER]) };
		const { acquireOrRefreshLock } = await service();

		const result = await acquireOrRefreshLock(
			db as never,
			DECLARATION_ID,
			USER_ID,
			TIMEOUT_MINUTES,
		);

		expect(result.acquired).toBe(true);
		expect(result.holder).toEqual(HOLDER);
		const insertedValues = insert.values.mock.calls[0]?.[0];
		expect(insertedValues).toMatchObject({
			declarationId: DECLARATION_ID,
			lockedByUserId: USER_ID,
			lockedAt: NOW,
			lastHeartbeatAt: NOW,
			expiresAt: EXPECTED_EXPIRY,
		});
	});

	it("acquired=false when the conflict update touches no row", async () => {
		const insert = insertChain([]);
		const db = { ...insert, ...selectChain([HOLDER]) };
		const { acquireOrRefreshLock } = await service();

		const result = await acquireOrRefreshLock(
			db as never,
			DECLARATION_ID,
			"other-user",
			TIMEOUT_MINUTES,
		);

		expect(result.acquired).toBe(false);
		expect(result.holder).toEqual(HOLDER);
	});

	it("throws when the lock row is missing right after the upsert", async () => {
		const db = { ...insertChain([{ id: "lock-1" }]), ...selectChain([]) };
		const { acquireOrRefreshLock } = await service();

		await expect(
			acquireOrRefreshLock(
				db as never,
				DECLARATION_ID,
				USER_ID,
				TIMEOUT_MINUTES,
			),
		).rejects.toThrow(DECLARATION_ID);
	});
});

describe("refreshLock", () => {
	it("returns true and stamps now + timeout when a row is updated", async () => {
		const update = updateChain([{ id: "lock-1" }]);
		const { refreshLock } = await service();

		const ok = await refreshLock(
			update as never,
			DECLARATION_ID,
			USER_ID,
			TIMEOUT_MINUTES,
		);

		expect(ok).toBe(true);
		expect(update.set.mock.calls[0]?.[0]).toMatchObject({
			lastHeartbeatAt: NOW,
			expiresAt: EXPECTED_EXPIRY,
		});
	});

	it("returns false when no row is updated", async () => {
		const update = updateChain([]);
		const { refreshLock } = await service();

		expect(
			await refreshLock(
				update as never,
				DECLARATION_ID,
				USER_ID,
				TIMEOUT_MINUTES,
			),
		).toBe(false);
	});
});

describe("release helpers issue a delete", () => {
	it("releaseLock deletes scoped to the declaration and user", async () => {
		const del = deleteChain();
		const { releaseLock } = await service();

		await releaseLock(del as never, DECLARATION_ID, USER_ID);

		expect(del.delete).toHaveBeenCalledTimes(1);
		expect(del.where).toHaveBeenCalledTimes(1);
	});

	it("releaseAllLocksForUser deletes scoped to the user", async () => {
		const del = deleteChain();
		const { releaseAllLocksForUser } = await service();

		await releaseAllLocksForUser(del as never, USER_ID);

		expect(del.delete).toHaveBeenCalledTimes(1);
		expect(del.where).toHaveBeenCalledTimes(1);
	});

	it("releaseLockAsAdmin deletes scoped to the declaration", async () => {
		const del = deleteChain();
		const { releaseLockAsAdmin } = await service();

		await releaseLockAsAdmin(del as never, DECLARATION_ID);

		expect(del.delete).toHaveBeenCalledTimes(1);
		expect(del.where).toHaveBeenCalledTimes(1);
	});
});
