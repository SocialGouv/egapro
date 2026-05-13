export function isDeclarationSubmitted(status: string | null): boolean {
	return status !== null && status !== "draft";
}
