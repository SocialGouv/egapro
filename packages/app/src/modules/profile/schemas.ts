import { z } from "zod";

import { phoneSchema } from "./phone";

// Matches the varchar(255) width of users.firstName / users.lastName.
const NAME_MAX_LENGTH = 255;

const nameSchema = z
	.string()
	.trim()
	.min(1, "Ce champ est obligatoire")
	.max(NAME_MAX_LENGTH, `Ce champ est limité à ${NAME_MAX_LENGTH} caractères`);

export const updatePhoneSchema = z.object({
	phone: phoneSchema,
});

export const updateProfileSchema = z.object({
	firstName: nameSchema,
	lastName: nameSchema,
	phone: phoneSchema,
});
