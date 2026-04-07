-- Configurable campaign deadlines per declaration year
CREATE TABLE IF NOT EXISTS "app_campaign_deadline" (
	"year" integer PRIMARY KEY NOT NULL,
	"decl1_modification_deadline" date NOT NULL,
	"decl1_justification_deadline" date NOT NULL,
	"decl1_joint_evaluation_deadline" date NOT NULL,
	"decl2_modification_deadline" date NOT NULL,
	"decl2_justification_deadline" date NOT NULL,
	"decl2_joint_evaluation_deadline" date NOT NULL
);
