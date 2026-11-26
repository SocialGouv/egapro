-- Backfill of the last known activity for existing accounts (#4770).
--
-- `ADD COLUMN … DEFAULT now()` dated every account at the migration instant:
-- without this backfill, no account would be purged before two years. We keep
-- the most recent signal available per account:
--   - account creation (email_verified, set at sign-up);
--   - last sign-in still present in the audit log (365-day retention — more
--     reliable than the sign-up date when it exists);
--   - last declaration created, last status change authored by the account,
--     last representation declaration;
--   - last company link.
-- An account with no signal keeps the migration date (now()): an account we
-- cannot date is never purged.
UPDATE "app_user" AS u
SET "last_activity_at" = COALESCE(
  GREATEST(
    u."email_verified",
    (
      SELECT max(a."created_at")
      FROM "audit".action_log a
      WHERE a."user_id" = u."id" AND a."action" = 'auth.login'
    ),
    (
      SELECT max(d."created_at")
      FROM "app_declaration" d
      WHERE d."declarant_id" = u."id"
    ),
    (
      SELECT max(h."created_at")
      FROM "app_declaration_status_history" h
      WHERE h."actor_user_id" = u."id"
    ),
    (
      SELECT max(r."created_at")
      FROM "app_representation_declaration" r
      WHERE r."declarant_id" = u."id"
    ),
    (
      SELECT max(uc."created_at")
      FROM "app_user_company" uc
      WHERE uc."user_id" = u."id"
    )
  ),
  now()
);
