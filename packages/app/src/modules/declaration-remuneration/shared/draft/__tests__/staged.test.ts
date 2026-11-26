import { describe, expect, it } from "vitest";

import {
	parseStagedJointUpload,
	parseStagedSecondDeclaration,
	STAGED_JOINT_UPLOAD_KIND,
	STAGED_JOINT_UPLOAD_STEP,
	STAGED_SECOND_DECLARATION_KIND,
	STAGED_SECOND_DECLARATION_STEP,
	toEmployeeCategoryRows,
} from "../staged";

const stagedSecond = {
	source: "dads",
	categories: [
		{
			name: "Cadres",
			data: {
				womenCount: 12,
				menCount: 18,
				annualBaseWomen: "30000",
				annualBaseMen: "32000",
				annualVariableWomen: "0",
				annualVariableMen: "0",
				hourlyBaseWomen: "18",
				hourlyBaseMen: "19",
				hourlyVariableWomen: "0",
				hourlyVariableMen: "0",
			},
		},
	],
	referencePeriodStart: "2025-01-01",
	referencePeriodEnd: "2025-12-31",
};

function wrap(kind: string, step: string, data: unknown) {
	return { [kind]: { [step]: data } };
}

describe("parseStagedSecondDeclaration", () => {
	it("reads the staged slice out of the draft blob", () => {
		expect(
			parseStagedSecondDeclaration(
				wrap(
					STAGED_SECOND_DECLARATION_KIND,
					STAGED_SECOND_DECLARATION_STEP,
					stagedSecond,
				),
			),
		).toEqual(stagedSecond);
	});

	it.each([
		null,
		undefined,
		{},
		wrap(STAGED_SECOND_DECLARATION_KIND, STAGED_SECOND_DECLARATION_STEP, null),
		wrap(STAGED_SECOND_DECLARATION_KIND, STAGED_SECOND_DECLARATION_STEP, {
			source: "",
			categories: [],
		}),
	])("returns null for an absent or invalid slice (%s)", (draft) => {
		expect(parseStagedSecondDeclaration(draft)).toBeNull();
	});
});

describe("parseStagedJointUpload", () => {
	const upload = {
		fileId: "file-1",
		fileName: "rapport.pdf",
		filePath: "uploads/rapport.pdf",
		uploadedAt: "2026-01-15T00:00:00.000Z",
	};

	it("reads the staged upload out of the draft blob", () => {
		expect(
			parseStagedJointUpload(
				wrap(STAGED_JOINT_UPLOAD_KIND, STAGED_JOINT_UPLOAD_STEP, upload),
			),
		).toEqual(upload);
	});

	it.each([
		undefined,
		wrap(STAGED_JOINT_UPLOAD_KIND, STAGED_JOINT_UPLOAD_STEP, {
			fileId: "file-1",
		}),
	])("returns null for an absent or invalid upload (%s)", (draft) => {
		expect(parseStagedJointUpload(draft)).toBeNull();
	});
});

describe("toEmployeeCategoryRows", () => {
	it("maps absent values to null", () => {
		expect(toEmployeeCategoryRows(stagedSecond.categories)).toEqual([
			{
				name: "Cadres",
				womenCount: 12,
				menCount: 18,
				hourlyWomenCount: null,
				hourlyMenCount: null,
				annualBaseWomen: "30000",
				annualBaseMen: "32000",
				annualVariableWomen: "0",
				annualVariableMen: "0",
				hourlyBaseWomen: "18",
				hourlyBaseMen: "19",
				hourlyVariableWomen: "0",
				hourlyVariableMen: "0",
			},
		]);
	});
});
