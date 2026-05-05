-- Track the first moment a declaration transitions to `status = 'submitted'`.
-- Resubmissions after correction leave the value intact (the submit mutation
-- uses `COALESCE(submitted_at, now)` to preserve the first submission date).
-- Feeds the campaign progression chart (K2) which plots cumulative submissions
-- per calendar day.
ALTER TABLE "app_declaration"
  ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;
--> statement-breakpoint

-- Backfill historic submissions from `updated_at`. This is an approximation —
-- `updated_at` is touched on every write, so for declarations resubmitted
-- after corrections the value will be later than the true first submission.
-- Accepting that drift for the historical curve; future submissions record
-- the exact date via the submit mutation.
UPDATE "app_declaration"
  SET "submitted_at" = "updated_at"
  WHERE "status" = 'submitted' AND "submitted_at" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "declaration_submitted_at_idx"
  ON "app_declaration" ("submitted_at");
