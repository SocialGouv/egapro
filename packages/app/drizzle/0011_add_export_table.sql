CREATE TABLE IF NOT EXISTS "app_export" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"version" varchar(10) DEFAULT 'v1' NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"row_count" integer NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app_export" ADD CONSTRAINT "export_date_version_idx" UNIQUE("date","version");
