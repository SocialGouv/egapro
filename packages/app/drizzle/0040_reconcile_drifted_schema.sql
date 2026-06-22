-- Reconcile schema drift on long-lived environments.
--
-- The runtime migrator (drizzle-orm postgres-js) decides what to run from a
-- single high-water mark: `max(created_at)` in `__drizzle_migrations`, compared
-- against each journal entry's `when`. On a long-lived database that recorded an
-- orphan migration (a draft later renumbered) with a `when` between 0038 and
-- 0039, this caused 0038 (naf_label) to be silently skipped while 0039 was
-- replayed. 0038/0039 are now idempotent, but idempotency cannot re-run a
-- migration the high-water mark skipped — hence this catch-up migration, whose
-- later `when` guarantees it always runs. Fully idempotent: a no-op on any
-- environment already in sync.

ALTER TABLE "app_company" ADD COLUMN IF NOT EXISTS "naf_label" varchar(255);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_cse_opinion_file" (
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
DO $$ BEGIN
	ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_declaration_id_app_declaration_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."app_declaration"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "app_cse_opinion_file" ADD CONSTRAINT "app_cse_opinion_file_file_id_app_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."app_file"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cse_opinion_file_declaration_idx" ON "app_cse_opinion_file" USING btree ("declaration_id");
