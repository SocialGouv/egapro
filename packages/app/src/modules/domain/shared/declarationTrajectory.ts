export type DeclarationEventType =
	| "submit"
	| "path_choice"
	| "second_declaration_submit"
	| "joint_evaluation_submit"
	| "cse_opinion_submit"
	| "cancel"
	| "demarche_complete";

export type DeclarationStatusEvent = {
	eventType: DeclarationEventType;
	value: string | null;
	round: number | null;
	createdAt: Date;
	actorUserId: string | null;
};

export type TrajectoryEntry = {
	type: DeclarationEventType;
	value: string | null;
	round: number | null;
	at: Date;
	actor: string | null;
};

export function getDeclarationTrajectory(
	events: ReadonlyArray<DeclarationStatusEvent>,
): TrajectoryEntry[] {
	return events
		.slice()
		.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
		.map((e) => ({
			type: e.eventType,
			value: e.value,
			round: e.round,
			at: e.createdAt,
			actor: e.actorUserId,
		}));
}

export function findLastEvent(
	events: ReadonlyArray<DeclarationStatusEvent>,
	predicate: (event: DeclarationStatusEvent) => boolean,
): DeclarationStatusEvent | null {
	let latest: DeclarationStatusEvent | null = null;
	for (const event of events) {
		if (!predicate(event)) continue;
		if (latest === null || event.createdAt > latest.createdAt) {
			latest = event;
		}
	}
	return latest;
}

export function hasEvent(
	events: ReadonlyArray<DeclarationStatusEvent>,
	predicate: (event: DeclarationStatusEvent) => boolean,
): boolean {
	for (const event of events) {
		if (predicate(event)) return true;
	}
	return false;
}

export function getEventTimestamp(
	events: ReadonlyArray<DeclarationStatusEvent>,
	predicate: (event: DeclarationStatusEvent) => boolean,
): Date | null {
	const last = findLastEvent(events, predicate);
	return last ? last.createdAt : null;
}

export function getSubmittedAt(
	events: ReadonlyArray<DeclarationStatusEvent>,
): Date | null {
	return getEventTimestamp(events, (e) => e.eventType === "submit");
}

export function getSecondDeclarationSubmittedAt(
	events: ReadonlyArray<DeclarationStatusEvent>,
): Date | null {
	return getEventTimestamp(
		events,
		(e) => e.eventType === "second_declaration_submit",
	);
}

export function getJointEvaluationSubmittedAt(
	events: ReadonlyArray<DeclarationStatusEvent>,
): Date | null {
	return getEventTimestamp(
		events,
		(e) => e.eventType === "joint_evaluation_submit",
	);
}

export function getCseOpinionCompletedAt(
	events: ReadonlyArray<DeclarationStatusEvent>,
): Date | null {
	return getEventTimestamp(events, (e) => e.eventType === "cse_opinion_submit");
}

export function getDemarcheCompletedAt(
	events: ReadonlyArray<DeclarationStatusEvent>,
): Date | null {
	return getEventTimestamp(events, (e) => e.eventType === "demarche_complete");
}

export function getPathChoiceAt(
	events: ReadonlyArray<DeclarationStatusEvent>,
	round: 1 | 2,
): Date | null {
	return getEventTimestamp(
		events,
		(e) => e.eventType === "path_choice" && e.round === round,
	);
}

export const SUBSEQUENT_SUBMISSION_EVENT_TYPES = [
	"second_declaration_submit",
	"joint_evaluation_submit",
	"cse_opinion_submit",
] as const satisfies ReadonlyArray<DeclarationEventType>;

export type SubmissionHistoryEvent = {
	eventType: string;
	round: number | null;
};

export type SubsequentSubmissions = {
	hasSubmittedSecondDeclaration: boolean;
	secondDeclarationSubmissionCount: number;
	hasSubmittedJointEvaluation: boolean;
	hasSubmittedRound1JointEvaluation: boolean;
	hasSubmittedCseOpinion: boolean;
};

export function deriveSubsequentSubmissions(
	events: ReadonlyArray<SubmissionHistoryEvent>,
): SubsequentSubmissions {
	let secondDeclarationSubmissionCount = 0;
	let hasSubmittedJointEvaluation = false;
	let hasSubmittedRound1JointEvaluation = false;
	let hasSubmittedCseOpinion = false;
	for (const event of events) {
		switch (event.eventType) {
			case "second_declaration_submit":
				secondDeclarationSubmissionCount++;
				break;
			case "joint_evaluation_submit":
				hasSubmittedJointEvaluation = true;
				if (event.round === 1) hasSubmittedRound1JointEvaluation = true;
				break;
			case "cse_opinion_submit":
				hasSubmittedCseOpinion = true;
				break;
		}
	}
	return {
		hasSubmittedSecondDeclaration: secondDeclarationSubmissionCount > 0,
		secondDeclarationSubmissionCount,
		hasSubmittedJointEvaluation,
		hasSubmittedRound1JointEvaluation,
		hasSubmittedCseOpinion,
	};
}

export function hasSubmittedSecondDeclaration(
	events: ReadonlyArray<DeclarationStatusEvent>,
): boolean {
	return deriveSubsequentSubmissions(events).hasSubmittedSecondDeclaration;
}
