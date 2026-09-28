import { z } from "zod";

import { phoneSchema } from "~/modules/profile/phone";

export const sirenInputSchema = z.object({
	siren: z.string().length(9),
});

export const updateHasCseSchema = z.object({
	siren: z.string().length(9),
	hasCse: z.boolean(),
});

const CSE_RADIO_ERROR = "Veuillez renseigner si un CSE a été mis en place.";

const hasCseFromRadio = z.unknown().transform((v, ctx) => {
	if (v === true || v === "true") return true;
	if (v === false || v === "false") return false;
	ctx.addIssue({ code: "custom", message: CSE_RADIO_ERROR });
	return z.NEVER;
});

export function createMissingInfoSchema(
	needsPhone: boolean,
	needsCse: boolean,
) {
	return z.object({
		phone: needsPhone ? phoneSchema : z.string(),
		hasCse: needsCse ? hasCseFromRadio : hasCseFromRadio.optional(),
	});
}
