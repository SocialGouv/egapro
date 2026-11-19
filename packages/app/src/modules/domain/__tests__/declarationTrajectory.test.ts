import { describe, expect, it } from "vitest";

import {
	type DeclarationStatusEvent,
	deriveSubsequentSubmissions,
	findLastEvent,
	getCseOpinionCompletedAt,
	getDeclarationTrajectory,
	getDemarcheCompletedAt,
	getEventTimestamp,
	getJointEvaluationSubmittedAt,
	getLastTransmission,
	getPathChoiceAt,
	getSecondDeclarationSubmittedAt,
	getSubmittedAt,
	hasEvent,
	hasSubmittedSecondDeclaration,
	isJointEvaluationFileTransmitted,
	isLastTransmissionPathChoice,
} from "../shared/declarationTrajectory";

const at = (iso: string) => new Date(iso);

function buildEvent(
	overrides: Partial<DeclarationStatusEvent>,
): DeclarationStatusEvent {
	return {
		eventType: "submit",
		value: null,
		round: null,
		actorUserId: null,
		createdAt: at("2027-03-01T10:00:00Z"),
		...overrides,
	};
}

describe("getDeclarationTrajectory", () => {
	it("returns events ordered ascending by createdAt", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({ createdAt: at("2027-05-01T00:00:00Z") }),
			buildEvent({
				eventType: "path_choice",
				value: "corrective_action",
				round: 1,
				createdAt: at("2027-03-15T00:00:00Z"),
			}),
		];
		const trajectory = getDeclarationTrajectory(events);
		expect(trajectory).toEqual([
			{
				type: "path_choice",
				value: "corrective_action",
				round: 1,
				at: at("2027-03-15T00:00:00Z"),
				actor: null,
			},
			{
				type: "submit",
				value: null,
				round: null,
				at: at("2027-05-01T00:00:00Z"),
				actor: null,
			},
		]);
	});

	it("returns an empty array for an empty history", () => {
		expect(getDeclarationTrajectory([])).toEqual([]);
	});
});

describe("findLastEvent", () => {
	it("returns the latest event matching the predicate", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "path_choice",
				value: "justify",
				round: 1,
				createdAt: at("2027-03-01T00:00:00Z"),
			}),
			buildEvent({
				eventType: "path_choice",
				value: "corrective_action",
				round: 1,
				createdAt: at("2027-04-01T00:00:00Z"),
			}),
		];
		const latest = findLastEvent(events, (e) => e.eventType === "path_choice");
		expect(latest?.value).toBe("corrective_action");
	});

	it("returns null when no event matches", () => {
		expect(findLastEvent([], () => true)).toBeNull();
	});
});

describe("hasEvent", () => {
	it("returns true when at least one event matches", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({ eventType: "second_declaration_submit" }),
		];
		expect(
			hasEvent(events, (e) => e.eventType === "second_declaration_submit"),
		).toBe(true);
	});

	it("returns false when no event matches", () => {
		expect(hasEvent([], () => true)).toBe(false);
	});
});

describe("getEventTimestamp", () => {
	it("returns the latest matching event's createdAt", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({ createdAt: at("2027-03-01T10:00:00Z") }),
			buildEvent({ createdAt: at("2027-05-01T10:00:00Z") }),
		];
		expect(getEventTimestamp(events, () => true)).toEqual(
			at("2027-05-01T10:00:00Z"),
		);
	});

	it("returns null when no event matches", () => {
		expect(getEventTimestamp([], () => true)).toBeNull();
	});
});

