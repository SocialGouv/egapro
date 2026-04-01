-- Drop redundant columns from user table
-- name: concat of firstName+lastName, redundant with those two columns
-- siret: already stored in user_company link table
-- image: always null (ProConnect does not provide an image)
ALTER TABLE "app_user" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "app_user" DROP COLUMN IF EXISTS "siret";--> statement-breakpoint
ALTER TABLE "app_user" DROP COLUMN IF EXISTS "image";
