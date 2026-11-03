import { describe, expect, it } from "vitest";

import { composeDescribedBy } from "../composeDescribedBy";

describe("composeDescribedBy", () => {
	it("joins the ids in the order they are given", () => {
		expect(composeDescribedBy("note", "hint", "messages")).toBe(
			"note hint messages",
		);
	});

	it("skips the ids that are not rendered", () => {
		expect(
			composeDescribedBy("note", undefined, false, null, "", "error"),
		).toBe("note error");
	});

	it("returns a single id unchanged", () => {
		expect(composeDescribedBy("note")).toBe("note");
	});

	it("returns undefined when no id remains, so the attribute is omitted", () => {
		expect(composeDescribedBy()).toBeUndefined();
		expect(composeDescribedBy(undefined, false, null, "")).toBeUndefined();
	});
});
