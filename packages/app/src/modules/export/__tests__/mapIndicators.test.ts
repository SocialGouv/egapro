import { describe, expect, it } from "vitest";

import type { CseOpinionRow } from "../mapIndicators";
import { mapCseOpinions } from "../mapIndicators";

describe("mapCseOpinions", () => {
	it("should map up to 4 CSE opinions", () => {
		const opinions: CseOpinionRow[] = [
			{ type: "initial", opinion: "favorable", opinionDate: "2026-02-15" },
			{ type: "initial", opinion: "reserved", opinionDate: "2026-03-01" },
		];

		const result = mapCseOpinions(opinions);

		expect(result.cseOpinion1Type).toBe("initial");
		expect(result.cseOpinion1Opinion).toBe("favorable");
		expect(result.cseOpinion1Date).toBe("2026-02-15");
		expect(result.cseOpinion2Type).toBe("initial");
		expect(result.cseOpinion2Opinion).toBe("reserved");
		expect(result.cseOpinion3Type).toBeNull();
		expect(result.cseOpinion4Type).toBeNull();
	});

	it("should return all nulls when empty", () => {
		const result = mapCseOpinions([]);

		expect(result.cseOpinion1Type).toBeNull();
		expect(result.cseOpinion1Opinion).toBeNull();
		expect(result.cseOpinion1Date).toBeNull();
	});
});
