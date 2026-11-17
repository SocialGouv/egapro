-- Backfill de la dernière activité connue des comptes existants (#4770).
--
-- `ADD COLUMN … DEFAULT now()` a daté tous les comptes à l'instant de la
-- migration : sans ce backfill, aucun compte ne serait purgé avant deux ans.
-- On retient le signal le plus récent dont on dispose pour chaque compte :
--   - création du compte (email_verified, posé à l'inscription) ;
--   - dernière connexion encore présente dans le journal d'audit (rétention
--     365 jours — plus fiable que la date d'inscription quand elle existe) ;
--   - dernière déclaration créée, dernier changement de statut dont le compte
--     est l'auteur, dernière déclaration de représentation ;
--   - dernier rattachement à une entreprise.
-- Un compte sans aucun signal garde la date de la migration (now()) : on ne
-- purge jamais un compte que l'on ne sait pas dater.
UPDATE "app_user" AS u
SET "last_activity_at" = COALESCE(
  GREATEST(
    u."email_verified",
    (
      SELECT max(a."created_at")
      FROM "audit"."action_log" a
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
