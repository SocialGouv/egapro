import { z } from "zod";

import { phoneSchema } from "./phone";

export const updatePhoneSchema = z.object({
	phone: phoneSchema,
});

export type UpdatePhoneInput = z.infer<typeof updatePhoneSchema>;
