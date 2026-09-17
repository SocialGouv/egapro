CREATE TYPE "public"."receipt_kind" AS ENUM('declaration', 'secondDeclaration', 'cseOpinion', 'jointEvaluation', 'representation');--> statement-breakpoint
CREATE TYPE "public"."receipt_outbox_status" AS ENUM('pending', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "app_receipt_outbox" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"kind" "receipt_kind" NOT NULL,
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"status" "receipt_outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "receipt_outbox_unsettled_idx" ON "app_receipt_outbox" USING btree ("status","updated_at") WHERE "status" IN ('pending', 'sending');