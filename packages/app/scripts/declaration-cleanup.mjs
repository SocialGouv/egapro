import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const DECLARATION_CLEANUP_ACTION = "system.declaration_cleanup";
const DECLARATION_CLEANUP_CATEGORY = "system";
const DEFAULT_RETENTION_YEARS = 6;

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const {
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_HOST,
		POSTGRES_PORT,
		POSTGRES_DB,
		POSTGRES_SSLMODE,
	} = process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = encodeURIComponent(POSTGRES_USER ?? "postgres");
		const password = POSTGRES_PASSWORD
			? `:${encodeURIComponent(POSTGRES_PASSWORD)}`
			: "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	throw new Error("DATABASE_URL or POSTGRES_HOST+POSTGRES_DB must be set");
}

function toPositiveInt(raw, fallback) {
	if (raw === undefined || raw === null || raw === "") return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
		throw new Error(
			`Invalid retention value: "${raw}". Expected a positive integer.`,
		);
	}
	return n;
}

export async function runDeclarationCleanup({
	sql,
	retentionYears,
	now = new Date(),
	deleteObject,
}) {
	const cutoffYear = now.getUTCFullYear() - retentionYears;

	const { s3Keys, purgedDeclarations, purgedFiles } = await sql.begin(
		async (txRaw) => {
			// postgres-js TransactionSql strips call signatures via Omit — cast back to Sql
			const tx = /** @type {import("postgres").Sql} */ (
				/** @type {unknown} */ (txRaw)
			);

			const eligibleRows = await tx`
				SELECT id FROM app_declaration WHERE year < ${cutoffYear}
			`;
			const ids = eligibleRows.map((r) => r.id);

			if (ids.length === 0) {
				return { s3Keys: [], purgedDeclarations: 0, purgedFiles: 0 };
			}

			const fileRows = await tx`
				SELECT file_path FROM app_file WHERE declaration_id = ANY(${ids})
			`;
			const collectedKeys = fileRows.map((r) => r.file_path);

			await tx`
				DELETE FROM app_employee_category
				WHERE job_category_id IN (
					SELECT id FROM app_job_category WHERE declaration_id = ANY(${ids})
				)
			`;
			await tx`DELETE FROM app_job_category WHERE declaration_id = ANY(${ids})`;
			await tx`DELETE FROM app_cse_opinion_file WHERE declaration_id = ANY(${ids})`;
			await tx`DELETE FROM app_cse_opinion WHERE declaration_id = ANY(${ids})`;
			const fileResult =
				await tx`DELETE FROM app_file WHERE declaration_id = ANY(${ids})`;
			// app_declaration_status_history and app_declaration_lock cascade on delete
			const declResult =
				await tx`DELETE FROM app_declaration WHERE id = ANY(${ids})`;

			return {
				s3Keys: collectedKeys,
				purgedDeclarations: Number(declResult.count ?? 0),
				purgedFiles: Number(fileResult.count ?? 0),
			};
		},
	);

	let purgedS3Objects = 0;
	let failedS3Objects = 0;
	// S3 deletion is outside the transaction — S3 is not rollbackable, and a
	// failure deleting an object must not undo committed DB deletes (RGPD data
	// is already gone). Best-effort: log each error but keep going.
	for (const key of s3Keys) {
		try {
			await deleteObject(key);
			purgedS3Objects++;
		} catch (s3Error) {
			failedS3Objects++;
			console.error(`[declaration-cleanup] S3 delete failed for key ${key}:`, s3Error);
		}
	}

	// Self-audit runs outside the transaction for the same reason: a failure to
	// insert the audit row must not roll back completed deletions.
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, metadata)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${DECLARATION_CLEANUP_ACTION},
				${DECLARATION_CLEANUP_CATEGORY},
				'success',
				${sql.json({
					purgedDeclarations,
					purgedFiles,
					purgedS3Objects,
					failedS3Objects,
					retentionYears,
					cutoffYear,
				})}
			)
		`;
	} catch (auditError) {
		console.error(
			"[declaration-cleanup] Cleanup succeeded but self-audit insert failed:",
			auditError,
		);
	}

	return { purgedDeclarations, purgedFiles, purgedS3Objects, failedS3Objects };
}

async function logFailure(sql, error) {
	const message = error instanceof Error ? error.message : "Unknown error";
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, error_message)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${DECLARATION_CLEANUP_ACTION},
				${DECLARATION_CLEANUP_CATEGORY},
				'failure',
				${message}
			)
		`;
	} catch (auditError) {
		console.error(
			"[declaration-cleanup] Failed to record failure in audit log:",
			auditError,
		);
	}
}

const isMain = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	// realpathSync resolves symlinks from pnpm content-addressable store or Docker bind-mounts
	try {
		return fileURLToPath(import.meta.url) === realpathSync(entry);
	} catch {
		return false;
	}
})();

if (isMain) {
	const { DeleteObjectCommand, S3Client } = await import(
		"@aws-sdk/client-s3"
	);

	const retentionYears = toPositiveInt(
		process.env.EGAPRO_DECLARATION_RETENTION_YEARS,
		DEFAULT_RETENTION_YEARS,
	);

	const {
		S3_ENDPOINT,
		S3_REGION,
		S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY,
		S3_BUCKET_NAME,
	} = process.env;

	if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET_NAME) {
		console.error("[declaration-cleanup] Missing required S3 environment variables");
		process.exit(1);
	}

	const s3Client = new S3Client({
		endpoint: S3_ENDPOINT,
		region: S3_REGION,
		credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
		forcePathStyle: true,
	});

	const sql = postgres(getDatabaseUrl(), { max: 1 });

	try {
		const result = await runDeclarationCleanup({
			sql,
			retentionYears,
			deleteObject: (key) =>
				s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key })),
		});
		console.log(
			`[declaration-cleanup] Success — purgedDeclarations=${result.purgedDeclarations} purgedFiles=${result.purgedFiles} purgedS3Objects=${result.purgedS3Objects} failedS3Objects=${result.failedS3Objects}`,
		);
		await sql.end();
		process.exit(0);
	} catch (error) {
		console.error("[declaration-cleanup] Failed:", error);
		await logFailure(sql, error);
		await sql.end();
		process.exit(1);
	}
}
