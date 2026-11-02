CREATE TYPE "public"."gap_justification" AS ENUM('all', 'partial', 'none');--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "first_declaration_gap_justification" "gap_justification";--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_declaration_gap_justification" "gap_justification";--> statement-breakpoint
UPDATE "app_declaration" SET "first_declaration_gap_justification" = 'all' WHERE "first_declaration_path_choice" = 'justify';--> statement-breakpoint
UPDATE "app_declaration" SET "second_declaration_gap_justification" = 'all' WHERE "second_declaration_path_choice" = 'justify';
