/**
 * Warning alert shown on step 1 when GIP DSN data is available.
 * Warns the user that modifying the workforce resets prefilled indicators.
 */
export function PrefillResetWarning() {
	return (
		<div className="fr-alert fr-alert--warning fr-alert--sm">
			<p>
				<strong>
					Attention&nbsp;: toute modification de l&apos;effectif réinitialise
					les indicateurs préremplis.
				</strong>{" "}
				Ceux-ci devront alors être ressaisis manuellement.
			</p>
		</div>
	);
}
