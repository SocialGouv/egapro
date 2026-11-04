import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import { getMissingOpinionFieldMessage } from "./contentTypeColumns";
import type { ContentTypeKey, OpinionType } from "./types";

export type OpinionCardValues = ContentTypeKey & {
	cardId: string;
	opinion: OpinionType | null | undefined;
	date: string | null | undefined;
};

export function opinionRadioId(cardId: string, opinion: OpinionType): string {
	return `${cardId}-${opinion}`;
}

export function opinionDateId(cardId: string): string {
	return `${cardId}-date`;
}

export function opinionFieldId(cardId: string): string {
	return opinionRadioId(cardId, "favorable");
}

export function getMissingOpinionFieldErrors(
	cards: readonly OpinionCardValues[],
	hasSecondDeclaration: boolean,
): FieldError[] {
	return cards.flatMap((card) => {
		const missing: FieldError[] = [];
		if (!card.opinion) {
			missing.push({
				fieldId: opinionFieldId(card.cardId),
				category: "empty",
				message: getMissingOpinionFieldMessage(
					card,
					"opinion",
					hasSecondDeclaration,
				),
				anchor: true,
			});
		}
		if (!card.date) {
			missing.push({
				fieldId: opinionDateId(card.cardId),
				category: "empty",
				message: getMissingOpinionFieldMessage(
					card,
					"date",
					hasSecondDeclaration,
				),
				anchor: true,
			});
		}
		return missing;
	});
}
