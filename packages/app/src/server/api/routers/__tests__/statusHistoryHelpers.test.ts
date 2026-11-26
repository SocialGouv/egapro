import { describe, expect, it } from "vitest";

import {
	buildStepChangeInsert,
	deriveCurrentRound,
	loadDeclarationTrajectory,
	loadLastTransmission,
	loadTransmissionState,
} from "../statusHistoryHelpers";

const at = (iso: string) => new Date(iso);

function historyReader(rows: unknown[]) {
	return {
		select: () => ({
			from: () => ({ where: () => Promise.resolve(rows) }),
		}),
	} as never;
}

describe("deriveCurrentRound", () => {
	it("stays on round 1 with no second-declaration submission", () => {
		expect(deriveCurrentRound([{ eventType: "submit" }])).toBe(1);
	});

	it("is round 2 once a second declaration was submitted", () => {
		expect(
			deriveCurrentRound([
				{ eventType: "submit" },
				{ eventType: "second_declaration_submit" },
			]),
		).toBe(2);
	});
});

describe("loadDeclarationTrajectory", () => {
	it("derives the submission flags and the last transmission from one read", async () => {
		const database = historyReader([
			{
				eventType: "submit",
				round: null,
				createdAt: at("2027-03-01T10:00:00Z"),
			},
			{
				eventType: "second_declaration_submit",
				round: 2,
				createdAt: at("2027-05-01T10:00:00Z"),
			},
		]);

		await expect(
			loadDeclarationTrajectory(database, "decl-1"),
		).resolves.toEqual({
			hasSubmittedSecondDeclaration: true,
			secondDeclarationSubmissionCount: 1,
			hasSubmittedJointEvaluation: false,
			hasSubmittedRound1JointEvaluation: false,
			hasSubmittedCseOpinion: false,
			lastTransmission: "second_declaration",
		});
	});
});

describe("loadLastTransmission", () => {
	it("ignores loop-back and closure events", async () => {
		const database = historyReader([
			{
				eventType: "joint_evaluation_submit",
				round: 1,
				createdAt: at("2027-05-01T10:00:00Z"),
			},
			{
				eventType: "demarche_complete",
				round: null,
				createdAt: at("2027-05-01T10:00:01Z"),
			},
			{
				eventType: "step_change",
				round: 5,
				createdAt: at("2027-05-01T10:00:02Z"),
			},
			{
				eventType: "cancel",
				round: null,
				createdAt: at("2027-05-01T10:00:03Z"),
			},
		]);

		await expect(loadLastTransmission(database, "decl-1")).resolves.toBe(
			"joint_evaluation",
		);
	});
});

describe("loadTransmissionState", () => {
	it("returns the last transmission and the round from the same rows", async () => {
		const database = historyReader([
			{
				eventType: "second_declaration_submit",
				round: 2,
				createdAt: at("2027-05-01T10:00:00Z"),
			},
			{
				eventType: "joint_evaluation_submit",
				round: 2,
				createdAt: at("2027-06-01T10:00:00Z"),
			},
		]);

		await expect(loadTransmissionState(database, "decl-1")).resolves.toEqual({
			lastTransmission: "joint_evaluation",
			round: 2,
		});
	});
});

describe("buildStepChangeInsert", () => {
	it("encodes the previous and next step into the history row", () => {
		const row = buildStepChangeInsert({
			declarationId: "decl-1",
			fromStep: 2,
			toStep: 3,
			actorUserId: "user-1",
		});

		expect(row).toEqual({
			declarationId: "decl-1",
			eventType: "step_change",
			value: "from:2|to:3",
			round: 3,
			actorUserId: "user-1",
		});
	});

	it("flags creation by encoding fromStep as 'null'", () => {
		const row = buildStepChangeInsert({
			declarationId: "decl-2",
			fromStep: null,
			toStep: 0,
			actorUserId: "user-2",
		});

		expect(row.value).toBe("from:null|to:0");
		expect(row.round).toBe(0);
	});

	it("propagates a null actor for system-triggered transitions", () => {
		const row = buildStepChangeInsert({
			declarationId: "decl-3",
			fromStep: 4,
			toStep: 5,
			actorUserId: null,
		});

		expect(row.actorUserId).toBeNull();
	});
});
