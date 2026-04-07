-- Merge cse_opinion_file and joint_evaluation_file into a single file table

-- Step 1: Create the enum type
CREATE TYPE "public"."file_type" AS ENUM ('cse_opinion', 'joint_evaluation');

-- Step 2: Create the new unified table
CREATE TABLE "app_file" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"declaration_id" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"type" "file_type" NOT NULL
);

-- Step 3: Migrate data from cse_opinion_file
INSERT INTO "app_file" ("id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", "type")
SELECT "id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", 'cse_opinion'
FROM "app_cse_opinion_file";

-- Step 4: Migrate data from joint_evaluation_file
INSERT INTO "app_file" ("id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", "type")
SELECT "id", "declaration_id", "file_name", "file_path", "uploaded_at", "created_at", 'joint_evaluation'
FROM "app_joint_evaluation_file";

-- Step 5: Add FK constraint
ALTER TABLE "app_file"
	ADD CONSTRAINT "app_file_declaration_id_app_declaration_id_fk"
	FOREIGN KEY ("declaration_id")
	REFERENCES "public"."app_declaration"("id")
	ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 6: Create index on declaration_id
CREATE INDEX "file_declaration_idx" ON "app_file" USING btree ("declaration_id");

-- Step 7: Create partial unique index (one joint_evaluation file per declaration)
CREATE UNIQUE INDEX "file_joint_eval_unique" ON "app_file" ("declaration_id") WHERE "type" = 'joint_evaluation';

-- Step 8: Drop the junction table (never queried in application code)
DROP TABLE "app_cse_opinion_file_link";

-- Step 9: Drop old tables
DROP TABLE "app_cse_opinion_file";
DROP TABLE "app_joint_evaluation_file";
