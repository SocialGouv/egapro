-- Denormalized arithmetic mean of every computable salary gap on this
-- declaration's employee categories. Null until we have at least one pair
-- of non-null women/men salaries with men != 0.
--
-- Source of truth stays on `app_employee_category` (four salary pairs per
-- row). This column is recomputed at submit time via `computeAverageGap`
-- (domain/shared/gap.ts) and exists only to accelerate the K10 multi-year
-- gap trend chart — a 5-year aggregation across up to 21 NAF sections
-- cannot afford to re-join employee_category for every row.
ALTER TABLE "app_declaration"
  ADD COLUMN IF NOT EXISTS "average_gap" numeric;
--> statement-breakpoint

-- Backfill historic `submitted` declarations — mirrors `computeAverageGap`
-- exactly: for each of the four salary pairs (annual/hourly × base/variable),
-- we keep the ones where both sides are non-null and `men <> 0`, compute
-- |(men - women) / men| * 100, then average every retained value across every
-- category of the declaration. UNNEST + FILTER(WHERE) keeps the expression
-- self-contained and easier to read than four nested CASE branches.
UPDATE "app_declaration" d
SET "average_gap" = sub.avg_gap
FROM (
  SELECT
    jc."declaration_id",
    AVG(pair.gap) AS avg_gap
  FROM "app_job_category" jc
  INNER JOIN "app_employee_category" ec ON ec."job_category_id" = jc."id"
  CROSS JOIN LATERAL (
    SELECT gap FROM (VALUES
      (
        CASE
          WHEN ec."annual_base_women" IS NOT NULL
           AND ec."annual_base_men" IS NOT NULL
           AND ec."annual_base_men" <> 0
          THEN ABS((ec."annual_base_men" - ec."annual_base_women") / ec."annual_base_men") * 100
        END
      ),
      (
        CASE
          WHEN ec."annual_variable_women" IS NOT NULL
           AND ec."annual_variable_men" IS NOT NULL
           AND ec."annual_variable_men" <> 0
          THEN ABS((ec."annual_variable_men" - ec."annual_variable_women") / ec."annual_variable_men") * 100
        END
      ),
      (
        CASE
          WHEN ec."hourly_base_women" IS NOT NULL
           AND ec."hourly_base_men" IS NOT NULL
           AND ec."hourly_base_men" <> 0
          THEN ABS((ec."hourly_base_men" - ec."hourly_base_women") / ec."hourly_base_men") * 100
        END
      ),
      (
        CASE
          WHEN ec."hourly_variable_women" IS NOT NULL
           AND ec."hourly_variable_men" IS NOT NULL
           AND ec."hourly_variable_men" <> 0
          THEN ABS((ec."hourly_variable_men" - ec."hourly_variable_women") / ec."hourly_variable_men") * 100
        END
      )
    ) AS t(gap)
    WHERE gap IS NOT NULL
  ) pair
  GROUP BY jc."declaration_id"
) sub
WHERE d."id" = sub."declaration_id"
  AND d."status" = 'submitted'
  AND d."average_gap" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "declaration_average_gap_idx"
  ON "app_declaration" ("average_gap");
