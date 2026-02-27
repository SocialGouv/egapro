export function ArchivesSection() {
	return (
		<div className="fr-container fr-mb-6w">
			<div
				className="fr-p-3w"
				style={{
					border: "1px solid var(--border-default-grey)",
					background: "var(--background-default-grey)",
				}}
			>
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-auto">
						<svg
							aria-hidden="true"
							className="fr-artwork"
							height="80px"
							viewBox="0 0 80 80"
							width="80px"
						>
							<use
								className="fr-artwork-decorative"
								href="/dsfr/artwork/pictograms/document/archive.svg#artwork-decorative"
							/>
							<use
								className="fr-artwork-minor"
								href="/dsfr/artwork/pictograms/document/archive.svg#artwork-minor"
							/>
							<use
								className="fr-artwork-major"
								href="/dsfr/artwork/pictograms/document/archive.svg#artwork-major"
							/>
						</svg>
					</div>
					<div className="fr-col">
						<p className="fr-text--bold fr-mb-1v">Archives</p>
						<p className="fr-text--sm fr-mb-0">
							Récupérer vos anciennes déclarations de l'index de l'égalité
							professionnelle femmes-hommes.
						</p>
					</div>
					<div className="fr-col-auto">
						<button
							className="fr-btn fr-btn--tertiary"
							disabled
							title="Fonctionnalité à venir"
							type="button"
						>
							Demander une déclaration archivée
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
