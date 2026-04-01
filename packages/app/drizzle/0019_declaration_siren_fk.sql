-- Insert placeholder companies for orphaned declarations (sirens not in company table)
INSERT INTO "app_company" ("siren", "name")
SELECT DISTINCT d."siren", CONCAT('Entreprise ', d."siren")
FROM "app_declaration" d
WHERE NOT EXISTS (
  SELECT 1 FROM "app_company" c WHERE c."siren" = d."siren"
)
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "app_declaration" ADD CONSTRAINT "app_declaration_siren_app_company_siren_fk" FOREIGN KEY ("siren") REFERENCES "public"."app_company"("siren") ON DELETE no action ON UPDATE no action;
