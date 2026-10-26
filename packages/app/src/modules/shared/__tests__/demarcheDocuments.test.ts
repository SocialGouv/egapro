import { describe, expect, it } from "vitest";
import {
	buildRemunerationDocuments,
	offersTransmittedElements,
} from "../demarcheDocuments";

const YEAR = 2025;
const DATA_YEAR = YEAR - 1;

const DECLARATION_RECAP =
	"Télécharger le récapitulatif de la déclaration des indicateurs";
const SECOND_DECLARATION_RECAP =
	"Télécharger le récapitulatif de la seconde déclaration de l'indicateur par catégorie de salariés";
const TRANSMITTED_RECAP = "Télécharger le récapitulatif des éléments transmis";
const JOINT_EVALUATION_RECAP =
	"Télécharger le récapitulatif de l'évaluation conjointe des rémunérations";

function build({
	hasSecondDeclaration = false,
	hasTransmittedElements = false,
	hasTransmittedJointEvaluation = false,
} = {}) {
	return buildRemunerationDocuments({
		dataYear: DATA_YEAR,
		hasSecondDeclaration,
		hasTransmittedElements,
		hasTransmittedJointEvaluation,
		year: YEAR,
	});
}

describe("buildRemunerationDocuments", () => {
	it("always offers the declaration recap", () => {
		expect(build()).toEqual([
			{
				dataYear: DATA_YEAR,
				href: `/api/declaration-pdf?year=${YEAR}`,
				title: DECLARATION_RECAP,
				year: YEAR,
			},
		]);
	});

	it("adds the second declaration recap once one was filed", () => {
		expect(build({ hasSecondDeclaration: true })).toContainEqual({
			dataYear: DATA_YEAR,
			href: `/api/declaration-pdf?type=correction&year=${YEAR}`,
			title: SECOND_DECLARATION_RECAP,
			year: YEAR,
		});
	});

	it("adds the transmitted elements recap once something was transmitted", () => {
		expect(build({ hasTransmittedElements: true })).toContainEqual({
			dataYear: DATA_YEAR,
			href: `/api/transmitted-pdf?year=${YEAR}`,
			title: TRANSMITTED_RECAP,
			year: YEAR,
		});
	});

	it("adds the joint evaluation recap once the evaluation was transmitted", () => {
		expect(build({ hasTransmittedJointEvaluation: true })).toContainEqual({
			dataYear: DATA_YEAR,
			href: `/api/joint-evaluation-pdf?year=${YEAR}`,
			title: JOINT_EVALUATION_RECAP,
			year: YEAR,
		});
	});

	it("places the joint evaluation recap between the second declaration and the transmitted elements", () => {
		const documents = build({
			hasSecondDeclaration: true,
			hasTransmittedElements: true,
			hasTransmittedJointEvaluation: true,
		});

		expect(documents.map((document) => document.title)).toEqual([
			DECLARATION_RECAP,
			SECOND_DECLARATION_RECAP,
			JOINT_EVALUATION_RECAP,
			TRANSMITTED_RECAP,
		]);
	});

	// Independent flags: a joint evaluation can be filed without a second declaration.
	it.each([
		{
			expected: [DECLARATION_RECAP],
			hasSecondDeclaration: false,
			hasTransmittedElements: false,
		},
		{
			expected: [DECLARATION_RECAP, SECOND_DECLARATION_RECAP],
			hasSecondDeclaration: true,
			hasTransmittedElements: false,
		},
		{
			expected: [DECLARATION_RECAP, TRANSMITTED_RECAP],
			hasSecondDeclaration: false,
			hasTransmittedElements: true,
		},
		{
			expected: [
				DECLARATION_RECAP,
				SECOND_DECLARATION_RECAP,
				TRANSMITTED_RECAP,
			],
			hasSecondDeclaration: true,
			hasTransmittedElements: true,
		},
	])("lists the documents in maquette order (secondDeclaration: $hasSecondDeclaration, transmitted: $hasTransmittedElements)", ({
		expected,
		...flags
	}) => {
		expect(build(flags).map((document) => document.title)).toEqual(expected);
	});

	it("stamps every document with the campaign year and its reference data year", () => {
		const documents = build({
			hasSecondDeclaration: true,
			hasTransmittedElements: true,
		});

		expect(
			documents.every(
				(document) => document.year === YEAR && document.dataYear === DATA_YEAR,
			),
		).toBe(true);
	});
});

describe("offersTransmittedElements", () => {
	it.each([
		{
			expected: false,
			hasSubmittedCseOpinion: false,
			hasSubmittedJointEvaluation: false,
		},
		{
			expected: true,
			hasSubmittedCseOpinion: true,
			hasSubmittedJointEvaluation: false,
		},
		{
			expected: true,
			hasSubmittedCseOpinion: false,
			hasSubmittedJointEvaluation: true,
		},
		{
			expected: true,
			hasSubmittedCseOpinion: true,
			hasSubmittedJointEvaluation: true,
		},
	])("is $expected (cseOpinion: $hasSubmittedCseOpinion, jointEvaluation: $hasSubmittedJointEvaluation)", ({
		expected,
		...submissions
	}) => {
		expect(offersTransmittedElements(submissions)).toBe(expected);
	});

	// The joint evaluation report is a compliance-path choice, not a CSE artefact:
	// a company without a CSE that filed one has a non-empty recap (issue 4268).
	it("offers the recap to a company without a CSE that filed a joint evaluation", () => {
		expect(
			offersTransmittedElements({
				hasSubmittedCseOpinion: false,
				hasSubmittedJointEvaluation: true,
			}),
		).toBe(true);
	});
});
