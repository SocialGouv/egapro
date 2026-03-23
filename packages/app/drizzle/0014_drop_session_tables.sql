-- Drop session and verification token tables (JWT sessions are stateless)
DROP TABLE IF EXISTS "app_session";
--> statement-breakpoint
DROP TABLE IF EXISTS "app_verification_token";
