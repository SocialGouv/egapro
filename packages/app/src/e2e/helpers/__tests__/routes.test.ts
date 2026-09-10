import { describe, expect, it } from "vitest";
import {
	ADMIN_STATS,
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	CSE_OPINION,
	complianceStepHref,
	DECLARATION_REMUNERATION,
	LOGIN,
	MY_SPACE,
	remunerationStepHref,
} from "~/modules/routes";
import { urlGlob, urlPattern } from "../routes";

// The suite navigates by glob and asserts by regex; these pin the strings those
// two adapters produce against the hand-written ones they replaced, so the
// migration cannot have quietly widened or narrowed a wait.
describe("urlGlob", () => {
	it("matches a path under any origin", () => {
		expect(urlGlob(MY_SPACE)).toBe("**/mon-espace");
		expect(urlGlob(remunerationStepHref(6))).toBe(
			"**/declaration-remuneration/etape/6",
		);
		expect(urlGlob(complianceStepHref(1))).toBe(
			"**/declaration-remuneration/parcours-conformite/etape/1",
		);
		expect(urlGlob(COMPLIANCE_CONFIRMATION)).toBe(
			"**/declaration-remuneration/parcours-conformite/confirmation",
		);
		expect(urlGlob(COMPLIANCE_JOINT_EVALUATION)).toBe(
			"**/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("keeps a trailing wildcard the caller appends", () => {
		expect(urlGlob(`${CSE_OPINION}/**`)).toBe("**/avis-cse/**");
		expect(urlGlob(`${DECLARATION_REMUNERATION}/etape/**`)).toBe(
			"**/declaration-remuneration/etape/**",
		);
		expect(urlGlob(`${LOGIN}**`)).toBe("**/login**");
	});
});

describe("urlPattern", () => {
	it("anchors on the end of the URL", () => {
		const pattern = urlPattern(ADMIN_STATS);
		expect(pattern.test("http://localhost:3000/admin/stats")).toBe(true);
		expect(pattern.test("http://localhost:3000/admin/stats/campagne")).toBe(
			false,
		);
	});

	it("does not let a path segment match a longer sibling", () => {
		const pattern = urlPattern(remunerationStepHref(4));
		expect(
			pattern.test("http://localhost:3000/declaration-remuneration/etape/4"),
		).toBe(true);
		expect(
			pattern.test("http://localhost:3000/declaration-remuneration/etape/40"),
		).toBe(false);
	});

	// A path is interpolated into a regex source, so any metacharacter it carries
	// must be escaped rather than interpreted.
	it("escapes regex metacharacters in the path", () => {
		expect(
			urlPattern("/api/v1/openapi.json").test("/api/v1/openapiXjson"),
		).toBe(false);
	});
});
