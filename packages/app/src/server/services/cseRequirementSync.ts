import "server-only";

import { isCseOpinionRequired } from "~/modules/domain";
import { activeDeclarationFilter } from "~/server/api/routers/declarationHelpers";
import {
	buildHistoryInserts,
	computeProjectionUpdates,
} from "~/server/api/routers/statusHistoryHelpers";
import type { DB } from "~/server/db";
import { declarationStatusHistory, declarations } from "~/server/db/schema";
import { applyAction, loadRules } from "~/server/rules/engine";

type SyncArgs = {
	db: DB;
	siren: string;
	year: number;
	workforce: number;
	hasCse: boolean | null;
	actorUserId: string | null;
};

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
	const cseRequired = isCseOpinionRequired({ workforce, hasCse });

	const [declaration] = await db
		.select()
		.from(declarations)
		.where(activeDeclarationFilter(siren, year))
		.limit(1);

	if (!declaration || declaration.cseRequired === cseRequired) return;

	// Only a démarche parked on the CSE step needs to be unblocked; anywhere
	// else refreshing the snapshot is enough, the engine reads it downstream.
	if (cseRequired || declaration.status !== "awaiting_cse_opinion") {
		await db
			.update(declarations)
			.set({ cseRequired, updatedAt: new Date() })
			.where(activeDeclarationFilter(siren, year));
		return;
	}

	const { nextStatus, events } = applyAction(
		{ currentState: declaration.status, cseRequired },
		"sync_cse_requirement",
		loadRules(declaration.rulesVersion),
	);
	const projection = computeProjectionUpdates(events, nextStatus);
	const historyInserts = buildHistoryInserts(
		declaration.id,
		events,
		actorUserId,
	);

	await db.transaction(async (tx) => {
		await tx.insert(declarationStatusHistory).values(historyInserts);
		await tx
			.update(declarations)
			.set({ ...projection, cseRequired, updatedAt: new Date() })
			.where(activeDeclarationFilter(siren, year));
	});
}
