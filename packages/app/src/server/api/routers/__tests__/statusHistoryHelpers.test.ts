import { describe, expect, it } from "vitest";

import { buildStepChangeInsert } from "../statusHistoryHelpers";

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
