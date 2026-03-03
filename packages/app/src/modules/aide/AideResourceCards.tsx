type ResourceCardProps = {
	badge?: string;
	title: string;
	description: string;
	href: string;
	imageSrc: string;
	imageAlt: string;
};

function ResourceCard({
	badge,
	title,
	description,
	href,
	imageSrc,
	imageAlt,
}: ResourceCardProps) {
	return (
		<div className="fr-card fr-card--horizontal fr-enlarge-link fr-card--lg">
			<div className="fr-card__body">
				<div className="fr-card__content">
					{badge && (
						<div className="fr-card__start">
							<ul className="fr-badges-group">
								<li>
									<p className="fr-badge fr-badge--new">{badge}</p>
								</li>
							</ul>
						</div>
					)}
					<h2 className="fr-card__title">
						<a href={href}>{title}</a>
					</h2>
					<p className="fr-card__desc">{description}</p>
				</div>
			</div>
			<div className="fr-card__header">
				<div className="fr-card__img">
					<img alt={imageAlt} className="fr-responsive-img" src={imageSrc} />
				</div>
			</div>
		</div>
	);
}

/** Three resource cards: new site announcement + two indicator guides. */
export function AideResourceCards() {
	return (
		<div className="fr-grid-row fr-grid-row--gutters">
			<div className="fr-col-12">
				<ResourceCard
					badge="Nouveau"
					description="Retrouvez toutes les informations sur les changements apportés par la refonte du site et leurs impacts sur votre déclaration."
					href="/aide/nouveau-site"
					imageAlt=""
					imageSrc="/assets/images/aide/nouveau-site.png"
					title="Nouveau site : ce qui change pour votre déclaration"
				/>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<ResourceCard
					description="Tout savoir sur les indicateurs préremplis via votre DSN, les écarts de rémunération par catégorie et les modalités de calcul."
					href="/aide/indicateurs-remuneration"
					imageAlt=""
					imageSrc="/assets/images/aide/indicateurs-remuneration.png"
					title="Indicateurs de rémunération"
				/>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<ResourceCard
					description="Comprendre vos obligations pour les entreprises dont l'effectif dépasse 1 000 salariés et les modalités de déclaration des indicateurs de représentation."
					href="/aide/indicateurs-representation"
					imageAlt=""
					imageSrc="/assets/images/aide/indicateurs-representation.png"
					title="Indicateurs de représentation"
				/>
			</div>
		</div>
	);
}
