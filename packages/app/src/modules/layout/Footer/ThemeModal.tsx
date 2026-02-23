/**
 * Display settings modal (light / dark / system theme).
 * The DSFR JS manages theme changes and persists the choice
 * in the `fr-theme` cookie and the `data-fr-scheme` attribute on <html>.
 * role="dialog" is required for aria-labelledby to be valid.
 */
export function ThemeModal() {
	return (
		<div
			aria-labelledby="fr-theme-modal-title"
			aria-modal="true"
			className="fr-modal"
			id="fr-theme-modal"
			role="dialog"
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls="fr-theme-modal"
									className="fr-btn--close fr-btn"
									title="Close window"
									type="button"
								>
									Close
								</button>
							</div>
							<div className="fr-modal__content">
								<h1 className="fr-modal__title" id="fr-theme-modal-title">
									<span
										aria-hidden="true"
										className="fr-icon-theme-fill fr-icon--lg"
									/>
									Display settings
								</h1>
								<div className="fr-display" id="fr-display">
									<fieldset className="fr-fieldset">
										<legend
											className="fr-fieldset__legend"
											id="fr-theme-fieldset-legend"
										>
											Choose a theme to customize the appearance of the site.
										</legend>
										<div className="fr-fieldset__content">
											<div className="fr-radio-group fr-radio-rich">
												<input
													id="fr-radio-theme-light"
													name="fr-radios-theme"
													type="radio"
													value="light"
												/>
												<label
													className="fr-label"
													htmlFor="fr-radio-theme-light"
												>
													Light theme
												</label>
											</div>
											<div className="fr-radio-group fr-radio-rich">
												<input
													id="fr-radio-theme-dark"
													name="fr-radios-theme"
													type="radio"
													value="dark"
												/>
												<label
													className="fr-label"
													htmlFor="fr-radio-theme-dark"
												>
													Dark theme
												</label>
											</div>
											<div className="fr-radio-group fr-radio-rich">
												<input
													id="fr-radio-theme-system"
													name="fr-radios-theme"
													type="radio"
													value="system"
												/>
												<label
													className="fr-label"
													htmlFor="fr-radio-theme-system"
												>
													System (browser preference)
												</label>
											</div>
										</div>
									</fieldset>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
