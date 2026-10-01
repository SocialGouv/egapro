import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { logAuditMain } from "../auditLog.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!testDatabaseUrl)("logAuditMain PostgreSQL", () => {
	it("writes a minimized row to the real audit table", async () => {
		const sql = postgres(testDatabaseUrl as string);
		const resourceId = crypto.randomUUID();
		try {
			await logAuditMain(sql, {
				status: "failure",
				userId: "11111111-1111-4111-8111-111111111111",
				siren: "552100554",
				resourceId,
				errorCode: "mail_transport_failed",
				metadata: { type: "joint_evaluation_submitted", attempt: 2 },
			});
			const [row] = await sql`
				SELECT action, category, status, user_id, user_email, siren,
					resource_type, resource_id, error_message, metadata
				FROM audit.action_log WHERE resource_id = ${resourceId}
			`;
			expect(row).toMatchObject({
				action: "notification.send",
				category: "system",
				status: "failure",
				user_id: "11111111-1111-4111-8111-111111111111",
				user_email: null,
				siren: "552100554",
				resource_type: "notification",
				resource_id: resourceId,
				error_message: "mail_transport_failed",
				metadata: { type: "joint_evaluation_submitted", attempt: 2 },
			});
		} finally {
			await sql`DELETE FROM audit.action_log WHERE resource_id = ${resourceId}`;
			await sql.end();
		}
	});
});
