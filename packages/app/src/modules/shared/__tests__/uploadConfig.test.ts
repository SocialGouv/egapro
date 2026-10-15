import { describe, expect, it } from "vitest";
import { fileTypeEnum } from "~/server/db/schema";
import { isUploadFlowType, UPLOAD_FLOW_TYPES } from "../uploadConfig";

describe("isUploadFlowType", () => {
	it("mirrors the stored file types one to one", () => {
		expect([...UPLOAD_FLOW_TYPES].sort()).toEqual(
			[...fileTypeEnum.enumValues].sort(),
		);
	});

	it.each(UPLOAD_FLOW_TYPES)("accepts %s", (flowType) => {
		expect(isUploadFlowType(flowType)).toBe(true);
	});

	it.each([
		null,
		undefined,
		"",
		"formal_notice",
		"CSE_OPINION",
		42,
		{},
	])("rejects %s", (value) => {
		expect(isUploadFlowType(value)).toBe(false);
	});
});
