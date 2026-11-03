import { z } from "zod";

const declarationIdInputSchema = z.object({
	declarationId: z.string(),
});

export const acquireLockSchema = declarationIdInputSchema;

export const heartbeatSchema = declarationIdInputSchema;

export const releaseLockSchema = declarationIdInputSchema;

export const getLockStateSchema = declarationIdInputSchema;

export const getLockAvailabilitySchema = declarationIdInputSchema;
