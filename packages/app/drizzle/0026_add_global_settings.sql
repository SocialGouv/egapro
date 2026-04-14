-- Add optional campaign milestone dates to the per-year campaign_deadline table.
ALTER TABLE "app_campaign_deadline"
  ADD COLUMN IF NOT EXISTS "gip_publication_date" date;
--> statement-breakpoint
ALTER TABLE "app_campaign_deadline"
  ADD COLUMN IF NOT EXISTS "campaign_start_date" date;
--> statement-breakpoint

-- Create the singleton global_setting table used for platform-wide variables
-- (currently: the active campaign year). Access is gated by adminProcedure.
CREATE TABLE IF NOT EXISTS "app_global_setting" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "active_campaign_year" integer,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by" varchar(255) REFERENCES "app_user"("id") ON DELETE SET NULL
);
