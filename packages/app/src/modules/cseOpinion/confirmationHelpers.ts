export function hasSubmittedSecondDeclaration(
	secondDeclarationSubmittedAt: Date | null,
): boolean {
	return secondDeclarationSubmittedAt !== null;
}

export function isDeclarationSubmitted(status: string | null): boolean {
	return status !== null && status !== "draft";
}
