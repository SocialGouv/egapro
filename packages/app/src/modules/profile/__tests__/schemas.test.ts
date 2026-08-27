import { describe, expect, it } from "vitest";

import { updatePhoneSchema, updateProfileSchema } from "../schemas";

const NAME_MAX_LENGTH = 255;

const validProfile = {
	firstName: "Julien",
	lastName: "Martin",
	phone: "01 22 33 44 55",
};

const identityFields = ["firstName", "lastName"] as const;

describe("updateProfileSchema", () => {
	it("keeps both identity fields and canonicalizes the phone", () => {
		expect(updateProfileSchema.parse(validProfile)).toEqual({
			firstName: "Julien",
			lastName: "Martin",
			phone: "+33122334455",
		});
	});

	it("trims surrounding whitespace on both identity fields", () => {
		const result = updateProfileSchema.parse({
			...validProfile,
			firstName: "  Julien  ",
			lastName: "\tMartin\n",
		});

		expect(result.firstName).toBe("Julien");
		expect(result.lastName).toBe("Martin");
	});

	it.each(identityFields)("rejects an empty %s", (field) => {
		const result = updateProfileSchema.safeParse({
			...validProfile,
			[field]: "",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]).toMatchObject({
			path: [field],
			message: "Ce champ est obligatoire",
		});
	});

	it.each(identityFields)("rejects a whitespace-only %s", (field) => {
		const result = updateProfileSchema.safeParse({
			...validProfile,
			[field]: "   ",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe("Ce champ est obligatoire");
	});

	it.each(identityFields)("accepts a %s at the column width", (field) => {
		const result = updateProfileSchema.safeParse({
			...validProfile,
			[field]: "a".repeat(NAME_MAX_LENGTH),
		});

		expect(result.success).toBe(true);
	});

	it.each(
		identityFields,
	)("rejects a %s longer than the column width", (field) => {
		const result = updateProfileSchema.safeParse({
			...validProfile,
			[field]: "a".repeat(NAME_MAX_LENGTH + 1),
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]).toMatchObject({
			path: [field],
			message: `Ce champ est limité à ${NAME_MAX_LENGTH} caractères`,
		});
	});

	it("rejects an invalid phone number", () => {
		const result = updateProfileSchema.safeParse({
			...validProfile,
			phone: "012233",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]).toMatchObject({
			path: ["phone"],
			message: "Veuillez renseigner votre numéro de téléphone",
		});
	});
});

describe("updatePhoneSchema", () => {
	// Still the contract of MissingInfoModal, which collects the phone alone.
	it("validates the phone without requiring the identity fields", () => {
		expect(updatePhoneSchema.parse({ phone: "01 22 33 44 55" })).toEqual({
			phone: "+33122334455",
		});
	});
});