describe("event-type-specific getters", () => {
	it("getSubmittedAt returns the latest submit event timestamp", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "submit",
				createdAt: at("2027-03-01T00:00:00Z"),
			}),
		];
		expect(getSubmittedAt(events)).toEqual(at("2027-03-01T00:00:00Z"));
	});

	it("getSecondDeclarationSubmittedAt returns the latest second_declaration_submit event", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "second_declaration_submit",
				round: 2,
				createdAt: at("2027-06-01T00:00:00Z"),
			}),
		];
		expect(getSecondDeclarationSubmittedAt(events)).toEqual(
			at("2027-06-01T00:00:00Z"),
		);
	});

	it("getJointEvaluationSubmittedAt returns the latest joint_evaluation_submit event", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "joint_evaluation_submit",
				round: 1,
				createdAt: at("2027-07-01T00:00:00Z"),
			}),
		];
		expect(getJointEvaluationSubmittedAt(events)).toEqual(
			at("2027-07-01T00:00:00Z"),
		);
	});

	it("getCseOpinionCompletedAt returns the latest cse_opinion_submit event", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "cse_opinion_submit",
				createdAt: at("2027-08-01T00:00:00Z"),
			}),
		];
		expect(getCseOpinionCompletedAt(events)).toEqual(
			at("2027-08-01T00:00:00Z"),
		);
	});

	it("getDemarcheCompletedAt returns the latest demarche_complete event", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "demarche_complete",
				createdAt: at("2027-09-01T00:00:00Z"),
			}),
		];
		expect(getDemarcheCompletedAt(events)).toEqual(at("2027-09-01T00:00:00Z"));
	});

	it("getPathChoiceAt returns the latest path_choice for the given round", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "path_choice",
				value: "corrective_action",
				round: 1,
				createdAt: at("2027-04-01T00:00:00Z"),
			}),
			buildEvent({
				eventType: "path_choice",
				value: "justify",
				round: 2,
				createdAt: at("2027-08-01T00:00:00Z"),
			}),
		];
		expect(getPathChoiceAt(events, 1)).toEqual(at("2027-04-01T00:00:00Z"));
		expect(getPathChoiceAt(events, 2)).toEqual(at("2027-08-01T00:00:00Z"));
	});

	it("hasSubmittedSecondDeclaration returns true when a second_declaration_submit event exists", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({ eventType: "second_declaration_submit", round: 2 }),
		];
		expect(hasSubmittedSecondDeclaration(events)).toBe(true);
	});

	it("hasSubmittedSecondDeclaration returns false when no such event exists", () => {
		expect(hasSubmittedSecondDeclaration([])).toBe(false);
	});

	it("deriveSubsequentSubmissions counts every second declaration submission and flags the downstream ones", () => {
		expect(
			deriveSubsequentSubmissions([
				{ eventType: "submit", round: null },
				{ eventType: "second_declaration_submit", round: null },
				{ eventType: "step_change", round: 2 },
				{ eventType: "second_declaration_submit", round: null },
				{ eventType: "joint_evaluation_submit", round: 2 },
				{ eventType: "cse_opinion_submit", round: null },
			]),
		).toEqual({
			hasSubmittedSecondDeclaration: true,
			secondDeclarationSubmissionCount: 2,
			hasSubmittedJointEvaluation: true,
			hasSubmittedRound1JointEvaluation: false,
			hasSubmittedCseOpinion: true,
		});
	});

	it("deriveSubsequentSubmissions flags a round-1 joint evaluation submission", () => {
		expect(
			deriveSubsequentSubmissions([
				{ eventType: "joint_evaluation_submit", round: 1 },
			]),
		).toMatchObject({
			hasSubmittedJointEvaluation: true,
			hasSubmittedRound1JointEvaluation: true,
		});
	});

	it("deriveSubsequentSubmissions reports nothing submitted without downstream events", () => {
		expect(
			deriveSubsequentSubmissions([
				{ eventType: "submit", round: null },
				{ eventType: "path_choice", round: 1 },
			]),
		).toEqual({
			hasSubmittedSecondDeclaration: false,
			secondDeclarationSubmissionCount: 0,
			hasSubmittedJointEvaluation: false,
			hasSubmittedRound1JointEvaluation: false,
			hasSubmittedCseOpinion: false,
		});
	});

	it("path tâtonnement: 3 path_choice events round=1 preserves the latest as winner", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "path_choice",
				value: "corrective_action",
				round: 1,
				createdAt: at("2027-04-01T10:00:00Z"),
			}),
			buildEvent({
				eventType: "path_choice",
				value: "joint_evaluation",
				round: 1,
				createdAt: at("2027-04-02T10:00:00Z"),
			}),
			buildEvent({
				eventType: "path_choice",
				value: "justify",
				round: 1,
				createdAt: at("2027-04-03T10:00:00Z"),
			}),
		];
		const latest = findLastEvent(
			events,
			(e) => e.eventType === "path_choice" && e.round === 1,
		);
		expect(latest?.value).toBe("justify");
		expect(getDeclarationTrajectory(events)).toHaveLength(3);
	});
});

describe("isJointEvaluationFileTransmitted", () => {
	const UPLOADED = at("2027-04-01T10:00:00Z");
	const SUBMITTED = at("2027-04-03T12:00:00Z");

	it("is true for a report the latest submit covers", () => {
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: UPLOADED,
				latestSubmitAt: SUBMITTED,
			}),
		).toBe(true);
	});

	it("is true for a report uploaded at the very instant of the submit", () => {
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: SUBMITTED,
				latestSubmitAt: SUBMITTED,
			}),
		).toBe(true);
	});

	it("is false without a report or without a submit", () => {
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: null,
				latestSubmitAt: SUBMITTED,
			}),
		).toBe(false);
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: UPLOADED,
				latestSubmitAt: null,
			}),
		).toBe(false);
	});

	it("is false for a replacement uploaded after the latest submit", () => {
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: at("2027-04-05T10:00:00Z"),
				latestSubmitAt: SUBMITTED,
			}),
		).toBe(false);
	});

	it("is false for a report the company departed from since", () => {
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: UPLOADED,
				latestSubmitAt: SUBMITTED,
				latestDepartureAt: at("2027-04-02T10:00:00Z"),
			}),
		).toBe(false);
	});

	it("is true for a report uploaded after an earlier departure", () => {
		expect(
			isJointEvaluationFileTransmitted({
				fileUploadedAt: UPLOADED,
				latestSubmitAt: SUBMITTED,
				latestDepartureAt: at("2027-03-20T10:00:00Z"),
			}),
		).toBe(true);
	});
});

