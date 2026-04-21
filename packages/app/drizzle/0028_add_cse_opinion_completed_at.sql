-- Track when a CSE opinion deposit (avis CSE) is finalized by the declarant.
-- A NULL value means the flow is still in progress. The side panel uses this
-- column (rather than "any cseOpinions row exists") to decide whether the
-- declaration should be shown as "clôturée".
ALTER TABLE "app_declaration"
  ADD COLUMN IF NOT EXISTS "cse_opinion_completed_at" timestamp with time zone;
