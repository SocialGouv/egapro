ALTER TABLE "app_company" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "region_code" varchar(3);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "country_code" varchar(5);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "country_label" varchar(255);