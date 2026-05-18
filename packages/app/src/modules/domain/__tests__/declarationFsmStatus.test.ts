import { describe, expect, it } from "vitest";

import { declarationStatusEnum } from "~/server/db/schema";
import type { DeclarationFsmStatus } from "../types";

describe("DeclarationFsmStatus", () => {
	it("mirrors declarationStatusEnum values from Drizzle schema", () => {
		const drizzleValues = [...declarationStatusEnum.enumValues].sort();
		const expectedValues: DeclarationFsmStatus[] = [
			"draft",
			"awaiting_compliance_path_choice",
			"corrective_actions_chosen",
			"joint_evaluation_chosen",
			"awaiting_revision_choice",
			"revised_joint_evaluation_chosen",
			"awaiting_cse_opinion",
			"demarche_completed",
		];
		expect(drizzleValues).toEqual([...expectedValues].sort());
	});
});
