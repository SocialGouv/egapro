import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import postgres from "postgres";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { env } from "~/env.js";
import { declarationDraftRouter } from "~/server/api/routers/declarationDraft";
import { authConfig } from "~/server/auth/config";
import { db } from "~/server/db";

vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn().mockResolvedValue(null),
}));

describe("company link re-synced on every ProConnect sign-in (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const EMAIL = "company-link-integration@example.fr";
	const FORMER_SIREN = "700000020";
	const CURRENT_SIREN = "700000021";
	const SIRENS = [FORMER_SIREN, CURRENT_SIREN];
	const YEAR = 2025;

	function siretOf(siren: string) {
		return `${siren}00015`;
	}

	function signIn(siret?: string) {
		return authConfig.callbacks.jwt({
			token: { sub: "proconnect-sub" } as JWT,
			user: { id: "proconnect-sub", email: EMAIL, siret } as User,
			account: {} as Account,
			trigger: "signIn",
		} as unknown as Parameters<typeof authConfig.callbacks.jwt>[0]);
	}

	async function userId() {
		const rows = await sql<
			{ id: string }[]
		>`SELECT id FROM app_user WHERE email = ${EMAIL}`;
		const id = rows[0]?.id;
		if (!id) throw new Error("user not created by the sign-in");
		return id;
	}

	async function linkedSirens() {
		const rows = await sql<{ siren: string }[]>`
			SELECT uc.siren FROM app_user_company uc
			JOIN app_user u ON u.id = uc.user_id
			WHERE u.email = ${EMAIL}
			ORDER BY uc.siren
		`;
		return rows.map((row) => row.siren);
	}

	async function revocationLogs() {
		const rows = await sql<{ siren: string | null; category: string }[]>`
			SELECT a.siren, a.category FROM audit.action_log a
			JOIN app_user u ON u.id = a.user_id
			WHERE u.email = ${EMAIL} AND a.action = 'auth.company_link_revoked'
			ORDER BY a.siren
		`;
		return rows.map((row) => ({ siren: row.siren, category: row.category }));
	}

	async function cleanup() {
		await sql`DELETE FROM audit.action_log WHERE user_id IN (SELECT id FROM app_user WHERE email = ${EMAIL})`;
		await sql`DELETE FROM app_declaration WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_user_company WHERE siren IN ${sql(SIRENS)} OR user_id IN (SELECT id FROM app_user WHERE email = ${EMAIL})`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_user WHERE email = ${EMAIL}`;
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
	});

	it("links the user to the company of the ProConnect SIRET", async () => {
		await signIn(siretOf(CURRENT_SIREN));

		expect(await linkedSirens()).toEqual([CURRENT_SIREN]);
	});

	it("keeps the link when the user signs in again with the same SIRET", async () => {
		await signIn(siretOf(CURRENT_SIREN));
		await signIn(siretOf(CURRENT_SIREN));

		expect(await linkedSirens()).toEqual([CURRENT_SIREN]);
		expect(await revocationLogs()).toEqual([]);
	});

	it("drops the former company when ProConnect now attaches the user to another one", async () => {
		await signIn(siretOf(FORMER_SIREN));
		await signIn(siretOf(CURRENT_SIREN));

		expect(await linkedSirens()).toEqual([CURRENT_SIREN]);
		expect(await revocationLogs()).toEqual([
			{ siren: FORMER_SIREN, category: "auth" },
		]);
	});

	it("drops every stale link at once, whatever the number", async () => {
		await signIn(siretOf(FORMER_SIREN));
		const id = await userId();
		await sql`INSERT INTO app_company (siren, name) VALUES (${CURRENT_SIREN}, 'Société Démo')`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${id}, ${CURRENT_SIREN})`;

		await signIn(siretOf(CURRENT_SIREN));

		expect(await linkedSirens()).toEqual([CURRENT_SIREN]);
	});

	it.each([
		["missing", undefined],
		["malformed", "ABCDEFGHI00015"],
		["too short", "7000"],
	])("revokes every link when the SIRET is %s", async (_case, siret) => {
		await signIn(siretOf(FORMER_SIREN));
		const id = await userId();
		await sql`INSERT INTO app_company (siren, name) VALUES (${CURRENT_SIREN}, 'Société Démo')`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${id}, ${CURRENT_SIREN})`;

		await signIn(siret);

		expect(await linkedSirens()).toEqual([]);
		expect(await revocationLogs()).toEqual([
			{ siren: FORMER_SIREN, category: "auth" },
			{ siren: CURRENT_SIREN, category: "auth" },
		]);
	});

	it("restores the link on the next sign-in that carries a SIRET", async () => {
		await signIn(siretOf(CURRENT_SIREN));
		await signIn(undefined);
		await signIn(siretOf(CURRENT_SIREN));

		expect(await linkedSirens()).toEqual([CURRENT_SIREN]);
	});

	describe("the former company after a reconnection under another SIRET", () => {
		async function callerAfterMove() {
			await signIn(siretOf(FORMER_SIREN));
			await signIn(siretOf(CURRENT_SIREN));
			return declarationDraftRouter.createCaller({
				db,
				session: {
					user: {
						id: await userId(),
						email: EMAIL,
						siret: siretOf(CURRENT_SIREN),
						isAdmin: false,
						impersonation: null,
					},
					expires: "",
				},
				headers: new Headers(),
			} as never);
		}

		it("can no longer be read", async () => {
			const caller = await callerAfterMove();

			await expect(
				caller.get({ siren: FORMER_SIREN, year: YEAR }),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
		});

		it("can no longer be written", async () => {
			const caller = await callerAfterMove();

			await expect(
				caller.save({
					siren: FORMER_SIREN,
					year: YEAR,
					slice: { kind: "main", step: "step1", data: { workforce: 50 } },
				}),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
			await expect(
				caller.clear({ siren: FORMER_SIREN, year: YEAR }),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
		});

		it("leaves the current company readable and writable", async () => {
			const caller = await callerAfterMove();

			await expect(
				caller.save({
					siren: CURRENT_SIREN,
					year: YEAR,
					slice: { kind: "main", step: "step1", data: { workforce: 50 } },
				}),
			).resolves.toEqual({ ok: true });
		});
	});
});
