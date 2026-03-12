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
ALTER TABLE "app_joint_evaluation_file" ADD CONSTRAINT "app_joint_evaluation_file_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_joint_evaluation_file" ADD CONSTRAINT "app_joint_evaluation_file_declarant_id_app_user_id_fk" FOREIGN KEY ("declarant_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "joint_eval_file_siren_year_idx" ON "app_joint_evaluation_file" USING btree ("siren","year");