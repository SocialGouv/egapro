-- Replace date column with year (integer) in export table
ALTER TABLE "app_export" DROP CONSTRAINT IF EXISTS "export_date_version_idx";
--> statement-breakpoint
ALTER TABLE "app_export" DROP COLUMN IF EXISTS "date";
--> statement-breakpoint
ALTER TABLE "app_export" ADD COLUMN "year" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "app_export" ALTER COLUMN "year" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "app_export" ADD CONSTRAINT "export_year_version_idx" UNIQUE("year","version");
