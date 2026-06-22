ALTER TABLE "app_declaration" DROP CONSTRAINT IF EXISTS "declaration_siren_year_idx";--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "declarations_siren_year_active_unique" ON "app_declaration" USING btree ("siren","year") WHERE cancelled_at IS NULL;