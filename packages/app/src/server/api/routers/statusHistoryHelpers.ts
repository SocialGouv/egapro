import { and, desc, eq, inArray } from "drizzle-orm";
import type { DB } from "~/server/db";
import {
	declarationStatusHistory,
	type declarations,
} from "~/server/db/schema";
import type { RuleEvent } from "~/server/rules/engine";

type DbLike = DB | Parameters<DB["transaction"]>[0] extends (
	tx: infer T,
) => unknown
	? T
	: never;

export type StatusHistoryReader = {
	select: DB["select"];
};

export type StatusHistoryRow = typeof declarationStatusHistory.$inferSelect;

export async function loadDeclarationHistory(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<StatusHistoryRow[]> {
	return database
		.select()
		.from(declarationStatusHistory)
		.where(eq(declarationStatusHistory.declarationId, declarationId));
}

export async function hasLockingEventForRound(
	database: StatusHistoryReader,
	declarationId: string,
	round: 1 | 2,
): Promise<boolean> {
	const rows = await database
		.select({
			eventType: declarationStatusHistory.eventType,
			round: declarationStatusHistory.round,
		})
		.from(declarationStatusHistory)
		.where(
			and(
				eq(declarationStatusHistory.declarationId, declarationId),
				inArray(declarationStatusHistory.eventType, [
					"joint_evaluation_submit",
					"cse_opinion_submit",
				]),
			),
		);

	for (const row of rows) {
		if (row.eventType === "cse_opinion_submit") return true;
		if (row.eventType === "joint_evaluation_submit") {
			if (round === 2) return true;
			if (round === 1 && row.round === 1) return true;
		}
	}
	return false;
}

export async function getCurrentRound(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<1 | 2> {
	const rows = await database
		.select({ eventType: declarationStatusHistory.eventType })
		.from(declarationStatusHistory)
		.where(
			and(
				eq(declarationStatusHistory.declarationId, declarationId),
				eq(declarationStatusHistory.eventType, "second_declaration_submit"),
			),
		)
		.limit(1);
	return rows.length > 0 ? 2 : 1;
}

export type ProjectionUpdate = Partial<typeof declarations.$inferInsert>;

export function computeProjectionUpdates(
	events: ReadonlyArray<RuleEvent>,
	nextStatus: string,
): ProjectionUpdate {
	const projection: ProjectionUpdate = {
		status: nextStatus as typeof declarations.$inferInsert.status,
	};

	for (const event of events) {
		if (event.type === "path_choice" && event.value !== undefined) {
			const value = event.value as
				| "justify"
				| "corrective_action"
				| "joint_evaluation";
			if (event.round === 1) {
				projection.firstDeclarationPathChoice = value;
			} else if (event.round === 2) {
				projection.secondDeclarationPathChoice = value;
			}
		}
	}

	return projection;
}

export type DbInsertableHistory = typeof declarationStatusHistory.$inferInsert;

export function buildHistoryInserts(
	declarationId: string,
	events: ReadonlyArray<RuleEvent>,
	actorUserId: string | null,
): DbInsertableHistory[] {
	return events.map((event) => ({
		declarationId,
		eventType: event.type,
		value: event.value ?? null,
		round: event.round ?? null,
		actorUserId,
	}));
}

/**
 * Build a `step_change` history row payload for the declaration A–F stepper.
 *
 * `fromStep === null` flags the creation transition (no previous step).
 * Encoded into the existing `value` column as `from:<N>|to:<M>` to avoid a
 * dedicated columns set ; the readable `toStep` also goes into `round` for
 * lightweight SQL aggregation downstream (KPI K4, future funnel).
 */
export function buildStepChangeInsert(args: {
	declarationId: string;
	fromStep: number | null;
	toStep: number;
	actorUserId: string | null;
}): DbInsertableHistory {
	const fromLabel = args.fromStep === null ? "null" : String(args.fromStep);
	return {
		declarationId: args.declarationId,
		eventType: "step_change",
		value: `from:${fromLabel}|to:${args.toStep}`,
		round: args.toStep,
		actorUserId: args.actorUserId,
	};
}

export async function getLatestPathChoice(
	database: StatusHistoryReader,
	declarationId: string,
	round: 1 | 2,
): Promise<string | null> {
	const rows = await database
		.select({ value: declarationStatusHistory.value })
		.from(declarationStatusHistory)
		.where(
			and(
				eq(declarationStatusHistory.declarationId, declarationId),
				eq(declarationStatusHistory.eventType, "path_choice"),
				eq(declarationStatusHistory.round, round),
			),
		)
		.orderBy(desc(declarationStatusHistory.createdAt))
		.limit(1);
	return rows[0]?.value ?? null;
}

export type { DbLike };
