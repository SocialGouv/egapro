ALTER TABLE "app_campaign_deadline" ADD COLUMN "decl2_cse_opinion_deadline" date;--> statement-breakpoint
-- The value stored in decl2_joint_evaluation_deadline was entered by the admin
-- under the "Date limite de l'avis du CSE" label: its real intent was the CSE
-- opinion, so it moves to the new column and the CSE screens keep their date.
UPDATE "app_campaign_deadline" SET "decl2_cse_opinion_deadline" = "decl2_joint_evaluation_deadline" WHERE "decl2_cse_opinion_deadline" IS NULL;--> statement-breakpoint
-- Keeping the old value on the joint evaluation column would silently carry the
-- bug over to every already-configured year, hence the recompute on the rule.
UPDATE "app_campaign_deadline" SET "decl2_joint_evaluation_deadline" = make_date("year" + 1, 1, 1);--> statement-breakpoint
ALTER TABLE "app_campaign_deadline" ALTER COLUMN "decl2_cse_opinion_deadline" SET NOT NULL;
