-- Create referent type enum and referents table for admin referent management (issue #3182)
DO $$ BEGIN
	CREATE TYPE "public"."referent_type" AS ENUM('email', 'url');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "app_referent" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"region" varchar(3) NOT NULL,
	"county" varchar(3),
	"name" varchar(255) NOT NULL,
	"type" "referent_type" NOT NULL,
	"value" varchar(500) NOT NULL,
	"principal" boolean DEFAULT false NOT NULL,
	"substitute_name" varchar(255),
	"substitute_email" varchar(255),
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "referent_region_idx" ON "app_referent" USING btree ("region");
