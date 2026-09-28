import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { ADMIN_MFA_WINDOW_SECONDS } from "~/modules/domain";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

import {
	adminProcedure,
	createTRPCRouter,
	isAdminMfaRequiredTRPCError,
} from "../trpc";

const NOW_SECONDS = Math.floor(Date.now() / 1000);
const FRESH_MFA_AT = NOW_SECONDS - 60;
const STALE_MFA_AT = NOW_SECONDS - (ADMIN_MFA_WINDOW_SECONDS + 60);

const dbWriteSpy = vi.fn();
const guardedRouter = createTRPCRouter({
	ping: adminProcedure.query(() => "pong"),
	write: adminProcedure.mutation(() => {
		dbWriteSpy();
		return "written";
	}),
});

function createCaller(isAdmin: boolean | null, adminMfaAt?: number | null) {
	const session =
		isAdmin === null
			? null
			: {
					user: { id: "user-1", email: "u@example.com", isAdmin, adminMfaAt },
					expires: "",
				};
	return guardedRouter.createCaller({
		db: {},
		session,
		headers: new Headers(),
	} as never);
}

describe("adminProcedure", () => {
	it("throws UNAUTHORIZED when there is no session", async () => {
		await expect(createCaller(null).ping()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("throws FORBIDDEN with the unchanged message when the user is not admin", async () => {
		await expect(createCaller(false).ping()).rejects.toBeInstanceOf(TRPCError);
		await expect(createCaller(false).ping()).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Accès réservé aux administrateurs.",
		});
	});

	it("does not mark the non-admin refusal with the MFA-required cause", async () => {
		try {
			await createCaller(false).ping();
			throw new Error("expected ping() to throw");
		} catch (error) {
			expect(isAdminMfaRequiredTRPCError(error as TRPCError)).toBe(false);
		}
	});

	it("resolves for an admin user with a fresh MFA", async () => {
		await expect(createCaller(true, FRESH_MFA_AT).ping()).resolves.toBe("pong");
	});

	it("throws FORBIDDEN with the MFA-required marker when the admin has no MFA timestamp", async () => {
		try {
			await createCaller(true, null).ping();
			throw new Error("expected ping() to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(TRPCError);
			expect((error as TRPCError).code).toBe("FORBIDDEN");
			expect(isAdminMfaRequiredTRPCError(error as TRPCError)).toBe(true);
		}
	});

	it("throws FORBIDDEN with the MFA-required marker when the admin MFA is stale", async () => {
		try {
			await createCaller(true, STALE_MFA_AT).ping();
			throw new Error("expected ping() to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(TRPCError);
			expect((error as TRPCError).code).toBe("FORBIDDEN");
			expect(isAdminMfaRequiredTRPCError(error as TRPCError)).toBe(true);
		}
	});

	it("refuses a read the same way a write is refused when the MFA is stale", async () => {
		await expect(createCaller(true, STALE_MFA_AT).ping()).rejects.toMatchObject(
			{ code: "FORBIDDEN" },
		);
	});

	it("never runs the mutation body — and never touches the database — when the MFA is stale", async () => {
		dbWriteSpy.mockClear();
		await expect(
			createCaller(true, STALE_MFA_AT).write(),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(dbWriteSpy).not.toHaveBeenCalled();
	});

	it("runs the mutation body when the admin MFA is fresh", async () => {
		dbWriteSpy.mockClear();
		await expect(createCaller(true, FRESH_MFA_AT).write()).resolves.toBe(
			"written",
		);
		expect(dbWriteSpy).toHaveBeenCalledOnce();
	});
});

describe("isAdminMfaRequiredTRPCError", () => {
	it("is false for a plain TRPCError with no cause", () => {
		expect(
			isAdminMfaRequiredTRPCError(new TRPCError({ code: "FORBIDDEN" })),
		).toBe(false);
	});
});
