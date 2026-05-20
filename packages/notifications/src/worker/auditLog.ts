import type { Sql } from "postgres";

export type SerializableJson =
	| null
	| string
	| number
	| boolean
	| Date
	| { [key: string]: SerializableJson }
	| SerializableJson[];

export type AuditRow = {
	action: string;
	category: string;
	status: "success" | "failure";
	userId?: string | null;
	userEmail?: string | null;
	siren?: string | null;
	resourceType?: string | null;
	resourceId?: string | null;
	errorMessage?: string | null;
	metadata?: SerializableJson;
};

export async function logAuditMain(
	mainSql: Sql | null,
	row: AuditRow,
): Promise<void> {
	if (!mainSql) return;
	try {
		await mainSql`
			INSERT INTO audit.action_log (
				id, created_at, action, category, status,
				user_id, user_email, siren, resource_type, resource_id,
				error_message, metadata
			)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${row.action},
				${row.category},
				${row.status},
				${row.userId ?? null},
				${row.userEmail ?? null},
				${row.siren ?? null},
				${row.resourceType ?? null},
				${row.resourceId ?? null},
				${row.errorMessage ?? null},
				${mainSql.json(row.metadata ?? null)}
			)
		`;
	} catch (auditError) {
		console.error("[notifications] audit insert failed:", auditError);
	}
}
