-- Admin impersonation audit log: one row per "mimoquage" session started by
-- an admin. Used for audit trail and as the source for the recently
-- impersonated quick-pick list in the backoffice UI.
CREATE TABLE IF NOT EXISTS "app_admin_impersonation_event" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"admin_user_id" varchar(255) NOT NULL,
	"siren" varchar(9) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"stopped_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app_admin_impersonation_event"
	ADD CONSTRAINT "app_admin_impersonation_event_admin_user_id_app_user_id_fk"
	FOREIGN KEY ("admin_user_id") REFERENCES "app_user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "app_admin_impersonation_event"
	ADD CONSTRAINT "app_admin_impersonation_event_siren_app_company_siren_fk"
	FOREIGN KEY ("siren") REFERENCES "app_company"("siren") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_impersonation_event_admin_started_idx"
	ON "app_admin_impersonation_event" ("admin_user_id", "started_at");
