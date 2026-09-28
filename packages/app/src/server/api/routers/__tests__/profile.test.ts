import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { users } from "~/server/db/schema";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: {},
}));

const mockLogAction = vi.fn();
vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

import { profileRouter } from "../profile";

const USER_ID = "user-1";

const PROFILE_ROW = {
	firstName: "Julien",
	lastName: "Martin",
	email: "julien.martin@example.fr",
	phone: "+33122334455",
};

const VALID_INPUT = {
	firstName: "Julien",
	lastName: "Martin",
	phone: "01 22 33 44 55",
};

function buildDb(selectRows: unknown[] = [PROFILE_ROW]) {
	const where = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn().mockReturnValue({ where });
	return {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(selectRows),
				}),
			}),
		}),
		update: vi.fn().mockReturnValue({ set }),
		__set: set,
		__where: where,
	};
}

function createCaller(db: unknown) {
	return profileRouter.createCaller({
		db,
		session: { user: { id: USER_ID, siret: "12345678900012" }, expires: "" },
		headers: new Headers(),
	} as never);
}

beforeEach(() => {
	mockLogAction.mockClear();
});

describe("profileRouter — get", () => {
	it("returns the identity, e-mail and phone of the session user", async () => {
		const caller = createCaller(buildDb());
		await expect(caller.get()).resolves.toEqual(PROFILE_ROW);
	});

	it("throws NOT_FOUND when the session user has no row", async () => {
		const caller = createCaller(buildDb([]));
		await expect(caller.get()).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("profileRouter — updateProfile", () => {
	it("persists both identity fields and the canonical phone for the session user", async () => {
		const db = buildDb();
		const caller = createCaller(db);

		await expect(caller.updateProfile(VALID_INPUT)).resolves.toEqual({
			success: true,
		});
		expect(db.__set).toHaveBeenCalledWith({
			firstName: "Julien",
			lastName: "Martin",
			phone: "+33122334455",
		});
		expect(db.__where).toHaveBeenCalledWith(eq(users.id, USER_ID));
	});

	it("trims the identity fields before persisting them", async () => {
		const db = buildDb();
		const caller = createCaller(db);

		await caller.updateProfile({ ...VALID_INPUT, firstName: "  Julien  " });

		expect(db.__set).toHaveBeenCalledWith(
			expect.objectContaining({ firstName: "Julien" }),
		);
	});

	it.each([
		"firstName",
		"lastName",
	])("rejects an empty %s without touching the database", async (field) => {
		const db = buildDb();
		const caller = createCaller(db);

		await expect(
			caller.updateProfile({ ...VALID_INPUT, [field]: "" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.update).not.toHaveBeenCalled();
	});

	it("rejects an invalid phone without touching the database", async () => {
		const db = buildDb();
		const caller = createCaller(db);

		await expect(
			caller.updateProfile({ ...VALID_INPUT, phone: "012233" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.update).not.toHaveBeenCalled();
	});
});

describe("profileRouter — updatePhone", () => {
	// Kept alongside updateProfile because MissingInfoModal still collects the
	// phone on its own.
	it("persists the phone alone", async () => {
		const db = buildDb();
		const caller = createCaller(db);

		await expect(
			caller.updatePhone({ phone: "01 22 33 44 55" }),
		).resolves.toEqual({ success: true });
		expect(db.__set).toHaveBeenCalledWith({ phone: "+33122334455" });
	});
});
