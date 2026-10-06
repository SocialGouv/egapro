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
import { declarationLockRouter } from "~/server/api/routers/declarationLock";
import { syncUserCompanyLink } from "~/server/auth/companyLink";
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
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id IN (SELECT id FROM app_user WHERE email = ${EMAIL})`;
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

	it("serialises the sync of one user behind a per-user lock, the SIRET-less branch included", async () => {
		await signIn(siretOf(FORMER_SIREN));
		const id = await userId();
		const holder = postgres(env.DATABASE_URL, { max: 1 });
		let releaseHolder!: () => void;
		const holderReleased = new Promise<void>((resolve) => {
			releaseHolder = resolve;
		});
		let lockTaken!: () => void;
		const lockHeld = new Promise<void>((resolve) => {
			lockTaken = resolve;
		});

		const holding = holder.begin(async (tx) => {
			await tx`SELECT pg_advisory_xact_lock(hashtextextended(${`app_user_company:${id}`}, 0))`;
			lockTaken();
			await holderReleased;
		});
		await lockHeld;

		let settled = false;
		const sync = syncUserCompanyLink(id, undefined).then((revoked) => {
			settled = true;
			return revoked;
		});
		try {
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(settled).toBe(false);
			expect(await linkedSirens()).toEqual([FORMER_SIREN]);
		} finally {
			releaseHolder();
			await holding;
			await holder.end();
		}

		expect(await sync).toEqual([FORMER_SIREN]);
		expect(await linkedSirens()).toEqual([]);
	});

	describe("edit locks", () => {
		async function declarationLockedBy(id: string, siren: string) {
			const declarationId = `company-link-declaration-${siren}`;
			await sql`
				INSERT INTO app_company (siren, name) VALUES (${siren}, 'Société Démo')
				ON CONFLICT (siren) DO NOTHING
			`;
			await sql`
				INSERT INTO app_declaration (id, siren, year, declarant_id)
				VALUES (${declarationId}, ${siren}, ${YEAR}, ${id})
			`;
			await sql`
				INSERT INTO app_declaration_lock (
					id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at
				)
				VALUES (
					${`company-link-lock-${siren}`}, ${declarationId}, ${id},
					NOW(), NOW(), NOW() + INTERVAL '10 minutes'
				)
			`;
		}

		async function lockedSirens() {
			const rows = await sql<{ siren: string }[]>`
				SELECT d.siren FROM app_declaration_lock l
				JOIN app_declaration d ON d.id = l.declaration_id
				JOIN app_user u ON u.id = l.locked_by_user_id
				WHERE u.email = ${EMAIL}
				ORDER BY d.siren
			`;
			return rows.map((row) => row.siren);
		}

		it("releases the locks the user held on the company they lost, and only those", async () => {
			await signIn(siretOf(FORMER_SIREN));
			const id = await userId();
			await declarationLockedBy(id, FORMER_SIREN);
			await declarationLockedBy(id, CURRENT_SIREN);

			await signIn(siretOf(CURRENT_SIREN));

			expect(await lockedSirens()).toEqual([CURRENT_SIREN]);
		});

		it("releases every lock of the user when the SIRET is missing", async () => {
			await signIn(siretOf(FORMER_SIREN));
			const id = await userId();
			await declarationLockedBy(id, FORMER_SIREN);

			await signIn(undefined);

			expect(await lockedSirens()).toEqual([]);
		});

		it("keeps the locks when the user signs in again with the same SIRET", async () => {
			await signIn(siretOf(FORMER_SIREN));
			const id = await userId();
			await declarationLockedBy(id, FORMER_SIREN);

			await signIn(siretOf(FORMER_SIREN));

			expect(await lockedSirens()).toEqual([FORMER_SIREN]);
		});
	});

	describe("a session minted before a sign-in under another SIRET on another device", () => {
		const RECHECK_SECONDS = 5 * 60;

		async function companyCallerFor(token: JWT) {
			const aged = {
				...token,
				companyLinkCheckedAt:
					(token.companyLinkCheckedAt ?? 0) - RECHECK_SECONDS - 1,
			};
			const refreshed = await authConfig.callbacks.jwt({
				token: aged,
			} as unknown as Parameters<typeof authConfig.callbacks.jwt>[0]);
			const session = authConfig.callbacks.session({
				session: { user: { email: EMAIL }, expires: "" },
				token: refreshed,
			} as unknown as Parameters<typeof authConfig.callbacks.session>[0]);
			return declarationLockRouter.createCaller({
				db,
				session,
				headers: new Headers(),
			} as never);
		}

		it("loses access to the former company once the re-check window has passed", async () => {
			const formerDevice = await signIn(siretOf(FORMER_SIREN));
			await signIn(siretOf(CURRENT_SIREN));

			const caller = await companyCallerFor(formerDevice);

			await expect(
				caller.getActiveLockForCurrentDeclaration(),
			).rejects.toMatchObject({ code: "BAD_REQUEST" });
		});

		it("keeps access on the device that signed in last", async () => {
			await signIn(siretOf(FORMER_SIREN));
			const currentDevice = await signIn(siretOf(CURRENT_SIREN));

			const caller = await companyCallerFor(currentDevice);

			await expect(
				caller.getActiveLockForCurrentDeclaration(),
			).resolves.toEqual({ lockedByOther: false, holder: null });
		});
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
