ALTER TABLE "app_gip_mds_data" ADD COLUMN IF NOT EXISTS "annual_quartile_threshold4" numeric(9, 2);
--> statement-breakpoint
ALTER TABLE "app_gip_mds_data" ADD COLUMN IF NOT EXISTS "hourly_quartile_threshold4" numeric(9, 2);
