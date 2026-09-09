import { z } from "zod";

export const acquireLockSchema = z.object({
	declarationId: z.string(),
});

export const heartbeatSchema = z.object({
	declarationId: z.string(),
});

export const releaseLockSchema = z.object({
	declarationId: z.string(),
});

export const getLockStateSchema = z.object({
	declarationId: z.string(),
});
