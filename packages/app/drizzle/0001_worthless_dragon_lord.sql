CREATE TABLE "app_declaration_category" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"step" integer NOT NULL,
	"categoryName" varchar(255) NOT NULL,
	"womenCount" integer,
	"menCount" integer,
	"women_value" numeric,
	"men_value" numeric,
	"women_median_value" numeric,
	"men_median_value" numeric
);
--> statement-breakpoint
CREATE TABLE "app_declaration" (
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"declarantId" varchar(255) NOT NULL,
	"totalWomen" integer,
	"totalMen" integer,
	"remunerationScore" integer,
	"variableRemunerationScore" integer,
	"quartileScore" integer,
	"categoryScore" integer,
	"currentStep" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'draft',
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "app_declaration_siren_year_pk" PRIMARY KEY("siren","year")
);
--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "siret" varchar(14);--> statement-breakpoint
ALTER TABLE "app_declaration" ADD CONSTRAINT "app_declaration_declarantId_app_user_id_fk" FOREIGN KEY ("declarantId") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "declaration_cat_siren_year_step_idx" ON "app_declaration_category" USING btree ("siren","year","step");--> statement-breakpoint
CREATE INDEX "declaration_declarant_idx" ON "app_declaration" USING btree ("declarantId");