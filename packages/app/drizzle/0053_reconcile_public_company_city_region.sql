ALTER TABLE "app_company" ADD COLUMN IF NOT EXISTS "city" varchar(255);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN IF NOT EXISTS "region_code" varchar(3);
