-- Add dedicated `audit` schema and `audit.action_log` table for issue #3174.
-- Hand-written migration following the pattern of 0020-0022 (idempotent).

-- Step 1: Create the dedicated audit schema (idempotent)
CREATE SCHEMA IF NOT EXISTS "audit";

-- Step 2: Create the action_log table (idempotent)
CREATE TABLE IF NOT EXISTS "audit"."action_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"user_id" varchar(255),
	"user_email" varchar(255),
	"siren" varchar(9),
	"action" varchar(100) NOT NULL,
	"category" varchar(20) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" varchar(255),
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"duration_ms" integer
);

-- Step 3: Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS "action_log_created_at_idx" ON "audit"."action_log" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "action_log_user_idx" ON "audit"."action_log" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "action_log_siren_idx" ON "audit"."action_log" USING btree ("siren", "created_at");
CREATE INDEX IF NOT EXISTS "action_log_action_idx" ON "audit"."action_log" USING btree ("action", "created_at");
CREATE INDEX IF NOT EXISTS "action_log_category_created_at_idx" ON "audit"."action_log" USING btree ("category", "created_at");
