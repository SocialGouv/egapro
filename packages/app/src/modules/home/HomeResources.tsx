type ResourceTileProps = {
	href: string;
	pictogramPath: string;
	title: string;
	detail: string;
};

function ResourceTile({
	href,
	pictogramPath,
	title,
	detail,
}: ResourceTileProps) {
	return (
		<div className="fr-tile fr-tile--horizontal fr-tile--sm fr-enlarge-link">
			<div className="fr-tile__body">
				<div className="fr-tile__content">
					<h3 className="fr-tile__title">
						<a href={href}>{title}</a>
					</h3>
					<p className="fr-tile__detail">{detail}</p>
				</div>
			</div>
			<div className="fr-tile__header">
				<div className="fr-tile__pictogram">
					<svg
						aria-hidden="true"
						className="fr-artwork"
						height="40px"
						viewBox="0 0 80 80"
						width="40px"
					>
						<use
							className="fr-artwork-decorative"
							href={`${pictogramPath}#artwork-decorative`}
						/>
						<use
							className="fr-artwork-minor"
							href={`${pictogramPath}#artwork-minor`}
						/>
						<use
							className="fr-artwork-major"
							href={`${pictogramPath}#artwork-major`}
						/>
					</svg>
				</div>
			</div>
		</div>
	);
}

/** Resources section: FAQ, reference texts and contact. */
export function HomeResources() {
	return (
		<section style={{ background: "var(--background-alt-blue-france)" }}>
			<div className="fr-container fr-py-6w">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className="fr-col-12 fr-col-md-9">
						<div className="fr-grid-row fr-grid-row--gutters">
							<div className="fr-col-12 fr-col-md-4">
								<ResourceTile
									detail="Réponses aux questions les plus courantes"
									href="/faq"
									pictogramPath="/dsfr/artwork/pictograms/system/information.svg"
									title="Questions fréquentes (FAQ)"
								/>
							</div>

							<div className="fr-col-12 fr-col-md-4">
								<ResourceTile
									detail="Consultez les textes législatifs et réglementaires"
									href="/textes-reference"
									pictogramPath="/dsfr/artwork/pictograms/document/document.svg"
									title="Textes de référence"
								/>
							</div>

							<div className="fr-col-12 fr-col-md-4">
								<ResourceTile
									detail="Besoin d&apos;aide ? Contactez nos services d&apos;assistance"
									href="/contact"
									pictogramPath="/dsfr/artwork/pictograms/digital/avatar.svg"
									title="Nous contacter"
								/>
							</div>
						</div>
					</div>

					<div
						aria-hidden="true"
						className="fr-col-3 fr-unhidden-md"
						style={{ display: "flex", justifyContent: "flex-end" }}
					>
						<img
							alt=""
							height="147"
							src="/assets/images/home/help-illustration.svg"
							width="210"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
