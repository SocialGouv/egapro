import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import postgres from "postgres";

/** @typedef {import("postgres").Sql} Sql */

const DECLARATION_CLEANUP_ACTION = "system.declaration_cleanup";
const DECLARATION_CLEANUP_CATEGORY = "system";
const DEFAULT_RETENTION_YEARS = 6;

/** @returns {string} */
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

/**
 * @param {string | undefined} raw
 * @param {number} fallback
 * @returns {number}
 */
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

/**
 * @param {Object} args
 * @param {Sql} args.sql
 * @param {number} args.retentionYears
 * @param {Date} [args.now]
 * @param {(key: string) => Promise<void>} args.deleteObject
 */
export async function runDeclarationCleanup({
	sql,
	retentionYears,
	now = new Date(),
	deleteObject,
}) {
	const cutoffYear = now.getUTCFullYear() - retentionYears;

	const txResult = await sql.begin(async (txRaw) => {
		const tx = /** @type {Sql} */ (/** @type {unknown} */ (txRaw));

		const idRows = await tx`
			SELECT id FROM app_declaration WHERE year < ${cutoffYear}
		`;

		if (idRows.length === 0) {
			return { purgedDeclarations: 0, purgedFiles: 0, s3Keys: [] };
		}

		const ids = idRows.map((r) => r.id);

		// Collect S3 keys before deletion so they survive the commit.
		const fileRows =
			await tx`SELECT file_path FROM app_file WHERE declaration_id = ANY(${ids})`;

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
		const declResult =
			await tx`DELETE FROM app_declaration WHERE id = ANY(${ids})`;

		return {
			purgedDeclarations: Number(declResult.count ?? 0),
			purgedFiles: Number(fileResult.count ?? 0),
			s3Keys: fileRows.map((r) => r.file_path),
		};
	});

	const { purgedDeclarations, purgedFiles, s3Keys } = txResult;

	// S3 deletion runs after commit — S3 is non-rollbackable, so a failure
	// here must not undo the RGPD-compliant DB purge that already committed.
	let purgedS3Objects = 0;
	let failedS3Objects = 0;
	for (const key of s3Keys) {
		try {
			await deleteObject(key);
			purgedS3Objects++;
		} catch (s3Error) {
			console.error(
				`[declaration-cleanup] S3 delete failed for key "${key}":`,
				s3Error,
			);
			failedS3Objects++;
		}
	}

	// Self-audit outside the transaction so a write failure here cannot
	// roll back cleanup work that has already committed.
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

/**
 * @param {Sql} sql
 * @param {unknown} error
 */
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
	try {
		return fileURLToPath(import.meta.url) === realpathSync(entry);
	} catch {
		return false;
	}
})();

if (isMain) {
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

	if (
		!S3_ENDPOINT ||
		!S3_REGION ||
		!S3_ACCESS_KEY_ID ||
		!S3_SECRET_ACCESS_KEY ||
		!S3_BUCKET_NAME
	) {
		console.error(
			"[declaration-cleanup] S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME must be set",
		);
		process.exit(1);
	}

	const s3 = new S3Client({
		endpoint: S3_ENDPOINT,
		region: S3_REGION,
		credentials: {
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_SECRET_ACCESS_KEY,
		},
		forcePathStyle: true,
	});

	const deleteObject = async (/** @type {string} */ key) => {
		await s3.send(
			new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }),
		);
	};

	const sql = postgres(getDatabaseUrl(), { max: 1 });

	try {
		const result = await runDeclarationCleanup({
			sql,
			retentionYears,
			deleteObject,
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
