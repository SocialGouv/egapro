import { describe, expect, it } from "vitest";
import { LOGIN, MY_SPACE, mySpaceHistoryHref } from "../shared/accountRoutes";

describe("account routes", () => {
	it("spells the connected space", () => {
		expect(LOGIN).toBe("/login");
		expect(MY_SPACE).toBe("/mon-espace");
	});

	it("builds a declaration history page", () => {
		expect(mySpaceHistoryHref("123456789", 2027)).toBe(
			"/mon-espace/historique/123456789/2027",
		);
	});
});
