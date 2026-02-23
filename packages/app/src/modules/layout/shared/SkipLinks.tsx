/**
 * Skip links — mandatory RGAA criterion 12.7.
 * Allow keyboard/screen reader users to skip directly
 * to the main content or the footer.
 */
export function SkipLinks() {
	return (
		<div className="fr-skiplinks">
			<nav aria-label="Quick access" className="fr-container">
				<ul className="fr-skiplinks__list">
					<li>
						<a className="fr-link" href="#content">
							Content
						</a>
					</li>
					<li>
						<a className="fr-link" href="#footer">
							Footer
						</a>
					</li>
				</ul>
			</nav>
		</div>
	);
}
