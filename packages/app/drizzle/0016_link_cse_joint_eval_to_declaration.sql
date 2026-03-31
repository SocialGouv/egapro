-- Step 1: Add declaration_id column (nullable) to all 3 tables
ALTER TABLE "app_cse_opinion" ADD COLUMN "declaration_id" varchar(255);
ALTER TABLE "app_cse_opinion_file" ADD COLUMN "declaration_id" varchar(255);
ALTER TABLE "app_joint_evaluation_file" ADD COLUMN "declaration_id" varchar(255);

-- Step 2: Backfill declaration_id from existing (siren, year) data
-- CSE opinions use getCseYear() = currentYear + 1, so opinion.year = declaration.year + 1
UPDATE "app_cse_opinion" co
SET "declaration_id" = d."id"
FROM "app_declaration" d
WHERE d."siren" = co."siren" AND d."year" = co."year" - 1;

-- CSE opinion files also use getCseYear()
UPDATE "app_cse_opinion_file" cf
SET "declaration_id" = d."id"
FROM "app_declaration" d
WHERE d."siren" = cf."siren" AND d."year" = cf."year" - 1;

-- Joint evaluation files use getCurrentYear() = same as declaration.year
UPDATE "app_joint_evaluation_file" jf
SET "declaration_id" = d."id"
FROM "app_declaration" d
WHERE d."siren" = jf."siren" AND d."year" = jf."year";

-- Step 3: Delete orphan rows that have no matching declaration
DELETE FROM "app_cse_opinion" WHERE "declaration_id" IS NULL;
DELETE FROM "app_cse_opinion_file" WHERE "declaration_id" IS NULL;
DELETE FROM "app_joint_evaluation_file" WHERE "declaration_id" IS NULL;

-- Step 4: Make declaration_id NOT NULL and add FK constraints
ALTER TABLE "app_cse_opinion" ALTER COLUMN "declaration_id" SET NOT NULL;
ALTER TABLE "app_cse_opinion_file" ALTER COLUMN "declaration_id" SET NOT NULL;
ALTER TABLE "app_joint_evaluation_file" ALTER COLUMN "declaration_id" SET NOT NULL;

ALTER TABLE "app_cse_opinion" ADD CONSTRAINT "app_cse_opinion_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "app_joint_evaluation_file" ADD CONSTRAINT "app_joint_evaluation_file_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE no action ON UPDATE no action;

-- Step 5: Drop old constraints and indexes
ALTER TABLE "app_cse_opinion" DROP CONSTRAINT IF EXISTS "cse_opinion_siren_year_decl_type_idx";
DROP INDEX IF EXISTS "cse_opinion_siren_year_idx";
DROP INDEX IF EXISTS "cse_opinion_file_siren_year_idx";
DROP INDEX IF EXISTS "joint_eval_file_siren_year_idx";

-- Step 6: Drop old FK constraints on siren and declarant_id
ALTER TABLE "app_cse_opinion" DROP CONSTRAINT IF EXISTS "app_cse_opinion_siren_app_company_siren_fk";
ALTER TABLE "app_cse_opinion" DROP CONSTRAINT IF EXISTS "app_cse_opinion_declarant_id_app_user_id_fk";
ALTER TABLE "app_cse_opinion_file" DROP CONSTRAINT IF EXISTS "app_cse_opinion_file_siren_app_company_siren_fk";
ALTER TABLE "app_cse_opinion_file" DROP CONSTRAINT IF EXISTS "app_cse_opinion_file_declarant_id_app_user_id_fk";
ALTER TABLE "app_joint_evaluation_file" DROP CONSTRAINT IF EXISTS "app_joint_evaluation_file_siren_app_company_siren_fk";
ALTER TABLE "app_joint_evaluation_file" DROP CONSTRAINT IF EXISTS "app_joint_evaluation_file_declarant_id_app_user_id_fk";

-- Step 7: Drop old columns
ALTER TABLE "app_cse_opinion" DROP COLUMN "siren";
ALTER TABLE "app_cse_opinion" DROP COLUMN "year";
ALTER TABLE "app_cse_opinion" DROP COLUMN "declarant_id";
ALTER TABLE "app_cse_opinion_file" DROP COLUMN "siren";
ALTER TABLE "app_cse_opinion_file" DROP COLUMN "year";
ALTER TABLE "app_cse_opinion_file" DROP COLUMN "declarant_id";
ALTER TABLE "app_joint_evaluation_file" DROP COLUMN "siren";
ALTER TABLE "app_joint_evaluation_file" DROP COLUMN "year";
ALTER TABLE "app_joint_evaluation_file" DROP COLUMN "declarant_id";

-- Step 8: Add new constraints and indexes
ALTER TABLE "app_cse_opinion" ADD CONSTRAINT "cse_opinion_decl_number_type_idx" UNIQUE("declaration_id","declaration_number","type");
CREATE INDEX "cse_opinion_declaration_idx" ON "app_cse_opinion" USING btree ("declaration_id");
CREATE INDEX "cse_opinion_file_declaration_idx" ON "app_cse_opinion_file" USING btree ("declaration_id");
ALTER TABLE "app_joint_evaluation_file" ADD CONSTRAINT "joint_eval_file_declaration_idx" UNIQUE("declaration_id");
