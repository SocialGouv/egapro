import { describe, expect, it } from "vitest";
import type { ProbeState } from "../persistence.js";
import { planPersist } from "../persistence.js";

const healthy: ProbeState = { status: "operational", consecutiveFailures: 0 };
const down: ProbeState = { status: "unavailable", consecutiveFailures: 1 };

describe("planPersist", () => {
	it("records a first healthy observation without opening an incident", () => {
		expect(planPersist(null, { status: "operational", latencyMs: 4 })).toEqual({
			status: "operational",
			consecutiveFailures: 0,
			changed: true,
			closeOpenIncident: false,
			openIncident: false,
		});
	});

	it("counts the first observation of a failure without inventing a transition", () => {
		expect(planPersist(null, { status: "unavailable", latencyMs: 4 })).toEqual({
			status: "unavailable",
			consecutiveFailures: 1,
			changed: true,
			closeOpenIncident: false,
			openIncident: false,
		});
	});

	it("opens an incident when a healthy probe fails", () => {
		expect(
			planPersist(healthy, { status: "unavailable", latencyMs: 30 }),
		).toEqual({
			status: "unavailable",
			consecutiveFailures: 1,
			changed: true,
			closeOpenIncident: true,
			openIncident: true,
		});
	});

	it("counts consecutive failures without opening another incident", () => {
		expect(
			planPersist(
				{ status: "unavailable", consecutiveFailures: 2 },
				{ status: "unavailable", latencyMs: 30 },
			),
		).toEqual({
			status: "unavailable",
			consecutiveFailures: 3,
			changed: false,
			closeOpenIncident: false,
			openIncident: false,
		});
	});

	it("closes the incident and resets the counter on recovery", () => {
		expect(planPersist(down, { status: "operational", latencyMs: 3 })).toEqual({
			status: "operational",
			consecutiveFailures: 0,
			changed: true,
			closeOpenIncident: true,
			openIncident: false,
		});
	});

	it("closes one incident and opens another when the failure changes shape", () => {
		expect(planPersist(down, { status: "degraded", latencyMs: 900 })).toEqual({
			status: "degraded",
			consecutiveFailures: 2,
			changed: true,
			closeOpenIncident: true,
			openIncident: true,
		});
	});

	it("treats misconfigured as a failure", () => {
		const plan = planPersist(healthy, {
			status: "misconfigured",
			latencyMs: 12,
		});

		expect(plan.openIncident).toBe(true);
		expect(plan.consecutiveFailures).toBe(1);
	});
});
