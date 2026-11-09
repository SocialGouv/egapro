import { describe, expect, it } from "vitest";
import { getContentTypeHeader, getOpinionTitle } from "../contentTypeColumns";
import {
	buildSubmittedDeclarations,
	buildSubmittedFileColumns,
	buildSubmittedOpinionRows,
	formatSubmittedOpinion,
} from "../submittedOpinionLabels";

const accuracy = (declarationNumber: number, opinion = "favorable") => ({
	declarationNumber,
	type: "accuracy",
	gapConsulted: null,
	opinion,
	opinionDate: "2026-08-07",
});

const gap = (declarationNumber: number, gapConsulted: boolean | null) => ({
	declarationNumber,
	type: "gap",
	gapConsulted,
	opinion: gapConsulted ? "unfavorable" : null,
	opinionDate: gapConsulted ? "2026-08-08" : null,
});

describe("formatSubmittedOpinion", () => {
	it("translates the stored opinion", () => {
		expect(formatSubmittedOpinion("favorable")).toBe("Favorable");
		expect(formatSubmittedOpinion("unfavorable")).toBe("Défavorable");
	});

	it("falls back when the opinion is missing or unknown", () => {
		expect(formatSubmittedOpinion(null)).toBe("Non renseigné");
		expect(formatSubmittedOpinion("other")).toBe("Non renseigné");
	});
});

describe("buildSubmittedOpinionRows", () => {
	it("gives an accuracy opinion its value and date", () => {
		expect(buildSubmittedOpinionRows(accuracy(1))).toEqual([
			{ label: "Avis du CSE", value: "Favorable" },
			{ label: "Date de l'avis rendu par le CSE", value: "07/08/2026" },
		]);
	});

	it("gives a justification opinion its value and date, whatever the consultation flag", () => {
		expect(buildSubmittedOpinionRows(gap(1, true))).toEqual([
			{ label: "Avis du CSE", value: "Défavorable" },
			{ label: "Date de l'avis rendu par le CSE", value: "08/08/2026" },
		]);
	});

	it("marks a missing opinion and date as not provided when the CSE was not consulted", () => {
		expect(buildSubmittedOpinionRows(gap(1, false))).toEqual([
			{ label: "Avis du CSE", value: "Non renseigné" },
			{ label: "Date de l'avis rendu par le CSE", value: "Non renseigné" },
		]);
	});

	it("marks a missing date as not provided", () => {
		expect(
			buildSubmittedOpinionRows({ ...accuracy(1), opinionDate: null }),
		).toContainEqual({
			label: "Date de l'avis rendu par le CSE",
			value: "Non renseigné",
		});
	});
});

describe("buildSubmittedDeclarations", () => {
	const opinions = [gap(1, true), accuracy(2), accuracy(1), gap(2, false)];

	it("keeps only the first declaration when no second one was transmitted", () => {
		const declarations = buildSubmittedDeclarations(opinions, false);

		expect(declarations.map((d) => d.title)).toEqual(["Première déclaration"]);
		expect(declarations[0]?.opinions.map((o) => o.id)).toEqual([
			"1:accuracy",
			"1:gap",
		]);
	});

	it("titles each opinion with the parcours wording, accuracy first", () => {
		const declarations = buildSubmittedDeclarations(opinions, true);

		expect(declarations.map((d) => d.title)).toEqual([
			"Première déclaration",
			"Seconde déclaration",
		]);
		expect(declarations[1]?.opinions.map((o) => o.title)).toEqual([
			getOpinionTitle(2, "accuracy"),
			getOpinionTitle(2, "gap"),
		]);
	});

	it("ignores an opinion of an unknown type", () => {
		const declarations = buildSubmittedDeclarations(
			[{ ...accuracy(1), type: "other" }],
			false,
		);

		expect(declarations[0]?.opinions).toEqual([]);
	});
});

describe("buildSubmittedFileColumns", () => {
	const associations = [
		{ declarationNumber: 2, type: "gap" },
		{ declarationNumber: 1, type: "gap" },
		{ declarationNumber: 1, type: "accuracy" },
		{ declarationNumber: 2, type: "accuracy" },
		{ declarationNumber: 1, type: "accuracy" },
	];

	it("orders one column per type by declaration, accuracy before justification", () => {
		expect(
			buildSubmittedFileColumns(associations, true).map((c) => c.id),
		).toEqual(["1:accuracy", "1:gap", "2:accuracy", "2:gap"]);
	});

	it("names the declaration only when there is a second one", () => {
		expect(buildSubmittedFileColumns(associations, true)[0]).toEqual({
			id: "1:accuracy",
			...getContentTypeHeader(1, "accuracy", true),
		});
		expect(buildSubmittedFileColumns(associations.slice(1, 3), false)).toEqual([
			{ id: "1:accuracy", label: "Exactitude", declarationLabel: null },
			{ id: "1:gap", label: "Justification", declarationLabel: null },
		]);
	});

	it("skips associations outside the known declarations and types", () => {
		expect(
			buildSubmittedFileColumns(
				[
					{ declarationNumber: 3, type: "accuracy" },
					{ declarationNumber: 1, type: "other" },
				],
				true,
			),
		).toEqual([]);
	});
});

describe("contentTypeColumns headers", () => {
	it("reuses the step 2 matrix wording", () => {
		expect(getContentTypeHeader(2, "gap", true)).toEqual({
			label: "Justification",
			declarationLabel: "2e déclaration",
		});
		expect(getOpinionTitle(1, "gap")).toMatch(
			/^Justification des écarts ≥ 5 %/,
		);
	});
});
