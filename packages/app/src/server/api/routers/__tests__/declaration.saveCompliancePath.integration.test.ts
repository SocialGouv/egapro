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
import { getCurrentYear } from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

// Regression — issue #4293: `saveCompliancePath` is the only `applyAction`
// caller that used to enqueue no acknowledgement at all when its transition
// closed the démarche (the "justify" path with no CSE, round 1 or round 2).
// These exercise the real Postgres driver + the real `notification.enqueue`
// audit trail, because the mutation's own unit tests (mocked db) can't prove
// an e-mail actually got queued, and `sendRules.test.ts` can't prove the
// mutation calls `enqueueReceipt` at all.
describe("declaration.saveCompliancePath — démarche-complete receipt (#4293)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "555666777";
	const USER_ID = "compliance-path-integration-user";
	const USER_EMAIL = "compliance-path-integration@example.fr";
	const YEAR = getCurrentYear();

	function createCaller() {
		return appRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: USER_EMAIL,
					siret: `${SIREN}00015`,
					isAdmin: false,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never).declaration;
	}

	async function insertDeclaration(status: string, cseRequired = false) {
		const id = crypto.randomUUID();
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, cse_required, current_step)
			VALUES
				(${id}, ${SIREN}, ${YEAR}, ${USER_ID}, ${status}, ${cseRequired}, 6)
		`;
		return id;
	}

	async function acquireLock(declarationId: string) {
		await sql`
			INSERT INTO app_declaration_lock
				(id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES
				(${crypto.randomUUID()}, ${declarationId}, ${USER_ID}, NOW(), NOW(), NOW() + INTERVAL '30 minutes')
		`;
	}

	// Makes `getCurrentRound` resolve to 2, the same way a real round-2 funnel
	// would after `submitSecondDeclaration` recorded this event.
	async function markSecondDeclarationSubmitted(declarationId: string) {
		await sql`
			INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, round, actor_user_id, created_at)
			VALUES
				(${crypto.randomUUID()}, ${declarationId}, 'second_declaration_submit', 2, ${USER_ID}, NOW())
		`;
	}

	async function waitForNotificationEnqueue() {
		return vi.waitFor(async () => {
			const rows = await sql<
				{ metadata: { type: string; variant?: string } }[]
			>`
				SELECT metadata FROM audit.action_log
				WHERE user_id = ${USER_ID} AND action = 'notification.enqueue'
				ORDER BY created_at DESC
			`;
			expect(rows.length).toBeGreaterThan(0);
			return [...rows];
		}, 5_000);
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_company (siren, name) VALUES (${SIREN}, 'Société AR Test')
			ON CONFLICT DO NOTHING
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE actor_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE actor_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
	});

	it("CAS-03 — round 1 'justify' without CSE enqueues a completed acknowledgement", async () => {
		const declarationId = await insertDeclaration(
			"awaiting_compliance_path_choice",
		);
		await acquireLock(declarationId);

		await createCaller().saveCompliancePath({ path: "justify" });

		const rows = await waitForNotificationEnqueue();
		expect(rows[0]?.metadata).toMatchObject({
			type: "declaration_confirmation",
			variant: "completed",
		});
	});

	it("CAS-09 — round 2 'justify' without CSE enqueues a completed second-declaration acknowledgement", async () => {
		const declarationId = await insertDeclaration("awaiting_revision_choice");
		await markSecondDeclarationSubmitted(declarationId);
		await acquireLock(declarationId);

		await createCaller().saveCompliancePath({ path: "justify" });

		const rows = await waitForNotificationEnqueue();
		expect(rows[0]?.metadata).toMatchObject({
			type: "second_declaration_confirmation",
			variant: "completed",
		});
	});

	// A non-terminal path choice (corrective action, joint evaluation) has
	// more steps ahead — the démarche isn't over, so no acknowledgement is
	// due yet. Confirms the fix is gated on `demarche_complete`, not fired
	// unconditionally on every path choice.
	it("does not enqueue any receipt for a non-terminal path choice", async () => {
		const declarationId = await insertDeclaration(
			"awaiting_compliance_path_choice",
		);
		await acquireLock(declarationId);

		await createCaller().saveCompliancePath({ path: "corrective_action" });

		// No positive event to await here — assert the absence stays stable
		// rather than racing a `vi.waitFor` that would only prove impatience.
		await new Promise((resolve) => setTimeout(resolve, 500));
		const rows = await sql`
			SELECT 1 FROM audit.action_log
			WHERE user_id = ${USER_ID} AND action = 'notification.enqueue'
		`;
		expect(rows).toHaveLength(0);
	});
});
