ALTER TABLE "app_company" ADD COLUMN "address" varchar(500);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "naf_code" varchar(10);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "workforce" integer;--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "has_cse" boolean;