import { representationDraftSchema } from "./schemas";

// `currentStep` is the furthest step reached, which gates the step pages; resuming
// lands on the step last worked on instead, never beyond the furthest one.
export function getRepresentationResumeStep(declaration: {
	currentStep: number | null;
	draft: unknown;
}): number {
	const reachedStep = declaration.currentStep ?? 0;
	const draft = representationDraftSchema.safeParse(declaration.draft);
	const lastStep = draft.success ? draft.data.lastStep : undefined;
	return lastStep === undefined ? reachedStep : Math.min(lastStep, reachedStep);
}
