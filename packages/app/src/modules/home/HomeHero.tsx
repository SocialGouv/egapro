import Link from "next/link";
import { formatLongDate } from "~/modules/domain";
import { MY_SPACE } from "~/modules/routes";
import styles from "./HomeHero.module.scss";

type InfoItemProps = {
	iconClass: string;
	title: string;
	description: string | string[];
};

function HeroInfoItem({ iconClass, title, description }: InfoItemProps) {
	const descriptionLines = Array.isArray(description)
		? description
		: [description];
	return (
		<div className={styles.infoItem}>
			<div aria-hidden="true" className={styles.infoItemIcon}>
				<span className={`${iconClass} fr-icon--lg`} />
			</div>
			<div className={styles.infoItemContent}>
				<p className={`fr-mb-0 ${styles.infoItemTitle}`}>{title}</p>
				{descriptionLines.map((line) => (
					<p className="fr-text--sm fr-mb-0" key={line}>
						{line}
					</p>
				))}
			</div>
		</div>
	);
}

type HomeHeroProps = {
	remunerationDeadline: Date;
	representationDeadline: Date;
};

/** Hero section of the home page: title, text, CTA button and key indicators. */
export function HomeHero({
	remunerationDeadline,
	representationDeadline,
}: HomeHeroProps) {
	return (
		<section aria-labelledby="hero-heading" className={styles.hero}>
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div className={`fr-col-12 fr-col-md-7 ${styles.heroContent}`}>
						<h1 className="fr-mb-0" id="hero-heading">
							Bienvenue sur Egapro
						</h1>
						<p className={`fr-mb-0 ${styles.heroDescription}`}>
							L&apos;espace dédié aux entreprises pour déclarer leurs
							indicateurs de <br className={styles.heroDescriptionBreak} />
							rémunération et de représentation entre les femmes et les hommes.
						</p>
						<Link
							className={`fr-btn fr-icon-file-text-line fr-btn--icon-left ${styles.cta}`}
							href={MY_SPACE}
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
								description={[
									`Rémunération : ${formatLongDate(remunerationDeadline)}`,
									`Représentation équilibrée : ${formatLongDate(representationDeadline)}`,
								]}
								iconClass="fr-icon-calendar-line"
								title="Déclaration annuelle obligatoire"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
