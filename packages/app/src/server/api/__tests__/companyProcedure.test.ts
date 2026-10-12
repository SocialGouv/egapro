import { beforeEach, describe, expect, it, vi } from "vitest";
import { isUserLinkedToSiren } from "~/server/auth/companyLink";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

import {
	companyProcedure,
	companyWriteProcedure,
	createTRPCRouter,
} from "../trpc";

const SIREN = "123456789";
const SIRET = `${SIREN}00015`;
const IMPERSONATED_SIREN = "987654321";
const FRESH_MFA_AT = Math.floor(Date.now() / 1000) - 60;
const DB = {};

const router = createTRPCRouter({
	read: companyProcedure.query(({ ctx }) => ctx.siren),
	write: companyWriteProcedure.mutation(({ ctx }) => ctx.siren),
});

function callerFor(user: Record<string, unknown>) {
	return router.createCaller({
		db: DB,
		session: { user: { id: "user-1", isAdmin: false, ...user }, expires: "" },
		headers: new Headers(),
	} as never);
}

function impersonatingAdmin() {
	return callerFor({
		id: "admin-1",
		siret: SIRET,
		isAdmin: true,
		adminMfaAt: FRESH_MFA_AT,
		impersonation: { siren: IMPERSONATED_SIREN, name: "Société Démo" },
	});
}

describe("companyProcedure", () => {
	beforeEach(() => {
		vi.mocked(isUserLinkedToSiren).mockReset();
		vi.mocked(isUserLinkedToSiren).mockResolvedValue(true);
	});

	it("binds the session SIREN once the database confirms the link", async () => {
		await expect(callerFor({ siret: SIRET }).read()).resolves.toBe(SIREN);
		expect(isUserLinkedToSiren).toHaveBeenCalledWith(DB, "user-1", SIREN);
	});

	it("refuses a session whose link was revoked since its JWT was minted", async () => {
		vi.mocked(isUserLinkedToSiren).mockResolvedValue(false);

		await expect(callerFor({ siret: SIRET }).read()).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Accès refusé à cette entreprise.",
		});
	});

	it("refuses rather than grants when the link lookup fails", async () => {
		vi.mocked(isUserLinkedToSiren).mockRejectedValue(
			new Error("connection lost"),
		);

		await expect(callerFor({ siret: SIRET }).read()).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
		});
	});

	it("keeps answering BAD_REQUEST, without a lookup, when the session has no SIRET", async () => {
		await expect(callerFor({ siret: null }).read()).rejects.toMatchObject({
			code: "BAD_REQUEST",
		});
		expect(isUserLinkedToSiren).not.toHaveBeenCalled();
	});

	it("lets an impersonating admin read the company without any link", async () => {
		await expect(impersonatingAdmin().read()).resolves.toBe(IMPERSONATED_SIREN);
		expect(isUserLinkedToSiren).not.toHaveBeenCalled();
	});

	it("still refuses an impersonating admin's writes", async () => {
		await expect(impersonatingAdmin().write()).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: expect.stringContaining("mimoquage"),
		});
	});
});
