import Link from "next/link";

import styles from "./HomeHero.module.scss";

type InfoItemProps = {
	iconClass: string;
	title: string;
	description: string;
};

function HeroInfoItem({ iconClass, title, description }: InfoItemProps) {
	return (
		<div className={styles.infoItem}>
			<div aria-hidden="true" className={styles.infoItemIcon}>
				<span className={`${iconClass} fr-icon--lg`} />
			</div>
			<div className={styles.infoItemContent}>
				<p className={`fr-mb-0 ${styles.infoItemTitle}`}>{title}</p>
				<p className="fr-text--sm fr-mb-0">{description}</p>
			</div>
		</div>
	);
}

/** Hero section of the home page: title, text, CTA button and key indicators. */
export function HomeHero() {
	return (
		<section aria-labelledby="hero-heading" className={styles.hero}>
			<div className="fr-container fr-py-8w">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className={`fr-col-12 fr-col-md-7 ${styles.heroContent}`}>
						<h1 id="hero-heading">Bienvenue sur Egapro</h1>
						<p className="fr-mb-0">
							L&apos;espace dédié aux entreprises pour déclarer leurs
							indicateurs de rémunération et de représentation entre les femmes
							et les hommes.
						</p>
						<Link
							className={`fr-btn fr-icon-file-text-line fr-btn--icon-left ${styles.cta}`}
							href="/declaration-remuneration"
						>
							Déclarer mes indicateurs
						</Link>
					</div>

					<div className="fr-col-12 fr-col-md-5">
						<div className={styles.infoList}>
							<HeroInfoItem
								description="Plus de 35 000 entreprises déclarantes"
								iconClass="fr-icon-team-line"
								title="Entreprises de plus de 50 salariés"
							/>
							<HeroInfoItem
								description="Déclaration annuelle obligatoire"
								iconClass="fr-icon-calendar-line"
								title="Échéance : 1er mars"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
