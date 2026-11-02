CREATE TABLE "app_representation_declaration_lock" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"siren" varchar(9) NOT NULL,
	"year" integer NOT NULL,
	"locked_by_user_id" varchar(255) NOT NULL,
	"locked_at" timestamp with time zone NOT NULL,
	"last_heartbeat_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_representation_declaration_lock" ADD CONSTRAINT "app_representation_declaration_lock_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_representation_declaration_lock" ADD CONSTRAINT "app_representation_declaration_lock_locked_by_user_id_app_user_id_fk" FOREIGN KEY ("locked_by_user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "representation_declaration_lock_siren_year_unique" ON "app_representation_declaration_lock" USING btree ("siren","year");--> statement-breakpoint
CREATE INDEX "representation_declaration_lock_expires_at_idx" ON "app_representation_declaration_lock" USING btree ("expires_at");