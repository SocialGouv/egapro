-- Add isAdmin flag on user table for backoffice (admin) access control
ALTER TABLE "app_user" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL;
