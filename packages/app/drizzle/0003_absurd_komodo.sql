CREATE TABLE "app_company" (
	"siren" varchar(9) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app_user_company" (
	"userId" varchar(255) NOT NULL,
	"siren" varchar(9) NOT NULL,
	"createdAt" timestamp with time zone,
	CONSTRAINT "app_user_company_userId_siren_pk" PRIMARY KEY("userId","siren")
);
--> statement-breakpoint
ALTER TABLE "app_user_company" ADD CONSTRAINT "app_user_company_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_user_company" ADD CONSTRAINT "app_user_company_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_company_user_id_idx" ON "app_user_company" USING btree ("userId");