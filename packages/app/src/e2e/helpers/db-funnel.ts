import postgres from "postgres";

import { TEST_SIREN } from "../constants";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
}

type FunnelDeclarationSeed = {
	siren: string;
	year: number;
	workforce: number;
	/** Highest `round` reached via `step_change` (0 = draft, 5 = indicators, 6 = submitted). */
	maxStepRound: number;
	/** Declaration status to persist. */
	status:
		| "draft"
		| "awaiting_compliance_path_choice"
		| "corrective_actions_chosen"
		| "joint_evaluation_chosen"
		| "awaiting_revision_choice"
		| "revised_joint_evaluation_chosen"
		| "demarche_completed";
	/** Optional path-choice events (one entry per round). */
	pathChoices?: Array<{
		round: number;
		pathValue: "corrective_action" | "joint_evaluation";
	}>;
	/** Optional corrective-action submission events. */
	correctiveSubmits?: Array<{
		eventType: "second_declaration_submit" | "joint_evaluation_submit";
		round: number;
	}>;
	/** Whether to emit a `demarche_complete` event. */
	demarcheComplete?: boolean;
	/** Whether to emit a `cse_opinion_submit` event. */
	cseOpinionSubmit?: boolean;
	/** Whether the gap is above the alert threshold (affects firstDeclarationPathChoice). */
	firstDeclarationPathChoice?: "corrective_action" | "joint_evaluation" | null;
	/** Whether the company has a CSE (`companies.has_cse`). */
	hasCse?: boolean;
};

/**
 * Seeds declarations + status history for the K19 funnel E2E. Each input row
 * produces a single declaration with a deterministic series of `step_change`
 * events (round 0..maxStepRound), optional `path_choice` / corrective
 * submission events, and an optional `demarche_complete` event.
 *
 * Cleanup is the caller's responsibility via `deleteFunnelDeclarations`.
 */
export async function seedFunnelDeclarations(rows: FunnelDeclarationSeed[]) {
	if (rows.length === 0) return;
	const sql = createConnection();
	try {
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${TEST_SIREN} LIMIT 1
		`;
		const declarantId = users[0]?.user_id as string | undefined;
		if (!declarantId) {
			throw new Error(
				"seedFunnelDeclarations: no declarant found for TEST_SIREN",
			);
		}

		for (const row of rows) {
			await sql`
				INSERT INTO app_company (siren, name, workforce, has_cse, created_at, updated_at)
				VALUES (
					${row.siren}, ${`E2E K19 Co. ${row.siren}`}, ${row.workforce},
					${row.hasCse ?? false}, NOW(), NOW()
				)
				ON CONFLICT (siren) DO UPDATE SET
					workforce = EXCLUDED.workforce,
					has_cse = EXCLUDED.has_cse
			`;
			const inserted = await sql<[{ id: string }]>`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, current_step, status,
					first_declaration_path_choice,
					created_at, updated_at
				)
				VALUES (
					gen_random_uuid(), ${row.siren}, ${row.year}, ${declarantId},
					${row.maxStepRound}, ${row.status},
					${row.firstDeclarationPathChoice ?? null},
					NOW(), NOW()
				)
				ON CONFLICT (siren, year) WHERE cancelled_at IS NULL DO UPDATE SET
					status = EXCLUDED.status,
					current_step = EXCLUDED.current_step,
					first_declaration_path_choice = EXCLUDED.first_declaration_path_choice
				RETURNING id
			`;
			const declarationId = inserted[0]?.id;
			if (!declarationId) continue;

			await sql`
				DELETE FROM app_declaration_status_history
				WHERE declaration_id = ${declarationId}
			`;

			for (let stepRound = 0; stepRound <= row.maxStepRound; stepRound++) {
				await sql`
					INSERT INTO app_declaration_status_history
					(id, declaration_id, event_type, round, created_at)
					VALUES (
						gen_random_uuid(), ${declarationId}, 'step_change',
						${stepRound}, NOW()
					)
				`;
			}

			if (row.pathChoices) {
				for (const pc of row.pathChoices) {
					await sql`
						INSERT INTO app_declaration_status_history
						(id, declaration_id, event_type, round, value, created_at)
						VALUES (
							gen_random_uuid(), ${declarationId}, 'path_choice',
							${pc.round}, ${pc.pathValue}, NOW()
						)
					`;
				}
			}

			if (row.correctiveSubmits) {
				for (const cs of row.correctiveSubmits) {
					await sql`
						INSERT INTO app_declaration_status_history
						(id, declaration_id, event_type, round, created_at)
						VALUES (
							gen_random_uuid(), ${declarationId}, ${cs.eventType},
							${cs.round}, NOW()
						)
					`;
				}
			}

			if (row.cseOpinionSubmit) {
				await sql`
					INSERT INTO app_declaration_status_history
					(id, declaration_id, event_type, created_at)
					VALUES (
						gen_random_uuid(), ${declarationId}, 'cse_opinion_submit', NOW()
					)
				`;
			}

			if (row.demarcheComplete) {
				await sql`
					INSERT INTO app_declaration_status_history
					(id, declaration_id, event_type, created_at)
					VALUES (
						gen_random_uuid(), ${declarationId}, 'demarche_complete', NOW()
					)
				`;
			}
		}
	} finally {
		await sql.end();
	}
}

export async function deleteFunnelDeclarations(sirens: string[]) {
	if (sirens.length === 0) return;
	const sql = createConnection();
	try {
		await sql`DELETE FROM app_declaration WHERE siren = ANY(${sirens})`;
		await sql`DELETE FROM app_company WHERE siren = ANY(${sirens})`;
	} finally {
		await sql.end();
	}
}
