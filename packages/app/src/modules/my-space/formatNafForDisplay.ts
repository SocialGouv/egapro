export function formatNafForDisplay(
	nafCode: string | null,
	nafLabel: string | null,
): string | null {
	if (nafCode && nafLabel) return `${nafCode} — ${nafLabel}`;
	return nafCode ?? nafLabel;
}
