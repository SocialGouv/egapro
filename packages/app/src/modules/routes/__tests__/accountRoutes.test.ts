import { describe, expect, it } from "vitest";
import {
	LOGIN,
	MY_SPACE,
	MY_SPACE_COMPANIES,
	mySpaceHistoryHref,
} from "../shared/accountRoutes";

describe("account routes", () => {
	it("spells the connected space", () => {
		expect(LOGIN).toBe("/login");
		expect(MY_SPACE).toBe("/mon-espace");
		expect(MY_SPACE_COMPANIES).toBe("/mon-espace/mes-entreprises");
	});

	it("builds a declaration history page", () => {
		expect(mySpaceHistoryHref("123456789", 2027)).toBe(
			"/mon-espace/historique/123456789/2027",
		);
	});
});
