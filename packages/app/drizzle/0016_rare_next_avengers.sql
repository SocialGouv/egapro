TRUNCATE "app_gip_mds_data";--> statement-breakpoint
ALTER TABLE "app_gip_mds_data" ADD CONSTRAINT "app_gip_mds_data_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;
