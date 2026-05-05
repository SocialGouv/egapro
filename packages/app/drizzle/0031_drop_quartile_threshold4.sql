-- DESTRUCTIVE IRREVERSIBLE: drops 4 obsolete quartile threshold columns
-- See epic #3349 — refonte étape 4 (4 → 3 seuils)
ALTER TABLE "app_declaration" DROP COLUMN "indicator_f_annual_threshold4";
--> statement-breakpoint
ALTER TABLE "app_declaration" DROP COLUMN "indicator_f_hourly_threshold4";
--> statement-breakpoint
ALTER TABLE "app_gip_mds_data" DROP COLUMN "annual_quartile_threshold4";
--> statement-breakpoint
ALTER TABLE "app_gip_mds_data" DROP COLUMN "hourly_quartile_threshold4";
