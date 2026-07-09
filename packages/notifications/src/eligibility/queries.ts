import type { Sql } from "postgres";
import type { CseOpinionReminderVariant } from "../mails/types.js";

// Eligibility queries against the app DB.
//
// Tables follow the Drizzle multi-project prefix `app_*`. All queries
// return `(siren, year, email, userId)` so the caller knows where to send
// the reminder. The recipient is always the most recent declarant for the
// company (deterministic, single mail per company per reminder).

export type ReminderRecipient = {
	siren: string;
	year: number;
	email: string;
	userId: string;
};

// 1. Cycle opening (1er mars Y, Y >= 2028): recipients with a completed
// previous cycle. We notify the past declarant of cycle Y-1.
export async function findOpenCycleRecipients(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	const previousYear = year - 1;
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			${year}::int AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		JOIN app_company c ON c.siren = d.siren
		WHERE d.year = ${previousYear}
			AND d.cancelled_at IS NULL
			AND d.status IN ('demarche_completed', 'awaiting_cse_opinion')
			AND c.workforce >= 50
			AND u.email IS NOT NULL
	`;
}

// 2. Declaration deadline reminder (J-30 / J-10 before 1er juin):
// declarations still in draft for the current campaign year.
export async function findDraftDeclarations(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		JOIN app_company c ON c.siren = d.siren
		WHERE d.year = ${year}
			AND d.cancelled_at IS NULL
			AND d.status = 'draft'
			AND c.workforce >= 50
			AND u.email IS NOT NULL
	`;
}

// 3a. Compliance path choice reminder — round 1 (J-15 before 1er juillet):
// first declaration submitted with gap >= 5 % and no compliance path chosen
// yet.
export async function findAwaitingCompliancePathChoiceFirstRound(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE d.year = ${year}
			AND d.cancelled_at IS NULL
			AND u.email IS NOT NULL
			AND d.status = 'awaiting_compliance_path_choice'
			AND d.first_declaration_path_choice IS NULL
	`;
}

// 3b. Compliance path choice reminder — round 2 (J-15 before 1er janvier N+1):
// second declaration submitted with a persistent gap >= 5 %, awaiting the
// user's revision choice. In round 2 the *first* choice is already set to
// 'corrective_action', so we filter on the (still NULL) second choice.
export async function findAwaitingCompliancePathChoiceSecondRound(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE d.year = ${year}
			AND d.cancelled_at IS NULL
			AND u.email IS NOT NULL
			AND d.status = 'awaiting_revision_choice'
			AND d.second_declaration_path_choice IS NULL
	`;
}

// 4. Second declaration reminder (J-90 / J-30 before 1er janvier N+1):
// declarations on the corrective-actions track that have not yet submitted
// their second declaration. `secondDeclarationStep` is null until the
// second declaration is submitted (then set to 3, see declaration.ts).
export async function findCorrectiveSecondDeclarationPending(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE d.year = ${year}
			AND d.cancelled_at IS NULL
			AND d.first_declaration_path_choice = 'corrective_action'
			AND d.status = 'corrective_actions_chosen'
			AND d.second_declaration_step IS NULL
			AND u.email IS NOT NULL
	`;
}

// 5a. Joint evaluation reminder — round 1 (J-30 / J-15 before 1er septembre):
// the joint-evaluation path was chosen at the first declaration and no round-2
// choice has been made yet, without an uploaded joint_evaluation file.
export async function findJointEvaluationPendingFirstRound(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE d.year = ${year}
			AND d.cancelled_at IS NULL
			AND u.email IS NOT NULL
			AND d.first_declaration_path_choice = 'joint_evaluation'
			AND d.second_declaration_path_choice IS NULL
			AND NOT EXISTS (
				SELECT 1
				FROM app_file f
				WHERE f.declaration_id = d.id
					AND f.type = 'joint_evaluation'
			)
	`;
}

