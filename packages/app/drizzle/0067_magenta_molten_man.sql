ALTER TABLE "app_health_probe" ADD COLUMN "interval_seconds" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_health_probe" ADD COLUMN "last_success_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_health_probe" ADD COLUMN "last_failure_at" timestamp with time zone;