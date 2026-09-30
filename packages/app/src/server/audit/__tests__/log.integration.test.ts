import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { logAction } from "../log";

type AuditRow = {
	action: string;
	status: string;
	user_id: string | null;
	user_email: string | null;
	siren: string | null;
	ip_address: string | null;
	user_agent: string | null;
	error_message: string | null;
	metadata: Record<string, unknown> | null;
	created_at: Date;
};

describe("logAction persistence (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM audit.action_log`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM audit.action_log`;
	});

	it("persists attribution and controlled fields without free text", async () => {
		await logAction({
			action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
			status: "failure",
			userId: "user-1",
			userEmail: "person@example.com",
			siren: "123456789",
			ipAddress: "203.0.113.45",
			userAgent: "PrivateAgent",
			errorMessage: "BAD_REQUEST: private@example.com",
			metadata: {
				year: 2026,
				fileName: "private.pdf",
				nested: { secret: true },
			},
		});

		const rows = await sql<AuditRow[]>`
			SELECT action, status, user_id, user_email, siren, ip_address,
				user_agent, error_message, metadata, created_at
			FROM audit.action_log
		`;
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			action: AUDIT_ACTIONS.DECLARATION_SUBMIT,
			status: "failure",
			user_id: "user-1",
			user_email: null,
			siren: "123456789",
			ip_address: "203.0.0.0",
			user_agent: null,
			error_message: "BAD_REQUEST",
			metadata: { year: 2026 },
		});
		expect(rows[0]?.created_at).toBeInstanceOf(Date);
	});
});
