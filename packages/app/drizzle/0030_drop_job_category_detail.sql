-- Drop the `detail` column from app_job_category. The category field was
-- merged into a single "Libellé" input on the rémunération-by-category step
-- (issue #3324) — `name` now carries the full label and `detail` is unused.
ALTER TABLE "app_job_category" DROP COLUMN IF EXISTS "detail";
