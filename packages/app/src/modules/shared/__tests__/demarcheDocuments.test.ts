import { describe, expect, it } from "vitest";
import { buildRemunerationDocuments } from "../demarcheDocuments";

const YEAR = 2025;
const DATA_YEAR = YEAR - 1;

const DECLARATION_RECAP =
	"Télécharger le récapitulatif de la déclaration des indicateurs";
const SECOND_DECLARATION_RECAP =
	"Télécharger le récapitulatif de la seconde déclaration de l'indicateur par catégorie d'emplois";
const CSE_OPINION_RECAP =
	"Télécharger le récapitulatif de la transmission du ou des avis du CSE";
const JOINT_EVALUATION_RECAP =
	"Télécharger le récapitulatif de l'évaluation conjointe des rémunérations";

function build({
	hasSecondDeclaration = false,
	hasSubmittedCseOpinion = false,
	hasTransmittedJointEvaluation = false,
} = {}) {
	return buildRemunerationDocuments({
		dataYear: DATA_YEAR,
		hasSecondDeclaration,
		hasSubmittedCseOpinion,
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

	it("adds the CSE opinion recap once a CSE opinion was transmitted", () => {
		expect(build({ hasSubmittedCseOpinion: true })).toContainEqual({
			dataYear: DATA_YEAR,
			href: `/api/cse-opinion-pdf?year=${YEAR}`,
			title: CSE_OPINION_RECAP,
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

	it("places the joint evaluation recap between the second declaration and the CSE opinion recap", () => {
		const documents = build({
			hasSecondDeclaration: true,
			hasSubmittedCseOpinion: true,
			hasTransmittedJointEvaluation: true,
		});

		expect(documents.map((document) => document.title)).toEqual([
			DECLARATION_RECAP,
			SECOND_DECLARATION_RECAP,
			JOINT_EVALUATION_RECAP,
			CSE_OPINION_RECAP,
		]);
	});

	// Independent flags: a joint evaluation can be filed without a second declaration.
	it.each([
		{
			expected: [DECLARATION_RECAP],
			hasSecondDeclaration: false,
			hasSubmittedCseOpinion: false,
		},
		{
			expected: [DECLARATION_RECAP, SECOND_DECLARATION_RECAP],
			hasSecondDeclaration: true,
			hasSubmittedCseOpinion: false,
		},
		{
			expected: [DECLARATION_RECAP, CSE_OPINION_RECAP],
			hasSecondDeclaration: false,
			hasSubmittedCseOpinion: true,
		},
		{
			expected: [
				DECLARATION_RECAP,
				SECOND_DECLARATION_RECAP,
				CSE_OPINION_RECAP,
			],
			hasSecondDeclaration: true,
			hasSubmittedCseOpinion: true,
		},
	])("lists the documents in maquette order (secondDeclaration: $hasSecondDeclaration, cseOpinion: $hasSubmittedCseOpinion)", ({
		expected,
		...flags
	}) => {
		expect(build(flags).map((document) => document.title)).toEqual(expected);
	});

	it("stamps every document with the campaign year and its reference data year", () => {
		const documents = build({
			hasSecondDeclaration: true,
			hasSubmittedCseOpinion: true,
		});

		expect(
			documents.every(
				(document) => document.year === YEAR && document.dataYear === DATA_YEAR,
			),
		).toBe(true);
	});
});
