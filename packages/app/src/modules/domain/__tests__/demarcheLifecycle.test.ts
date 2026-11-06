import { describe, expect, it } from "vitest";

import { loadRules } from "~/server/rules/engine";
import { DECLARATION_PROCESS_STEP_LABELS } from "../shared/declarationProcessStep";
import {
	DEMARCHE_LIFECYCLE_STATUSES,
	type DemarcheLifecycleStatus,
	getDemarcheLifecycleStatus,
	getDemarcheNextStepLabel,
	getDemarcheStatusDate,
	isTransmissionEventType,
	TRANSMISSION_EVENT_TYPES,
} from "../shared/demarcheLifecycle";
import { DECLARATION_FSM_STATUSES, type DeclarationFsmStatus } from "../types";

const EXPECTED_ACTIVE_STATUS: Record<
	DeclarationFsmStatus,
	DemarcheLifecycleStatus
> = {
	draft: "draft",
	awaiting_compliance_path_choice: "in_progress",
	corrective_actions_chosen: "in_progress",
	joint_evaluation_chosen: "in_progress",
	awaiting_revision_choice: "in_progress",
	revised_joint_evaluation_chosen: "in_progress",
	awaiting_cse_opinion: "in_progress",
	demarche_completed: "completed",
};

describe("getDemarcheLifecycleStatus", () => {
	it.each(
		DECLARATION_FSM_STATUSES,
	)("classifies the active %s démarche", (status) => {
		expect(getDemarcheLifecycleStatus({ status, cancelledAt: null })).toBe(
			EXPECTED_ACTIVE_STATUS[status],
		);
	});

	it.each(
		DECLARATION_FSM_STATUSES,
	)("lets the cancellation win over the %s state", (status) => {
		expect(
			getDemarcheLifecycleStatus({
				status,
				cancelledAt: new Date("2027-03-18T00:00:00Z"),
			}),
		).toBe("cancelled");
	});

	it("reaches every one of the four statuses", () => {
		const reached = new Set([
			...DECLARATION_FSM_STATUSES.map((status) =>
				getDemarcheLifecycleStatus({ status, cancelledAt: null }),
			),
			getDemarcheLifecycleStatus({
				status: "draft",
				cancelledAt: new Date(),
			}),
		]);
		expect([...reached].sort()).toEqual(
			[...DEMARCHE_LIFECYCLE_STATUSES].sort(),
		);
	});
});

describe("getDemarcheStatusDate", () => {
	const sources = {
		openedAt: new Date("2027-03-10T09:00:00Z"),
		lastTransmissionAt: new Date("2027-03-15T09:00:00Z"),
		completedAt: new Date("2027-03-20T09:00:00Z"),
		cancelledAt: new Date("2027-03-18T09:00:00Z"),
	};
	const noSources = {
		openedAt: null,
		lastTransmissionAt: null,
		completedAt: null,
		cancelledAt: null,
	};

	it.each([
		["draft", sources.openedAt],
		["in_progress", sources.lastTransmissionAt],
		["completed", sources.completedAt],
		["cancelled", sources.cancelledAt],
	] as const)("dates a %s démarche from its own source", (status, expected) => {
		expect(getDemarcheStatusDate(status, sources)).toEqual(expected);
	});

	it.each(
		DEMARCHE_LIFECYCLE_STATUSES,
	)("returns null for a %s démarche whose source date is missing", (status) => {
		expect(getDemarcheStatusDate(status, noSources)).toBeNull();
	});
});

describe("getDemarcheNextStepLabel", () => {
	it.each(
		DECLARATION_FSM_STATUSES.filter(
			(status) => status !== "demarche_completed",
		),
	)("gives the my-space step label of the %s state while the démarche is open", (fsmStatus) => {
		const status = getDemarcheLifecycleStatus({
			status: fsmStatus,
			cancelledAt: null,
		});
		expect(getDemarcheNextStepLabel(status, fsmStatus)).toBe(
			DECLARATION_PROCESS_STEP_LABELS[fsmStatus],
		);
	});

	it("names the remuneration declaration as the next step of a draft", () => {
		expect(getDemarcheNextStepLabel("draft", "draft")).toBe(
			"Déclaration des indicateurs de rémunération",
		);
	});

	it.each([
		["completed", "demarche_completed"],
		["cancelled", "awaiting_cse_opinion"],
		["cancelled", "draft"],
	] as const)("has no next step for a %s démarche", (status, fsmStatus) => {
		expect(getDemarcheNextStepLabel(status, fsmStatus)).toBeNull();
	});
});

describe("isTransmissionEventType", () => {
	it.each(
		TRANSMISSION_EVENT_TYPES,
	)("counts %s as a transmission", (eventType) => {
		expect(isTransmissionEventType(eventType)).toBe(true);
	});

	it.each([
		"step_change",
		"demarche_complete",
		"cancel",
		"unknown",
	])("does not count %s as a transmission", (eventType) => {
		expect(isTransmissionEventType(eventType)).toBe(false);
	});
});

// A new event type emitted by the engine must be classified here, or this fails.
describe("transmission events — conformance with the rule engine", () => {
	const emittedTypes = new Set(
		loadRules("2027.1").transitions.flatMap((transition) =>
			transition.events.map((event) => event.type),
		),
	);

	it.each([
		...emittedTypes,
	])("classifies the emitted %s event as a transmission or as the completion", (eventType) => {
		expect(
			isTransmissionEventType(eventType) || eventType === "demarche_complete",
		).toBe(true);
	});

	it("emits every transmission type the domain declares", () => {
		for (const eventType of TRANSMISSION_EVENT_TYPES) {
			expect(emittedTypes).toContain(eventType);
		}
	});
});