describe("getLastTransmission", () => {
	it("returns null when the trajectory carries no transmission", () => {
		expect(getLastTransmission([])).toBeNull();
		expect(
			getLastTransmission([
				buildEvent({ eventType: "demarche_complete" }),
				buildEvent({ eventType: "cancel" }),
			]),
		).toBeNull();
	});

	it("maps each transmission event to its step", () => {
		expect(getLastTransmission([buildEvent({ eventType: "submit" })])).toBe(
			"first_declaration",
		);
		expect(
			getLastTransmission([buildEvent({ eventType: "path_choice", round: 1 })]),
		).toBe("path_choice_round_1");
		expect(
			getLastTransmission([buildEvent({ eventType: "path_choice", round: 2 })]),
		).toBe("path_choice_round_2");
		expect(
			getLastTransmission([
				buildEvent({ eventType: "second_declaration_submit", round: 2 }),
			]),
		).toBe("second_declaration");
		expect(
			getLastTransmission([
				buildEvent({ eventType: "joint_evaluation_submit", round: 1 }),
			]),
		).toBe("joint_evaluation");
		expect(
			getLastTransmission([buildEvent({ eventType: "cse_opinion_submit" })]),
		).toBe("cse_opinion");
	});

	it("keeps the latest transmission of a closed démarche", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "submit",
				createdAt: at("2027-03-01T10:00:00Z"),
			}),
			buildEvent({
				eventType: "path_choice",
				round: 1,
				value: "joint_evaluation",
				createdAt: at("2027-03-02T10:00:00Z"),
			}),
			buildEvent({
				eventType: "joint_evaluation_submit",
				round: 1,
				createdAt: at("2027-03-03T10:00:00Z"),
			}),
			buildEvent({
				eventType: "demarche_complete",
				createdAt: at("2027-03-03T10:00:01Z"),
			}),
		];

		expect(getLastTransmission(events)).toBe("joint_evaluation");
	});

	it("ignores loop-back events and the formal-notice flow", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "second_declaration_submit",
				round: 2,
				createdAt: at("2027-03-01T10:00:00Z"),
			}),
			buildEvent({
				eventType: "demarche_complete",
				createdAt: at("2027-03-01T10:00:01Z"),
			}),
			buildEvent({
				eventType: "formal_notice_joint_evaluation_submit",
				createdAt: at("2027-03-02T10:00:00Z"),
			}),
		];

		expect(getLastTransmission(events)).toBe("second_declaration");
	});

	it("treats a re-transmission as the new last transmission", () => {
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "joint_evaluation_submit",
				round: 1,
				createdAt: at("2027-03-03T10:00:00Z"),
			}),
			buildEvent({
				eventType: "demarche_complete",
				createdAt: at("2027-03-03T10:00:01Z"),
			}),
			buildEvent({
				eventType: "joint_evaluation_submit",
				round: 1,
				createdAt: at("2027-04-03T10:00:00Z"),
			}),
			buildEvent({
				eventType: "demarche_complete",
				createdAt: at("2027-04-03T10:00:01Z"),
			}),
		];

		expect(getLastTransmission(events)).toBe("joint_evaluation");
	});

	it("breaks a timestamp tie with the flow precedence", () => {
		const sameInstant = at("2027-03-03T10:00:00Z");
		const events: DeclarationStatusEvent[] = [
			buildEvent({
				eventType: "joint_evaluation_submit",
				round: 1,
				createdAt: sameInstant,
			}),
			buildEvent({ eventType: "cse_opinion_submit", createdAt: sameInstant }),
		];

		expect(getLastTransmission(events)).toBe("cse_opinion");
	});
});

describe("isLastTransmissionPathChoice", () => {
	it("is true for either path-choice round", () => {
		expect(isLastTransmissionPathChoice("path_choice_round_1")).toBe(true);
		expect(isLastTransmissionPathChoice("path_choice_round_2")).toBe(true);
	});

	it("is false for any other transmission or no transmission", () => {
		expect(isLastTransmissionPathChoice("first_declaration")).toBe(false);
		expect(isLastTransmissionPathChoice("second_declaration")).toBe(false);
		expect(isLastTransmissionPathChoice("joint_evaluation")).toBe(false);
		expect(isLastTransmissionPathChoice("cse_opinion")).toBe(false);
		expect(isLastTransmissionPathChoice(null)).toBe(false);
	});
});
