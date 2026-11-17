ALTER TABLE "app_declaration" ADD COLUMN "has_cse" boolean;--> statement-breakpoint
UPDATE "app_declaration" AS d SET "has_cse" = c."has_cse" FROM "app_company" AS c WHERE d."siren" = c."siren";
