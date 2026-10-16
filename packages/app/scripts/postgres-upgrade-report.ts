import { z } from "zod";

export const APPLICATION_TABLES = [
	"app_user",
	"app_company",
	"app_user_company",
	"app_declaration",
	"app_declaration_status_history",
	"app_declaration_lock",
	"app_job_category",
	"app_employee_category",
	"app_gip_mds_data",
	"app_cse_opinion",
	"app_file",
	"app_cse_opinion_file",
	"app_campaign_deadline",
	"app_representation_campaign",
	"app_representation_declaration",
	"app_global_setting",
	"app_admin_impersonation_event",
	"app_referent",
	"app_export",
	"audit.action_log",
] as const;
export const NOTIFICATION_TABLES = [
	"version",
	"queue",
	"schedule",
	"subscription",
	"job",
] as const;
const countSchema = z.string().regex(/^(0|[1-9][0-9]*)$/);
const digestSchema = z.string().regex(/^[a-f0-9]{32}$/);
const tableSchema = z.strictObject({
	present: z.boolean(),
	rows: countSchema.nullable(),
	structure: digestSchema.nullable(),
});
const journalSchema = z.strictObject({
	rows: countSchema,
	digest: digestSchema,
});

export const reportSchema = z
	.strictObject({
		format: z.literal(1),
		scope: z.uuid(),
		database: z.enum(["application", "notifications"]),
		writesStopped: z.literal(true),
		capturedAt: z.iso.datetime(),
		serverVersion: z.number().int().min(100000).max(999999),
		tables: z.record(z.string(), tableSchema),
		journal: journalSchema.nullable(),
	})
	.superRefine((report, context) => {
		const expected =
			report.database === "application"
				? APPLICATION_TABLES
				: NOTIFICATION_TABLES;
		if (
			Object.keys(report.tables).length !== expected.length ||
			expected.some((table) => !Object.hasOwn(report.tables, table))
		) {
			context.addIssue({ code: "custom", message: "Invalid table inventory" });
		}
		for (const table of Object.values(report.tables)) {
			if (
				table.present !== (table.rows !== null && table.structure !== null) ||
				(!table.present && (table.rows !== null || table.structure !== null))
			) {
				context.addIssue({ code: "custom", message: "Invalid table state" });
			}
		}
	});
export type UpgradeReport = z.infer<typeof reportSchema>;
export type DatabaseKind = UpgradeReport["database"];

export function parseReport(value: unknown): UpgradeReport {
	const parsed = reportSchema.safeParse(value);
	if (!parsed.success) throw new Error("Rapport invalide ou incompatible.");
	return parsed.data;
}

export function reportProblems(report: UpgradeReport): string[] {
	return [
		...Object.entries(report.tables)
			.filter(([, table]) => !table.present)
			.map(([name]) => `Table critique absente : ${name}.`),
		...(!report.journal || report.journal.rows === "0"
			? ["Journal de migrations absent ou vide."]
			: []),
	];
}

/** Frozen writes are a prerequisite: any difference other than version/time fails. */
export function compareReports(
	beforeValue: unknown,
	afterValue: unknown,
	expectedMajor: number,
): string[] {
	const before = parseReport(beforeValue);
	const after = parseReport(afterValue);
	if (
		!Number.isInteger(expectedMajor) ||
		expectedMajor < 10 ||
		expectedMajor > 99
	)
		throw new Error("Version majeure attendue invalide.");
	if (before.scope !== after.scope || before.database !== after.database)
		return ["Les captures concernent des périmètres différents."];
	return [
		...reportProblems(before),
		...reportProblems(after),
		...(Math.floor(after.serverVersion / 10000) !== expectedMajor
			? ["La version serveur ne correspond pas à la cible attendue."]
			: []),
		...(Date.parse(after.capturedAt) < Date.parse(before.capturedAt)
			? ["Les captures ne sont pas dans l’ordre chronologique."]
			: []),
		...Object.entries(before.tables).flatMap(([name, table]) => {
			const next = after.tables[name];
			return [
				...(table.structure !== next?.structure
					? [`Structure modifiée : ${name}.`]
					: []),
				...(table.rows !== next?.rows
					? [`Comptage modifié pendant l’arrêt des écritures : ${name}.`]
					: []),
			];
		}),
		...(JSON.stringify(before.journal) !== JSON.stringify(after.journal)
			? ["Journal de migrations modifié."]
			: []),
	];
}
