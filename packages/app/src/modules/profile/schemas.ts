import { z } from "zod";

import { phoneSchema } from "./phone";

export const updatePhoneSchema = z.object({
	phone: phoneSchema,
});
