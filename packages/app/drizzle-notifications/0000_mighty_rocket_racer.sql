CREATE TABLE "notification_send_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"notification_id" varchar(255) NOT NULL,
	"attempt" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"message_id" varchar(512),
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(64) NOT NULL,
	"channel" varchar(16) DEFAULT 'email' NOT NULL,
	"recipient_email" varchar(320) NOT NULL,
	"recipient_user_id" varchar(255),
	"siren" varchar(9),
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"next_retry_at" timestamp with time zone NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notification_send_log_notif_idx" ON "notification_send_log" USING btree ("notification_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_queue_pending_idx" ON "notification_queue" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "notification_queue_recipient_idx" ON "notification_queue" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_queue_type_created_idx" ON "notification_queue" USING btree ("type","created_at");