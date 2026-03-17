CREATE TYPE "public"."declaration_type" AS ENUM('initial', 'correction');--> statement-breakpoint
CREATE TABLE "app_employee_category" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"job_category_id" varchar(255) NOT NULL,
	"declaration_type" "declaration_type" NOT NULL,
	"women_count" integer,
	"men_count" integer,
	"annual_base_women" numeric,
	"annual_base_men" numeric,
	"annual_variable_women" numeric,
	"annual_variable_men" numeric,
	"hourly_base_women" numeric,
	"hourly_base_men" numeric,
	"hourly_variable_women" numeric,
	"hourly_variable_men" numeric,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "employee_category_job_type_idx" UNIQUE("job_category_id","declaration_type")
);
--> statement-breakpoint
CREATE TABLE "app_export" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"version" varchar(10) DEFAULT 'v1' NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"row_count" integer NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "export_date_version_idx" UNIQUE("date","version")
);
--> statement-breakpoint
CREATE TABLE "app_job_category" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"declaration_id" varchar(255) NOT NULL,
	"category_index" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"detail" varchar(500),
	"source" varchar(50) NOT NULL,
	CONSTRAINT "job_category_declaration_index_idx" UNIQUE("declaration_id","category_index")
);
--> statement-breakpoint
CREATE TABLE "app_joint_evaluation_file" (
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
ALTER TABLE "app_declaration" DROP CONSTRAINT "app_declaration_siren_year_pk";--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "id" varchar(255) PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_declaration_step" integer;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_declaration_status" varchar(20);--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_decl_reference_period_start" varchar(10);--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "second_decl_reference_period_end" varchar(10);--> statement-breakpoint
ALTER TABLE "app_declaration" ADD COLUMN "compliance_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_gip_mds_data" ADD COLUMN "annual_quartile_threshold4" numeric(9, 2);--> statement-breakpoint
ALTER TABLE "app_gip_mds_data" ADD COLUMN "hourly_quartile_threshold4" numeric(9, 2);--> statement-breakpoint
ALTER TABLE "app_employee_category" ADD CONSTRAINT "app_employee_category_job_category_id_app_job_category_id_fk" FOREIGN KEY ("job_category_id") REFERENCES "public"."app_job_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_job_category" ADD CONSTRAINT "app_job_category_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_joint_evaluation_file" ADD CONSTRAINT "app_joint_evaluation_file_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_joint_evaluation_file" ADD CONSTRAINT "app_joint_evaluation_file_declarant_id_app_user_id_fk" FOREIGN KEY ("declarant_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "joint_eval_file_siren_year_idx" ON "app_joint_evaluation_file" USING btree ("siren","year");--> statement-breakpoint
ALTER TABLE "app_declaration" ADD CONSTRAINT "declaration_siren_year_idx" UNIQUE("siren","year");