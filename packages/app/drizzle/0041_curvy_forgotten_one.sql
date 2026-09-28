CREATE TABLE "app_declaration_lock" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"declaration_id" varchar(255) NOT NULL,
	"locked_by_user_id" varchar(255) NOT NULL,
	"locked_at" timestamp with time zone NOT NULL,
	"last_heartbeat_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_global_setting" ADD COLUMN "declaration_lock_timeout_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_declaration_lock" ADD CONSTRAINT "app_declaration_lock_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_declaration_lock" ADD CONSTRAINT "app_declaration_lock_locked_by_user_id_app_user_id_fk" FOREIGN KEY ("locked_by_user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "declaration_lock_declaration_id_unique" ON "app_declaration_lock" USING btree ("declaration_id");--> statement-breakpoint
CREATE INDEX "declaration_lock_expires_at_idx" ON "app_declaration_lock" USING btree ("expires_at");