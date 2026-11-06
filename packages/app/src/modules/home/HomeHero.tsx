import Link from "next/link";
import { MY_SPACE } from "~/modules/routes";
import styles from "./HomeHero.module.scss";

/** Hero section of the home page: title, text and CTA button. */
export function HomeHero() {
	return (
		<section aria-labelledby="hero-heading" className={styles.hero}>
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12 fr-col-md-7">
						<div className={styles.heroContent}>
							<h1 className="fr-mb-0" id="hero-heading">
								Bienvenue sur Egapro
							</h1>
							<p className={`fr-mb-0 ${styles.heroDescription}`}>
								L&apos;espace dédié aux entreprises pour déclarer leurs
								indicateurs de <br className={styles.heroDescriptionBreak} />
								rémunération et de représentation entre les femmes et les
								hommes.
							</p>
							<Link
								className={`fr-btn fr-icon-file-text-line fr-btn--icon-left ${styles.cta}`}
								href={MY_SPACE}
							>
								Déclarer mes indicateurs
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
