import { index, pgSchema } from "drizzle-orm/pg-core";

/**
 * Dedicated PostgreSQL schema for audit logs.
 *
 * Kept separate from the application schema (`public.app_*`) to:
 * - decouple audit data from business tables (no FK to app.users — keeps GDPR
 *   user deletion unblocked)
 * - allow direct SQL queries on audit data without polluting the app schema
 * - apply different retention rules per audit category
 */
export const auditSchema = pgSchema("audit");

/**
 * action_log — append-only table tracking every auditable action.
 *
 * Columns are kept loosely typed (varchar) to avoid schema migrations every
 * time a new action key or category is introduced. Validation happens in the
 * application layer (`~/modules/audit`).
 */
export const actionLogs = auditSchema.table(
	"action_log",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		createdAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		// User context — denormalized (no FK) so logs survive GDPR user deletion
		userId: d.varchar({ length: 255 }),
		userEmail: d.varchar({ length: 255 }),
		// Company context (when applicable)
		siren: d.varchar({ length: 9 }),
		// Action identification
		action: d.varchar({ length: 100 }).notNull(),
		category: d.varchar({ length: 20 }).notNull(),
		// Resource targeted by the action (when applicable)
		resourceType: d.varchar({ length: 50 }),
		resourceId: d.varchar({ length: 255 }),
		// Outcome
		status: d.varchar({ length: 20 }).notNull(),
		errorMessage: d.text(),
		// Action payload — stripped of sensitive technical fields (tokens, S3 keys)
		metadata: d.jsonb(),
		// Request context
		ipAddress: d.varchar({ length: 45 }),
		userAgent: d.text(),
		durationMs: d.integer(),
	}),
	(t) => [
		index("action_log_created_at_idx").on(t.createdAt),
		index("action_log_user_idx").on(t.userId, t.createdAt),
		index("action_log_siren_idx").on(t.siren, t.createdAt),
		index("action_log_action_idx").on(t.action, t.createdAt),
		// Used by the cleanup cron job (delete WHERE category = ... AND createdAt < ...)
		index("action_log_category_created_at_idx").on(t.category, t.createdAt),
	],
);
