CREATE TYPE "public"."representation_declaration_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."representation_not_computable_executives" AS ENUM('aucun_cadre_dirigeant', 'un_seul_cadre_dirigeant');--> statement-breakpoint
CREATE TYPE "public"."representation_not_computable_members" AS ENUM('aucune_instance_dirigeante');--> statement-breakpoint
CREATE TABLE "app_representation_campaign" (
	"year" integer PRIMARY KEY NOT NULL,
	"campaign_start_date" date NOT NULL,
	"campaign_end_date" date NOT NULL,
	"declaration_deadline" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_representation_declaration" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"declarant_id" varchar(255),
	"legacy_declarant" jsonb,
	"imported_from_v1_at" timestamp with time zone,
	"reference_period_start" date,
	"reference_period_end" date,
	"executive_women_percent" numeric(5, 2),
	"executive_men_percent" numeric(5, 2),
	"not_computable_reason_executives" "representation_not_computable_executives",
	"member_women_percent" numeric(5, 2),
	"member_men_percent" numeric(5, 2),
	"not_computable_reason_members" "representation_not_computable_members",
	"publish_date" date,
	"publish_url" varchar(500),
	"publish_modalities" text,
	"current_step" integer DEFAULT 0,
	"status" "representation_declaration_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"draft" jsonb,
	"draft_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app_representation_declaration" ADD CONSTRAINT "app_representation_declaration_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_representation_declaration" ADD CONSTRAINT "app_representation_declaration_declarant_id_app_user_id_fk" FOREIGN KEY ("declarant_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "representation_declaration_siren_year_unique" ON "app_representation_declaration" USING btree ("siren","year");--> statement-breakpoint
CREATE INDEX "representation_declaration_declarant_idx" ON "app_representation_declaration" USING btree ("declarant_id");