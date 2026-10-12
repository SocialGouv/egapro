import type { AuditMetadata } from "~/modules/audit";

export const AUDIT_TEXT_MAX_LENGTH = 200;
export const AUDIT_LIST_MAX_ITEMS = 20;

export type QueryParseResult<T> =
	| { success: true; data: T }
	| {
			success: false;
			error: { issues: readonly { path: readonly PropertyKey[] }[] };
	  };

export function auditText(value: string | null | undefined): string | null {
	return value ? value.slice(0, AUDIT_TEXT_MAX_LENGTH) : null;
}

export function auditList(values: readonly string[] | undefined): string[] {
	return (values ?? [])
		.slice(0, AUDIT_LIST_MAX_ITEMS)
		.map((value) => value.slice(0, AUDIT_TEXT_MAX_LENGTH));
}

export function auditQueryMetadata<T>(
	parsed: QueryParseResult<T>,
	project: (data: T) => AuditMetadata,
): AuditMetadata {
	if (parsed.success) return project(parsed.data);
	const key = parsed.error.issues[0]?.path[0];
	return { invalidParam: typeof key === "string" ? key : "query" };
}
