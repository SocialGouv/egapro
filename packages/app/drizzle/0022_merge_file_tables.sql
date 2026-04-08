-- Merge cse_opinion_file and joint_evaluation_file into a single file table

-- Step 1: Create the enum type (idempotent)
DO $$ BEGIN
	CREATE TYPE "public"."file_type" AS ENUM ('cse_opinion', 'joint_evaluation');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create the new unified table (idempotent)
CREATE TABLE IF NOT EXISTS "app_file" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"declaration_id" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"type" "file_type" NOT NULL
);

-- Step 3: Migrate data from cse_opinion_file (skip if source table gone or data already migrated)
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_cse_opinion_file')
	   AND NOT EXISTS (SELECT 1 FROM "app_file" WHERE "type" = 'cse_opinion' LIMIT 1) THEN
		INSERT INTO "app_file" ("id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", "type")
		SELECT "id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", 'cse_opinion'
		FROM "app_cse_opinion_file";
	END IF;
END $$;

-- Step 4: Migrate data from joint_evaluation_file (skip if source table gone or data already migrated)
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_joint_evaluation_file')
	   AND NOT EXISTS (SELECT 1 FROM "app_file" WHERE "type" = 'joint_evaluation' LIMIT 1) THEN
		INSERT INTO "app_file" ("id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", "type")
		SELECT "id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", 'joint_evaluation'
		FROM "app_joint_evaluation_file";
	END IF;
END $$;

-- Step 5: Add FK constraint (idempotent)
DO $$ BEGIN
	ALTER TABLE "app_file"
		ADD CONSTRAINT "app_file_declaration_id_app_declaration_id_fk"
		FOREIGN KEY ("declaration_id")
		REFERENCES "public"."app_declaration"("id")
		ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Step 6: Create index on declaration_id (idempotent)
CREATE INDEX IF NOT EXISTS "file_declaration_idx" ON "app_file" USING btree ("declaration_id");

-- Step 7: Create partial unique index (one joint_evaluation file per declaration, idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "file_joint_eval_unique" ON "app_file" USING btree ("declaration_id") WHERE "type" = 'joint_evaluation';

-- Step 8: Drop the junction table (idempotent)
DROP TABLE IF EXISTS "app_cse_opinion_file_link";

-- Step 9: Drop old tables (idempotent)
DROP TABLE IF EXISTS "app_cse_opinion_file" CASCADE;
DROP TABLE IF EXISTS "app_joint_evaluation_file" CASCADE;
