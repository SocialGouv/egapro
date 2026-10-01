import type { Sql } from "postgres";
import { describe, expect, it, vi } from "vitest";

import { logAuditMain, type AuditRow } from "../auditLog.js";

function sqlCapture() {
	const calls: { query: string; values: unknown[] }[] = [];
	const sql = Object.assign(
		(strings: TemplateStringsArray, ...values: unknown[]) => {
			calls.push({ query: strings.join("?"), values });
			return Promise.resolve([]);
		},
		{ json: (value: unknown) => value },
	) as unknown as Sql;
	return { sql, calls };
}

describe("logAuditMain", () => {
	it("keeps only controlled audit fields and metadata", async () => {
		const { sql, calls } = sqlCapture();
		const row = {
			status: "success",
			userId: "11111111-1111-4111-8111-111111111111",
			userEmail: "rh@example.fr",
			siren: "552100554",
			resourceId: "22222222-2222-4222-8222-222222222222",
			errorMessage: "rh@example.fr",
			metadata: {
				type: "joint_evaluation_submitted",
				attempt: 2,
				poisonPill: false,
				messageId: "provider-1",
				recipientEmail: "rh@example.fr",
			},
		} as unknown as AuditRow;

		await logAuditMain(sql, row);

		expect(calls).toHaveLength(1);
		expect(calls[0]?.query).toContain("INSERT INTO audit.action_log");
		expect(calls[0]?.query).not.toContain("user_email");
		expect(calls[0]?.values.slice(2)).toEqual([
			"notification.send",
			"system",
			"success",
			"11111111-1111-4111-8111-111111111111",
			"552100554",
			"notification",
			"22222222-2222-4222-8222-222222222222",
			null,
			{ type: "joint_evaluation_submitted", attempt: 2, poisonPill: false },
		]);
		expect(JSON.stringify(calls[0])).not.toContain("rh@example.fr");
		expect(JSON.stringify(calls[0])).not.toContain("provider-1");
	});

	it("bounds attempts and replaces unknown errors with a stable code", async () => {
		const { sql, calls } = sqlCapture();
		await logAuditMain(sql, {
			status: "failure",
			errorCode: "mail to rh@example.fr failed" as AuditRow["errorCode"],
			metadata: {
				type: "rh@example.fr" as never,
				attempt: 2000,
				poisonPill: true,
			},
		});
		expect(calls[0]?.values.at(-2)).toBe("notification_failed");
		expect(calls[0]?.values.at(-1)).toEqual({
			attempt: 1000,
			poisonPill: true,
		});
	});

	it("rejects non-technical identifiers at the SQL boundary", async () => {
		const { sql, calls } = sqlCapture();
		await logAuditMain(sql, {
			status: "failure",
			userId: "rh@example.fr",
			siren: "123456789; DROP TABLE audit.action_log",
			resourceId: "rh@example.fr",
			errorCode: "invalid_job",
		});
		expect(calls[0]?.values.slice(5, 9)).toEqual([
			null,
			null,
			"notification",
			null,
		]);
	});

	it("normalizes an unexpected status before insertion", async () => {
		const { sql, calls } = sqlCapture();
		await logAuditMain(sql, {
			status: "rh@example.fr" as AuditRow["status"],
		});
		expect(calls[0]?.values[4]).toBe("failure");
		expect(calls[0]?.values.at(-2)).toBe("notification_failed");
	});

	it("does not write when the main database is unavailable", async () => {
		await expect(
			logAuditMain(null, { status: "success" }),
		).resolves.toBeUndefined();
	});

	it("does not let an audit insert failure interrupt the job", async () => {
		const error = new Error("database down for rh@example.fr");
		const sql = Object.assign(() => Promise.reject(error), {
			json: (value: unknown) => value,
		}) as unknown as Sql;
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		await expect(
			logAuditMain(sql, { status: "failure", errorCode: "invalid_job" }),
		).resolves.toBeUndefined();
		expect(consoleSpy).toHaveBeenCalledWith(
			"[notifications] audit insert failed",
		);
		consoleSpy.mockRestore();
	});
});
