CREATE TABLE "app_cse_opinion_file" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"declaration_id" varchar(255) NOT NULL,
	"declaration_number" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"file_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "cse_opinion_file_decl_number_type_idx" UNIQUE("declaration_id","declaration_number","type")
);
--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_file_id_app_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."app_file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cse_opinion_file_declaration_idx" ON "app_cse_opinion_file" USING btree ("declaration_id");
