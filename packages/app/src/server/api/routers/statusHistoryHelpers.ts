import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
	DECLARATION_SUPERSEDED_MESSAGE,
	type DeclarationFsmStatus,
	deriveSubsequentSubmissions,
	getLastTransmission,
	isLockedBySubsequentSubmission,
	type LastTransmission,
	SUBSEQUENT_SUBMISSION_EVENT_TYPES,
	type SubmissionLockTarget,
	type SubsequentSubmissions,
} from "~/modules/domain";
import type { DB } from "~/server/db";
import { declarationStatusHistory, declarations } from "~/server/db/schema";
import {
	applyAction,
	type Facts,
	NoMatchingTransitionError,
	type RuleEvent,
	type Rules,
} from "~/server/rules/engine";
import { activeDeclarationFilter } from "./declarationHelpers";

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

export async function loadSubsequentSubmissions(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<SubsequentSubmissions> {
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
					...SUBSEQUENT_SUBMISSION_EVENT_TYPES,
				]),
			),
		);
	return deriveSubsequentSubmissions(rows);
}

type TransmissionHistoryRow = {
	eventType: string;
	round: number | null;
	createdAt: Date;
};

// The trajectory projections (flags, last transmission, current round) all read
// the same rows: one query answers the whole screen rather than one per fact.
function selectTransmissionHistory(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<TransmissionHistoryRow[]> {
	return database
		.select({
			eventType: declarationStatusHistory.eventType,
			round: declarationStatusHistory.round,
			createdAt: declarationStatusHistory.createdAt,
		})
		.from(declarationStatusHistory)
		.where(eq(declarationStatusHistory.declarationId, declarationId));
}

export type DeclarationTrajectorySnapshot = SubsequentSubmissions & {
	lastTransmission: LastTransmission | null;
};

export async function loadDeclarationTrajectory(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<DeclarationTrajectorySnapshot> {
	const rows = await selectTransmissionHistory(database, declarationId);
	return {
		...deriveSubsequentSubmissions(rows),
		lastTransmission: getLastTransmission(rows),
	};
}

export async function loadLastTransmission(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<LastTransmission | null> {
	return getLastTransmission(
		await selectTransmissionHistory(database, declarationId),
	);
}

export function deriveCurrentRound(
	events: ReadonlyArray<{ eventType: string }>,
): 1 | 2 {
	return events.some((event) => event.eventType === "second_declaration_submit")
		? 2
		: 1;
}

export async function loadTransmissionState(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<{ lastTransmission: LastTransmission | null; round: 1 | 2 }> {
	const rows = await selectTransmissionHistory(database, declarationId);
	return {
		lastTransmission: getLastTransmission(rows),
		round: deriveCurrentRound(rows),
	};
}

export async function isLockedBySubsequentSubmissionFor(
	database: StatusHistoryReader,
	declarationId: string,
	target: SubmissionLockTarget,
): Promise<boolean> {
	return isLockedBySubsequentSubmission(
		await loadSubsequentSubmissions(database, declarationId),
		target,
	);
}

export async function hasLockingEventForRound(
	database: StatusHistoryReader,
	declarationId: string,
	round: 1 | 2,
): Promise<boolean> {
	return isLockedBySubsequentSubmissionFor(
		database,
		declarationId,
		round === 1 ? "path_choice_round_1" : "path_choice_round_2",
	);
}

export async function assertFirstDeclarationModifiable(
	database: StatusHistoryReader,
	declarationId: string,
): Promise<void> {
	if (
		await isLockedBySubsequentSubmissionFor(
			database,
			declarationId,
			"first_declaration",
		)
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: DECLARATION_SUPERSEDED_MESSAGE,
		});
	}
}

export type DeclarationTransaction = StatusHistoryReader & {
	execute: DB["execute"];
};

export async function lockDeclaration(
	tx: DeclarationTransaction,
	declarationId: string,
): Promise<void> {
	await tx.execute(
		sql`SELECT pg_advisory_xact_lock(hashtextextended(${declarationId}, 0))`,
	);
}

export async function lockAndReadDeclaration(
	tx: DeclarationTransaction,
	declarationId: string,
	siren: string,
	year: number,
): Promise<typeof declarations.$inferSelect> {
	await lockDeclaration(tx, declarationId);
	const [declaration] = await tx
		.select()
		.from(declarations)
		.where(
			and(
				eq(declarations.id, declarationId),
				activeDeclarationFilter(siren, year),
			),
		)
		.limit(1);
	if (!declaration)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Déclaration introuvable",
		});
	return declaration;
}

export async function assertFirstDeclarationModifiableUnderLock(
	tx: DeclarationTransaction,
	declarationId: string,
): Promise<void> {
	await lockDeclaration(tx, declarationId);
	await assertFirstDeclarationModifiable(tx, declarationId);
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
	return deriveCurrentRound(rows);
}

export function applyActionOrRefuse(
	facts: Facts,
	action: string,
	rules: Rules,
	refusalMessage: string,
): ReturnType<typeof applyAction> {
	try {
		return applyAction(facts, action, rules);
	} catch (error) {
		if (error instanceof NoMatchingTransitionError) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: refusalMessage,
				cause: error,
			});
		}
		throw error;
	}
}

export type ProjectionUpdate = Partial<typeof declarations.$inferInsert>;

export function computeProjectionUpdates(
	events: ReadonlyArray<RuleEvent>,
	nextStatus: DeclarationFsmStatus,
): ProjectionUpdate {
	const projection: ProjectionUpdate = {
		status: nextStatus,
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
