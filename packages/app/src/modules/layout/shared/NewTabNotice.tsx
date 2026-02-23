/** Announces to screen readers that a link opens in a new tab. */
export function NewTabNotice() {
	return <span className="fr-sr-only"> (opens in a new window)</span>;
}