// 5b. Joint evaluation reminder — round 2 (J-30 / J-15 before 1er mars N+1):
// the joint-evaluation path was chosen at the second declaration (after a
// persistent gap), without an uploaded joint_evaluation file. The round-2
// choice takes precedence over the round-1 one.
export async function findJointEvaluationPendingSecondRound(
	sql: Sql,
	year: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE d.year = ${year}
			AND d.cancelled_at IS NULL
			AND u.email IS NOT NULL
			AND d.second_declaration_path_choice = 'joint_evaluation'
			AND NOT EXISTS (
				SELECT 1
				FROM app_file f
				WHERE f.declaration_id = d.id
					AND f.type = 'joint_evaluation'
			)
	`;
}

// 6. CSE opinion reminder — one variant per flowchart branch.
//
// All variants share the base eligibility:
//   - declaration is active (not cancelled),
//   - company is CSE-required (`cse_required = true`),
//   - no CSE opinion has been deposited yet (NOT EXISTS in app_cse_opinion).
//
// Per-variant filters (derived from `docs/parcours-utilisateurs.md`):
//   - compliance (MG_B / MG_C): no Phase 2 path chosen — covers the
//     "100-149 sans 7e" branch (C2) and the "150+ conforme G<5%" branch
//     (4a). Both go straight from Phase 1 submission to CSE deposit.
//   - justify_oct (MG_J1) + justify_dec (MG_J2): one of the two path
//     choices is `justify`. Same SQL filter, different cron.
//   - corrective (MG_A): first-round path is `corrective_action`, the
//     second declaration has been submitted (status = 'awaiting_cse_opinion')
//     — without this status filter we would also trigger MG_A for
//     declarations that haven't completed their second declaration yet.
//   - joint_eval (MG_E2): one of the path choices is `joint_evaluation`
//     AND the joint-eval report has been uploaded (else the FSM is still
//     awaiting the report, not the CSE opinion).
export async function findCseOpinionPending(
	sql: Sql,
	year: number,
	variant: CseOpinionReminderVariant,
): Promise<ReminderRecipient[]> {
	const baseConditions = sql`
		d.year = ${year}
		AND d.cancelled_at IS NULL
		AND d.cse_required = true
		AND u.email IS NOT NULL
		AND NOT EXISTS (
			SELECT 1 FROM app_cse_opinion o WHERE o.declaration_id = d.id
		)
	`;
	const variantFilter = buildCseOpinionVariantFilter(sql, variant);
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE ${baseConditions} AND (${variantFilter})
	`;
}

function buildCseOpinionVariantFilter(
	sql: Sql,
	variant: CseOpinionReminderVariant,
) {
	switch (variant) {
		// MG_B / MG_C — entreprise sans parcours Phase 2 (100-149 sans 7e ind,
		// ou 150+ conforme G < 5 %). Neither round has chosen a compliance path.
		case "compliance":
			return sql`
				d.first_declaration_path_choice IS NULL
				AND d.second_declaration_path_choice IS NULL
			`;
		// MG_J1 / MG_J2 — parcours Justifier (Round 1 ou Round 2). Same filter,
		// cron picks the timing (1er sept = J-30 / 1er déc = relance).
		case "justify_oct":
		case "justify_dec":
			return sql`
				d.first_declaration_path_choice = 'justify'
				OR d.second_declaration_path_choice = 'justify'
			`;
		// MG_A — Actions correctives, 2e déclaration soumise et écarts corrigés.
		// The FSM transitions to 'awaiting_cse_opinion' once the second
		// declaration lands and the gap is back below 5 %.
		case "corrective":
			return sql`
				d.first_declaration_path_choice = 'corrective_action'
				AND d.status = 'awaiting_cse_opinion'
			`;
		// MG_E2 — Évaluation conjointe, rapport déposé. Without the file
		// check, the FSM is still waiting for the report (M_PE2 trigger),
		// not the CSE opinion.
		case "joint_eval":
			return sql`
				(
					d.first_declaration_path_choice  = 'joint_evaluation'
					OR d.second_declaration_path_choice = 'joint_evaluation'
				)
				AND EXISTS (
					SELECT 1 FROM app_file f
					WHERE f.declaration_id = d.id AND f.type = 'joint_evaluation'
				)
			`;
	}
}

// 7. Next cycle handover (2 mars N+1): companies whose previous cycle is
// closed (status = demarche_completed). The recipient is the declarant of
// that cycle.
export async function findCompletedPreviousCycle(
	sql: Sql,
	previousYear: number,
): Promise<ReminderRecipient[]> {
	return sql<ReminderRecipient[]>`
		SELECT
			d.siren AS siren,
			d.year AS year,
			u.email AS email,
			d.declarant_id AS "userId"
		FROM app_declaration d
		JOIN app_user u ON u.id = d.declarant_id
		WHERE d.year = ${previousYear}
			AND d.cancelled_at IS NULL
			AND d.status = 'demarche_completed'
			AND u.email IS NOT NULL
	`;
}
