-- Step 1: Add new indicator columns to declaration
ALTER TABLE "app_declaration" ADD COLUMN "indicator_a_annual_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_a_annual_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_a_hourly_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_a_hourly_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_b_annual_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_b_annual_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_b_hourly_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_b_hourly_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_c_annual_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_c_annual_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_c_hourly_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_c_hourly_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_d_annual_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_d_annual_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_d_hourly_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_d_hourly_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_e_women" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_e_men" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_threshold1" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_threshold2" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_threshold3" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_threshold4" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_women1" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_women2" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_women3" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_women4" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_men1" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_men2" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_men3" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_annual_men4" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_threshold1" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_threshold2" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_threshold3" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_threshold4" numeric;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_women1" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_women2" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_women3" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_women4" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_men1" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_men2" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_men3" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "indicator_f_hourly_men4" integer;--> statement-breakpoint

-- Step 2: Backfill indicator A + C (step 2 categories)
UPDATE "app_declaration" d SET
  indicator_a_annual_women = c.women_value,
  indicator_a_annual_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 2 AND c.category_name = 'Annuelle brute moyenne';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_a_hourly_women = c.women_value,
  indicator_a_hourly_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 2 AND c.category_name = 'Horaire brute moyenne';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_c_annual_women = c.women_value,
  indicator_c_annual_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 2 AND c.category_name = 'Annuelle brute médiane';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_c_hourly_women = c.women_value,
  indicator_c_hourly_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 2 AND c.category_name = 'Horaire brute médiane';--> statement-breakpoint

-- Step 3: Backfill indicator B + D (step 3 categories)
UPDATE "app_declaration" d SET
  indicator_b_annual_women = c.women_value,
  indicator_b_annual_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 3 AND c.category_name = 'Annuelle brute moyenne';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_b_hourly_women = c.women_value,
  indicator_b_hourly_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 3 AND c.category_name = 'Horaire brute moyenne';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_d_annual_women = c.women_value,
  indicator_d_annual_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 3 AND c.category_name = 'Annuelle brute médiane';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_d_hourly_women = c.women_value,
  indicator_d_hourly_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 3 AND c.category_name = 'Horaire brute médiane';--> statement-breakpoint

-- Step 4: Backfill indicator E (step 3 beneficiaries)
UPDATE "app_declaration" d SET
  indicator_e_women = c.women_value,
  indicator_e_men   = c.men_value
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 3 AND c.category_name = 'Bénéficiaires';--> statement-breakpoint

-- Step 5: Backfill indicator F — annual quartiles (step 4)
UPDATE "app_declaration" d SET
  indicator_f_annual_threshold1 = c.women_value,
  indicator_f_annual_women1     = c.women_count,
  indicator_f_annual_men1       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'annual:1er quartile';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_f_annual_threshold2 = c.women_value,
  indicator_f_annual_women2     = c.women_count,
  indicator_f_annual_men2       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'annual:2e quartile';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_f_annual_threshold3 = c.women_value,
  indicator_f_annual_women3     = c.women_count,
  indicator_f_annual_men3       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'annual:3e quartile';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_f_annual_threshold4 = c.women_value,
  indicator_f_annual_women4     = c.women_count,
  indicator_f_annual_men4       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'annual:4e quartile';--> statement-breakpoint

-- Step 6: Backfill indicator F — hourly quartiles (step 4)
UPDATE "app_declaration" d SET
  indicator_f_hourly_threshold1 = c.women_value,
  indicator_f_hourly_women1     = c.women_count,
  indicator_f_hourly_men1       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'hourly:1er quartile';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_f_hourly_threshold2 = c.women_value,
  indicator_f_hourly_women2     = c.women_count,
  indicator_f_hourly_men2       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'hourly:2e quartile';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_f_hourly_threshold3 = c.women_value,
  indicator_f_hourly_women3     = c.women_count,
  indicator_f_hourly_men3       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'hourly:3e quartile';--> statement-breakpoint

UPDATE "app_declaration" d SET
  indicator_f_hourly_threshold4 = c.women_value,
  indicator_f_hourly_women4     = c.women_count,
  indicator_f_hourly_men4       = c.men_count
FROM "app_declaration_category" c
WHERE c.siren = d.siren AND c.year = d.year
  AND c.step = 4 AND c.category_name = 'hourly:4e quartile';--> statement-breakpoint

-- Step 7: Drop the old table
DROP TABLE "app_declaration_category" CASCADE;
