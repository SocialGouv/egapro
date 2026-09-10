"use client";

import Image from "next/image";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import type { AppHref } from "~/modules/routes";
import styles from "./AideResourceCards.module.scss";

type ResourceCardProps = {
	trackingId: string;
	title: string;
	description: string;
	href: AppHref;
	imageSrc: string;
	/** Alt text for the card image. Defaults to "" (decorative) since the card title provides context. */
	imageAlt?: string;
	/** DSFR card size variant. Defaults to no modifier (medium). */
	size?: "sm" | "lg";
};

function ResourceCard({
	trackingId,
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
					<h2 className="fr-card__title">
						<a
							href={href}
							onClick={() =>
								trackEvent({
									category: MATOMO_EVENT_CATEGORY.HELP,
									action: MATOMO_ACTION.AIDE_RESOURCE_CLICK,
									name: trackingId,
								})
							}
						>
							{title}
						</a>
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

export function AideResourceCards() {
	return (
		<div className="fr-grid-row fr-grid-row--gutters">
			<div className="fr-col-12 fr-col-md-6">
				<ResourceCard
					description="Tout savoir sur les indicateurs préremplis via votre DSN, les écarts de rémunération par catégorie et les modalités de calcul."
					href="https://travail-emploi.gouv.fr/index-de-legalite-professionnelle-calcul-et-questionsreponses"
					imageSrc="/assets/images/aide/indicateurs-remuneration.png"
					size="sm"
					title="Indicateurs de rémunération"
					trackingId="indicateurs-remuneration"
				/>
			</div>
			<div className="fr-col-12 fr-col-md-6">
				<ResourceCard
					description="Comprendre vos obligations pour les entreprises dont l'effectif dépasse 1 000 salariés et les modalités de déclaration des indicateurs de représentation."
					href="https://travail-emploi.gouv.fr/la-representation-equilibree-des-femmes-et-des-hommes-dans-les-postes-de-direction-des-grandes-entreprises#anchor-navigation-627"
					imageSrc="/assets/images/aide/indicateurs-representation.png"
					size="sm"
					title="Indicateurs de représentation"
					trackingId="indicateurs-representation"
				/>
			</div>
		</div>
	);
}
