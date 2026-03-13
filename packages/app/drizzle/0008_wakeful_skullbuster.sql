ALTER TABLE "app_cse_opinion_file" ADD COLUMN "file_size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file" ADD COLUMN "scan_status" varchar(20) DEFAULT 'clean' NOT NULL;