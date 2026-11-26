CREATE TYPE "public"."health_criticality" AS ENUM('critical', 'important', 'low');--> statement-breakpoint
CREATE TYPE "public"."health_probe_kind" AS ENUM('internal', 'partner', 'exposed', 'job');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('operational', 'degraded', 'unavailable', 'misconfigured');--> statement-breakpoint
CREATE TABLE "app_health_incident" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"probe_key" varchar(100) NOT NULL,
	"from_status" "health_status" NOT NULL,
	"to_status" "health_status" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"last_error" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "app_health_probe" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"criticality" "health_criticality" NOT NULL,
	"kind" "health_probe_kind" NOT NULL,
	"status" "health_status" NOT NULL,
	"latency_ms" integer,
	"checked_at" timestamp with time zone NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "app_health_incident" ADD CONSTRAINT "app_health_incident_probe_key_app_health_probe_key_fk" FOREIGN KEY ("probe_key") REFERENCES "public"."app_health_probe"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_incident_started_at_idx" ON "app_health_incident" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "health_incident_probe_key_idx" ON "app_health_incident" USING btree ("probe_key","started_at");