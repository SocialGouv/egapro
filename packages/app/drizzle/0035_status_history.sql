CREATE TYPE "public"."declaration_event_type" AS ENUM('submit', 'path_choice', 'second_declaration_submit', 'joint_evaluation_submit', 'cse_opinion_submit', 'cancel', 'demarche_complete');--> statement-breakpoint
CREATE TABLE "app_declaration_status_history" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"declaration_id" varchar(255) NOT NULL,
	"event_type" "declaration_event_type" NOT NULL,
	"value" varchar(50),
	"round" integer,
	"actor_user_id" varchar(255),
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DROP INDEX "declaration_submitted_at_idx";--> statement-breakpoint
ALTER TABLE "app_declaration_status_history" ADD CONSTRAINT "app_declaration_status_history_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_declaration_status_history" ADD CONSTRAINT "app_declaration_status_history_actor_user_id_app_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decl_status_history_declaration_idx" ON "app_declaration_status_history" USING btree ("declaration_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "first_declaration_path_choice_at";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "second_declaration_path_choice_at";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "second_declaration_submitted_at";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "joint_evaluation_submitted_at";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "demarche_completed_at";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "cse_opinion_completed_at";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "phase2_required";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "phase2_revision_required";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "indicator_g_required";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "submitted_at";