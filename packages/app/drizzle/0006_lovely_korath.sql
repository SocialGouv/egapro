CREATE TABLE "app_cse_opinion_file_link" (
	"file_id" varchar(255) NOT NULL,
	"opinion_id" varchar(255) NOT NULL,
	CONSTRAINT "app_cse_opinion_file_link_file_id_opinion_id_pk" PRIMARY KEY("file_id","opinion_id")
);
--> statement-breakpoint
CREATE TABLE "app_cse_opinion_file" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"declarant_id" varchar(255) NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app_cse_opinion" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"declaration_number" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"gap_consulted" boolean,
	"opinion" varchar(20),
	"opinion_date" varchar(10),
	"declarant_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "cse_opinion_siren_year_decl_type_idx" UNIQUE("siren","year","declaration_number","type")
);
--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file_link" ADD CONSTRAINT "app_cse_opinion_file_link_file_id_app_cse_opinion_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."app_cse_opinion_file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file_link" ADD CONSTRAINT "app_cse_opinion_file_link_opinion_id_app_cse_opinion_id_fk" FOREIGN KEY ("opinion_id") REFERENCES "public"."app_cse_opinion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_declarant_id_app_user_id_fk" FOREIGN KEY ("declarant_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cse_opinion" ADD CONSTRAINT "app_cse_opinion_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cse_opinion" ADD CONSTRAINT "app_cse_opinion_declarant_id_app_user_id_fk" FOREIGN KEY ("declarant_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cse_opinion_file_siren_year_idx" ON "app_cse_opinion_file" USING btree ("siren","year");--> statement-breakpoint
CREATE INDEX "cse_opinion_siren_year_idx" ON "app_cse_opinion" USING btree ("siren","year");