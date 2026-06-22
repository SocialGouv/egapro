CREATE TYPE "public"."compliance_path" AS ENUM('justify', 'corrective_action', 'joint_evaluation');--> statement-breakpoint
CREATE TYPE "public"."declaration_status" AS ENUM('draft', 'awaiting_compliance_path_choice', 'corrective_actions_chosen', 'joint_evaluation_chosen', 'awaiting_revision_choice', 'revised_joint_evaluation_chosen', 'awaiting_cse_opinion', 'demarche_completed');--> statement-breakpoint
ALTER TABLE "app_declaration" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."declaration_status";--> statement-breakpoint
ALTER TABLE "app_declaration" ALTER COLUMN "status" SET DATA TYPE "public"."declaration_status" USING "status"::"public"."declaration_status";--> statement-breakpoint
ALTER TABLE "app_declaration" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "first_declaration_path_choice" "compliance_path";--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_declaration_path_choice" "compliance_path";--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "first_declaration_path_choice_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_declaration_path_choice_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_declaration_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "joint_evaluation_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "demarche_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "phase2_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "phase2_revision_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "cse_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_g_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "rules_version" varchar DEFAULT '2027.1' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "compliance_path";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "second_declaration_status";--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "compliance_completed_at";