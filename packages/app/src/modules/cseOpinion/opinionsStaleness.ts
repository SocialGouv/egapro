export function opinionsSavedBeforeSecondDeclaration({
	draftUpdatedAt,
	secondDeclarationSubmittedAt,
}: {
	draftUpdatedAt: Date | null;
	secondDeclarationSubmittedAt: Date | null;
}): boolean {
	return (
		draftUpdatedAt !== null &&
		secondDeclarationSubmittedAt !== null &&
		draftUpdatedAt < secondDeclarationSubmittedAt
	);
}
