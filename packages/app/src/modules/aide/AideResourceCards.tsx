import Image from "next/image";

import styles from "./AideResourceCards.module.scss";

type ResourceCardProps = {
	badge?: string;
	title: string;
	description: string;
	href: string;
	imageSrc: string;
	/** Alt text for the card image. Defaults to "" (decorative) since the card title provides context. */
	imageAlt?: string;
	/** DSFR card size variant. Defaults to no modifier (medium). */
	size?: "sm" | "lg";
};

function ResourceCard({
	badge,
	title,
	description,
	href,
	imageSrc,
	imageAlt = "",
	size,
}: ResourceCardProps) {
	const sizeClass = size ? ` fr-card--${size}` : "";
	return (
		<div className={`fr-card fr-card--horizontal fr-enlarge-link${sizeClass}`}>
			<div className="fr-card__body">
				<div className="fr-card__content">
					{badge && (
						<div className="fr-card__start">
							<ul className="fr-tags-group">
								<li>
									<p className="fr-tag fr-tag--sm">{badge}</p>
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
					<Image
						alt={imageAlt}
						className={`fr-responsive-img ${styles.containImg}`}
						height={200}
						src={imageSrc}
						width={400}
					/>
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
					imageSrc="/assets/images/aide/nouveau-site.png"
					size="sm"
					title="Nouveau site : ce qui change pour votre déclaration"
				/>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<ResourceCard
					description="Tout savoir sur les indicateurs préremplis via votre DSN, les écarts de rémunération par catégorie et les modalités de calcul."
					href="https://travail-emploi.gouv.fr/index-de-legalite-professionnelle-calcul-et-questionsreponses"
					imageSrc="/assets/images/aide/indicateurs-remuneration.png"
					size="sm"
					title="Indicateurs de rémunération"
				/>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<ResourceCard
					description="Comprendre vos obligations pour les entreprises dont l'effectif dépasse 1 000 salariés et les modalités de déclaration des indicateurs de représentation."
					href="https://travail-emploi.gouv.fr/la-representation-equilibree-des-femmes-et-des-hommes-dans-les-postes-de-direction-des-grandes-entreprises#anchor-navigation-627"
					imageSrc="/assets/images/aide/indicateurs-representation.png"
					size="sm"
					title="Indicateurs de représentation"
				/>
			</div>
		</div>
	);
}
