import { index, pgTableCreator } from "drizzle-orm/pg-core";

export const createNotificationTable = pgTableCreator(
	(name) => `notification_${name}`,
);

export const notifications = createNotificationTable(
	"queue",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		type: d.varchar({ length: 64 }).notNull(),
		channel: d.varchar({ length: 16 }).notNull().default("email"),
		recipientEmail: d.varchar({ length: 320 }).notNull(),
		recipientUserId: d.varchar({ length: 255 }),
		siren: d.varchar({ length: 9 }),
		payload: d.jsonb().notNull(),
		status: d.varchar({ length: 20 }).notNull().default("pending"),
		attemptCount: d.integer().notNull().default(0),
		maxAttempts: d.integer().notNull().default(5),
		scheduledFor: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		nextRetryAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		lastError: d.text(),
		sentAt: d.timestamp({ withTimezone: true }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
	}),
	(t) => [
		index("notification_queue_pending_idx").on(t.status, t.nextRetryAt),
		index("notification_queue_recipient_idx").on(
			t.recipientUserId,
			t.createdAt,
		),
		index("notification_queue_type_created_idx").on(t.type, t.createdAt),
	],
);

export const notificationLogs = createNotificationTable(
	"send_log",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		notificationId: d.varchar({ length: 255 }).notNull(),
		attempt: d.integer().notNull(),
		status: d.varchar({ length: 20 }).notNull(),
		errorMessage: d.text(),
		messageId: d.varchar({ length: 512 }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.notNull()
			.$defaultFn(() => new Date()),
	}),
	(t) => [
		index("notification_send_log_notif_idx").on(t.notificationId, t.createdAt),
	],
);
