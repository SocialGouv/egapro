import { describe, expect, it } from "vitest";

import {
	getMissingOpinionFieldErrors,
	type OpinionCardValues,
	opinionDateId,
	opinionFieldId,
	opinionRadioId,
} from "../opinionFieldErrors";

const accuracyCard = (
	overrides: Partial<OpinionCardValues> = {},
): OpinionCardValues => ({
	cardId: "first-decl-accuracy",
	declarationNumber: 1,
	type: "accuracy",
	opinion: "favorable",
	date: "2026-01-15",
	...overrides,
});

describe("opinion field ids", () => {
	it("derives the radio and date ids from the card id", () => {
		expect(opinionRadioId("card", "unfavorable")).toBe("card-unfavorable");
		expect(opinionFieldId("card")).toBe("card-favorable");
		expect(opinionDateId("card")).toBe("card-date");
	});
});

describe("getMissingOpinionFieldErrors", () => {
	it("returns nothing when every card is answered", () => {
		expect(getMissingOpinionFieldErrors([accuracyCard()], false)).toEqual([]);
	});

	it.each([
		[null, ""],
		[undefined, undefined],
	])("anchors one empty-field error on the opinion and one on the date (%s, %s)", (opinion, date) => {
		expect(
			getMissingOpinionFieldErrors([accuracyCard({ opinion, date })], false),
		).toEqual([
			{
				fieldId: "first-decl-accuracy-favorable",
				category: "empty",
				message:
					"Indiquez si l'avis d'exactitude des données et des méthodes de calcul est favorable ou défavorable.",
				anchor: true,
			},
			{
				fieldId: "first-decl-accuracy-date",
				category: "empty",
				message:
					"Renseignez la date de l'avis d'exactitude des données et des méthodes de calcul.",
				anchor: true,
			},
		]);
	});

	it("names the declaration when a second declaration exists", () => {
		const [error] = getMissingOpinionFieldErrors(
			[
				accuracyCard({
					cardId: "second-decl-gap",
					declarationNumber: 2,
					type: "gap",
					date: null,
				}),
			],
			true,
		);
		expect(error).toEqual({
			fieldId: "second-decl-gap-date",
			category: "empty",
			message:
				"Renseignez la date de l'avis justifiant les écarts ≥ 5 % de la seconde déclaration.",
			anchor: true,
		});
	});
});
