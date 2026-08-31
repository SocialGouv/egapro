ALTER TABLE "app_company" ADD COLUMN "country_code" varchar(5);--> statement-breakpoint
ALTER TABLE "app_company" ADD COLUMN "country_label" varchar(255);--> statement-breakpoint
--- Targeted backfill: only rows already proven French by their department get
--- the FRANCE label. Blanket-labelling the table would stamp FRANCE onto the
--- foreign companies already in base — precisely the population this column
--- exists to identify — and the error would survive until the referent's next
--- login. Rows without a department stay unknown and are repaired at the next
--- Weez lookup.
UPDATE "app_company" SET "country_label" = 'FRANCE' WHERE "department_code" IS NOT NULL AND "country_label" IS NULL;
