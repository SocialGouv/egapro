import "server-only";

import { and, eq } from "drizzle-orm";
import {
	getObligationWorkforce,
	isCseOpinionRequired,
	parseGipWorkforce,
	resolveCseReconciliation,
} from "~/modules/domain";
import { activeDeclarationFilter } from "~/server/api/routers/declarationHelpers";
import {
	buildHistoryInserts,
	computeProjectionUpdates,
} from "~/server/api/routers/statusHistoryHelpers";
import type { DB } from "~/server/db";
import { notCancelledCondition } from "~/server/db/declarationConditions";
import {
	companies,
	declarationStatusHistory,
	declarations,
	gipMdsData,
} from "~/server/db/schema";
import { applyAction, loadRules } from "~/server/rules/engine";

type SyncArgs = {
	db: DB;
	siren: string;
	year: number;
	workforce: number;
	hasCse: boolean | null;
	actorUserId: string | null;
};

type ReconcileTarget = {
	id: string;
	siren: string;
	status: Parameters<typeof resolveCseReconciliation>[0]["status"];
	rulesVersion: string;
	storedCseRequired: boolean;
	workforce: number;
	hasCse: boolean | null;
};

async function applyOutcome(
	db: DB,
	target: ReconcileTarget,
	year: number,
	actorUserId: string | null,
): Promise<boolean> {
	const outcome = resolveCseReconciliation(target);
	if (outcome === "none") return false;

	const cseRequired = isCseOpinionRequired(target);

	if (outcome === "refresh-snapshot") {
		await db
			.update(declarations)
			.set({ cseRequired, updatedAt: new Date() })
			.where(activeDeclarationFilter(target.siren, year));
		return true;
	}

	const { nextStatus, events } = applyAction(
		{ currentState: target.status, cseRequired },
		"sync_cse_requirement",
		loadRules(target.rulesVersion),
	);
	const projection = computeProjectionUpdates(events, nextStatus);
	const historyInserts = buildHistoryInserts(target.id, events, actorUserId);

	await db.transaction(async (tx) => {
		await tx.insert(declarationStatusHistory).values(historyInserts);
		await tx
			.update(declarations)
			.set({ ...projection, cseRequired, updatedAt: new Date() })
			.where(activeDeclarationFilter(target.siren, year));
	});
	return true;
}

/**
 * Realign the active declaration on the company's current CSE answer.
 *
 * `declarations.cse_required` is snapshotted at submission so the engine guards
 * stay stable for the rest of the cycle. When the answer is corrected
 * afterwards that snapshot goes stale, and a company that turns out to have no
 * CSE stays parked in `awaiting_cse_opinion` forever — the only way out used to
 * be depositing an opinion it cannot produce.
 *
 * So the snapshot is refreshed, and when the opinion is no longer owed the
 * engine closes the démarche through the `sync_cse_requirement` transition.
 * The opposite direction needs no transition: the engine already accepts
 * `submit_cse_opinion` from `demarche_completed`, so a company that gains a CSE
 * can still deposit its opinion.
 */
export async function syncCseRequirement({
	db,
	siren,
	year,
	workforce,
	hasCse,
	actorUserId,
}: SyncArgs): Promise<void> {
	const [declaration] = await db
		.select()
		.from(declarations)
		.where(activeDeclarationFilter(siren, year))
		.limit(1);

	if (!declaration) return;

	await applyOutcome(
		db,
		{
			id: declaration.id,
			siren,
			status: declaration.status,
			rulesVersion: declaration.rulesVersion,
			storedCseRequired: declaration.cseRequired,
			workforce,
			hasCse,
		},
		year,
		actorUserId,
	);
}

/**
 * Realign every démarche of a campaign year after the GIP file has been
 * reimported.
 *
 * This is the trigger the per-company path cannot be: a headcount changes
 * because a batch reimported the GIP file, not because a user answered a
 * question — and `updateHasCse`, the only other caller, sits behind a guard that
 * rejects any company under the CSE threshold. A démarche parked on the CSE step
 * whose headcount then drops below the threshold had no way out at all.
 *
 * Selection stays deliberately dumb: every active declaration of the year whose
 * snapshot still claims an opinion is owed. That is a small superset — the rule
 * itself is applied by `resolveCseReconciliation`, so the batch and the
 * per-company path cannot disagree, and no SQL predicate can drift from the
 * domain the day the threshold moves.
 *
 * A company that disappeared from the file is covered by the same rule as one
 * whose headcount dropped: the left join yields no row, and
 * `getObligationWorkforce` reads a missing headcount as 0.
 *
 * Runs after the import transaction commits, so a failure here cannot roll the
 * import back. Failures are per-declaration and non-fatal: a concurrent import
 * may have released the same démarche already, which the engine rejects because
 * `awaiting_cse_opinion` is no longer the current state.
 */
export async function reconcileCseRequirementForYear({
	db,
	year,
}: {
	db: DB;
	year: number;
}): Promise<{ reconciled: number; failed: number }> {
	const rows = await db
		.select({
			id: declarations.id,
			siren: declarations.siren,
			status: declarations.status,
			rulesVersion: declarations.rulesVersion,
			storedCseRequired: declarations.cseRequired,
			workforceEma: gipMdsData.workforceEma,
			hasCse: companies.hasCse,
		})
		.from(declarations)
		.innerJoin(companies, eq(companies.siren, declarations.siren))
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, declarations.siren),
				eq(gipMdsData.year, declarations.year),
			),
		)
		.where(
			and(
				eq(declarations.year, year),
				eq(declarations.cseRequired, true),
				notCancelledCondition(),
			),
		);

	let reconciled = 0;
	let failed = 0;

	for (const row of rows) {
		try {
			const changed = await applyOutcome(
				db,
				{
					id: row.id,
					siren: row.siren,
					status: row.status,
					rulesVersion: row.rulesVersion,
					storedCseRequired: row.storedCseRequired,
					workforce: getObligationWorkforce(
						parseGipWorkforce(row.workforceEma),
					),
					hasCse: row.hasCse,
				},
				year,
				null,
			);
			if (changed) reconciled += 1;
		} catch (error) {
			failed += 1;
			console.error(
				`[cse-requirement-sync] reconciliation failed for declaration ${row.id}`,
				error,
			);
		}
	}

	return { reconciled, failed };
}
