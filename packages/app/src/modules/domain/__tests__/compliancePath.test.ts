import { describe, expect, it } from "vitest";

import { compliancePathEnum } from "~/server/db/schema";
import type { CompliancePathValue } from "../types";

describe("CompliancePathValue", () => {
	it("mirrors compliancePathEnum values from Drizzle schema", () => {
		const drizzleValues = [...compliancePathEnum.enumValues].sort();
		const expectedValues: CompliancePathValue[] = [
			"justify",
			"corrective_action",
			"joint_evaluation",
		];
		expect(drizzleValues).toEqual([...expectedValues].sort());
	});
});
