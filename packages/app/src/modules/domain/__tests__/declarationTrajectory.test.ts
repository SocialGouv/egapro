import { describe, expect, it } from "vitest";

import {
	type DeclarationStatusEvent,
	findLastEvent,
	getCseOpinionCompletedAt,
	getDeclarationTrajectory,
	getDemarcheCompletedAt,
	getEventTimestamp,
	getJointEvaluationSubmittedAt,
	getPathChoiceAt,
	getSecondDeclarationSubmittedAt,
	getSubmittedAt,
	hasEvent,
	hasSubmittedSecondDeclaration,
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
