import { describe, expect, it } from "vitest";

import {
	isPhase2Required,
	isPhase2RevisionRequired,
} from "../shared/declarationFlags";
import type { DeclarationStatusEvent } from "../shared/declarationTrajectory";

describe("isPhase2Required", () => {
	it("returns true when workforce ≥ 100, indicator G computed, and gap ≥ 5%", () => {
		expect(
			isPhase2Required({ workforce: 300, hasIndicatorG: true, gap: 10 }),
		).toBe(true);
	});

	it("returns false when workforce < 100 even if gap is high", () => {
		expect(
			isPhase2Required({ workforce: 80, hasIndicatorG: true, gap: 10 }),
		).toBe(false);
	});

	it("returns false when no indicator G data", () => {
		expect(
			isPhase2Required({ workforce: 300, hasIndicatorG: false, gap: 10 }),
		).toBe(false);
	});

	it("returns false when gap < 5%", () => {
		expect(
			isPhase2Required({ workforce: 300, hasIndicatorG: true, gap: 3 }),
		).toBe(false);
	});

	it("returns false when workforce is null", () => {
		expect(
			isPhase2Required({ workforce: null, hasIndicatorG: true, gap: 10 }),
		).toBe(false);
	});

	it("returns false when gap is null", () => {
		expect(
			isPhase2Required({ workforce: 300, hasIndicatorG: true, gap: null }),
		).toBe(false);
	});

	it("returns true at the exact 100 / 5 thresholds", () => {
		expect(
			isPhase2Required({ workforce: 100, hasIndicatorG: true, gap: 5 }),
		).toBe(true);
	});
});

describe("isPhase2RevisionRequired", () => {
	const withSecondDecl: DeclarationStatusEvent[] = [
		{
			eventType: "second_declaration_submit",
			value: null,
			round: 2,
			actorUserId: null,
			createdAt: new Date("2027-06-01T00:00:00Z"),
		},
	];

	it("returns false when phase 2 was not required to start with", () => {
		expect(
			isPhase2RevisionRequired({
				workforce: 80,
				hasIndicatorG: true,
				gap: 10,
				correctionGap: 10,
				events: withSecondDecl,
			}),
		).toBe(false);
	});

	it("returns false when no second_declaration_submit event exists", () => {
		expect(
			isPhase2RevisionRequired({
				workforce: 300,
				hasIndicatorG: true,
				gap: 10,
				correctionGap: 10,
				events: [],
			}),
		).toBe(false);
	});

	it("returns false when correctionGap is null", () => {
		expect(
			isPhase2RevisionRequired({
				workforce: 300,
				hasIndicatorG: true,
				gap: 10,
				correctionGap: null,
				events: withSecondDecl,
			}),
		).toBe(false);
	});

	it("returns false when correctionGap is below 5%", () => {
		expect(
			isPhase2RevisionRequired({
				workforce: 300,
				hasIndicatorG: true,
				gap: 10,
				correctionGap: 2,
				events: withSecondDecl,
			}),
		).toBe(false);
	});

	it("returns true when phase 2 + second decl + gap persists", () => {
		expect(
			isPhase2RevisionRequired({
				workforce: 300,
				hasIndicatorG: true,
				gap: 10,
				correctionGap: 7,
				events: withSecondDecl,
			}),
		).toBe(true);
	});
});
