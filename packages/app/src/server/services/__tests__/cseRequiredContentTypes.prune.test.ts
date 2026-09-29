import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));

import {
	contentTypeKey,
	findStaleAssociationIds,
} from "../cseRequiredContentTypes";

const ACCURACY = {
	id: "assoc-accuracy",
	declarationNumber: 1,
	type: "accuracy",
};
const GAP = { id: "assoc-gap", declarationNumber: 1, type: "gap" };
const SECOND_GAP = { id: "assoc-2-gap", declarationNumber: 2, type: "gap" };

describe("contentTypeKey", () => {
	it("joins the declaration number and the type", () => {
		expect(contentTypeKey(2, "gap")).toBe("2:gap");
	});
});

describe("findStaleAssociationIds", () => {
	it("flags the gap association once the gap justification is no longer required", () => {
		expect(
			findStaleAssociationIds(
				[{ declarationNumber: 1, type: "accuracy" }],
				[ACCURACY, GAP],
			),
		).toEqual(["assoc-gap"]);
	});

	it("keeps every association while all its types are still required", () => {
		expect(
			findStaleAssociationIds(
				[
					{ declarationNumber: 1, type: "accuracy" },
					{ declarationNumber: 1, type: "gap" },
				],
				[ACCURACY, GAP],
			),
		).toEqual([]);
	});

	it("flags second-declaration associations when only the first round is required", () => {
		expect(
			findStaleAssociationIds(
				[{ declarationNumber: 1, type: "accuracy" }],
				[ACCURACY, SECOND_GAP],
			),
		).toEqual(["assoc-2-gap"]);
	});

	it("flags nothing when there is no association", () => {
		expect(
			findStaleAssociationIds([{ declarationNumber: 1, type: "accuracy" }], []),
		).toEqual([]);
	});
});
