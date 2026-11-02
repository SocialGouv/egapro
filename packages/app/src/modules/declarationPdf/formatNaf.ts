export function formatNaf(
	nafCode: string | null,
	nafLabel: string | null,
): string {
	if (!nafCode && !nafLabel) return "-";
	if (nafCode && nafLabel) return `${nafCode} - ${nafLabel}`;
	return nafCode ?? nafLabel ?? "-";
}
