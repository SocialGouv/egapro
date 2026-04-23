-- Denormalized flag: does this declaration carry at least one salary gap
-- greater than or equal to the 5% regulatory alert threshold?
--
-- Source of truth stays on `app_employee_category` (per-category salary
-- pairs). This column is recomputed at submit time via `hasGapsAboveThreshold`
-- (domain/shared/gap.ts). It exists only to accelerate admin-stats KPIs
-- (K8 "Taux d'écart ≥ 5 %") that aggregate across every declaration of a
-- campaign year without joining four salary pairs × N categories per row.
ALTER TABLE "app_declaration"
  ADD COLUMN IF NOT EXISTS "has_alert_gap" boolean NOT NULL DEFAULT false;
--> statement-breakpoint

-- Backfill historic `submitted` declarations by computing the threshold check
-- directly in SQL. This mirrors `hasGapsAboveThreshold` exactly:
-- both women and men salary must be non-null; `men` must be non-zero (else
-- `computeGap` would return null and the pair is skipped); then we flag when
-- |(men - women) / men| * 100 >= 5 on any of the four salary pairs.
UPDATE "app_declaration" d
SET "has_alert_gap" = TRUE
WHERE d."status" = 'submitted'
  AND EXISTS (
    SELECT 1
    FROM "app_employee_category" ec
    INNER JOIN "app_job_category" jc ON jc."id" = ec."job_category_id"
    WHERE jc."declaration_id" = d."id"
      AND (
        (
          ec."annual_base_women" IS NOT NULL
          AND ec."annual_base_men" IS NOT NULL
          AND ec."annual_base_men" <> 0
          AND ABS((ec."annual_base_men" - ec."annual_base_women") / ec."annual_base_men") * 100 >= 5
        )
        OR (
          ec."annual_variable_women" IS NOT NULL
          AND ec."annual_variable_men" IS NOT NULL
          AND ec."annual_variable_men" <> 0
          AND ABS((ec."annual_variable_men" - ec."annual_variable_women") / ec."annual_variable_men") * 100 >= 5
        )
        OR (
          ec."hourly_base_women" IS NOT NULL
          AND ec."hourly_base_men" IS NOT NULL
          AND ec."hourly_base_men" <> 0
          AND ABS((ec."hourly_base_men" - ec."hourly_base_women") / ec."hourly_base_men") * 100 >= 5
        )
        OR (
          ec."hourly_variable_women" IS NOT NULL
          AND ec."hourly_variable_men" IS NOT NULL
          AND ec."hourly_variable_men" <> 0
          AND ABS((ec."hourly_variable_men" - ec."hourly_variable_women") / ec."hourly_variable_men") * 100 >= 5
        )
      )
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "declaration_has_alert_gap_idx"
  ON "app_declaration" ("has_alert_gap");
