ALTER TABLE "app_declaration" ADD COLUMN "cancelled_at" timestamp;
--> statement-breakpoint
ALTER TABLE "app_declaration" DROP CONSTRAINT "declaration_siren_year_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "declarations_siren_year_active_unique" ON "app_declaration" USING btree ("siren","year") WHERE cancelled_at IS NULL;
