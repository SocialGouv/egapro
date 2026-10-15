/**
 * Seed local dev DB with the minimum data needed to test the declaration flow.
 * Run after first ProConnect login (test@fia1.fr) so the user row exists.
 *
 * Usage: pnpm db:seed-dev
 */
import postgres from "postgres";
import { getDefaultCampaignDeadlineColumns } from "~/modules/domain";

const TEST_SIREN = "130025265";
const TEST_COMPANY_NAME = "Direction du Numérique (DEV)";
const TEST_EMAIL = "test@fia1.fr";
const CURRENT_YEAR = new Date().getFullYear();

const sql = postgres(
	process.env.DATABASE_URL ??
		"postgresql://postgres:postgres@localhost:5438/egapro",
	{ max: 1 },
);

async function main() {
	// 1. Upsert user (creates it if ProConnect login hasn't happened yet)
	let userRows =
		await sql`SELECT id FROM app_user WHERE email = ${TEST_EMAIL} LIMIT 1`;
	if (userRows.length === 0) {
		userRows = await sql`
			INSERT INTO app_user (id, email) VALUES (gen_random_uuid(), ${TEST_EMAIL}) RETURNING id
		`;
	}
	const userId = userRows[0]?.id;
	if (!userId) throw new Error("Could not upsert user");
	console.log(`User: ${TEST_EMAIL} (id=${userId})`);

	// 2. Upsert company
	await sql`
		INSERT INTO app_company (siren, name, workforce, created_at, updated_at)
		VALUES (${TEST_SIREN}, ${TEST_COMPANY_NAME}, 150, NOW(), NOW())
		ON CONFLICT (siren) DO UPDATE SET name = EXCLUDED.name
	`;
	console.log(`Company: ${TEST_SIREN} "${TEST_COMPANY_NAME}"`);

	// 3. Link user to company
	await sql`
		INSERT INTO app_user_company (user_id, siren)
		VALUES (${userId}, ${TEST_SIREN})
		ON CONFLICT DO NOTHING
	`;
	console.log(`Linked user → company`);

	// 4. Insert campaign deadline for current year (never touches a row an admin already configured)
	const deadlines = getDefaultCampaignDeadlineColumns(CURRENT_YEAR);
	await sql`
		INSERT INTO app_campaign_deadline (
			year,
			decl1_modification_deadline,
			decl1_justification_deadline,
			decl1_joint_evaluation_deadline,
			decl2_modification_deadline,
			decl2_justification_deadline,
			decl2_joint_evaluation_deadline,
			decl2_cse_opinion_deadline
		) VALUES (
			${CURRENT_YEAR},
			${deadlines.decl1ModificationDeadline},
			${deadlines.decl1JustificationDeadline},
			${deadlines.decl1JointEvaluationDeadline},
			${deadlines.decl2ModificationDeadline},
			${deadlines.decl2JustificationDeadline},
			${deadlines.decl2JointEvaluationDeadline},
			${deadlines.decl2CseOpinionDeadline}
		)
		ON CONFLICT (year) DO NOTHING
	`;
	console.log(`Campaign deadline for ${CURRENT_YEAR}`);

	// 5. Upsert draft declaration for current year
	await sql`
		INSERT INTO app_declaration (
			id, siren, year, declarant_id, current_step, status,
			created_at, updated_at
		)
		VALUES (
			gen_random_uuid(),
			${TEST_SIREN},
			${CURRENT_YEAR},
			${userId},
			1,
			'draft',
			NOW(),
			NOW()
		)
		ON CONFLICT (siren, year) WHERE cancelled_at IS NULL DO NOTHING
	`;
	console.log(`Declaration ${TEST_SIREN}/${CURRENT_YEAR} (draft, step 1)`);

	console.log(
		"\nDone. Log in at http://localhost:3000/login with test@fia1.fr",
	);
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(() => sql.end());
