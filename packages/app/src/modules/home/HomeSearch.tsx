import Image from "next/image";
import styles from "./HomeSearch.module.scss";
import { HomeSearchForm } from "./HomeSearchForm";

export function HomeSearch() {
	return (
		<section aria-labelledby="search-heading" className="fr-py-7w">
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div
						aria-hidden="true"
						className={`fr-hidden fr-unhidden-md fr-col-md-4 ${styles.illustrationWrapper}`}
					>
						<Image
							alt=""
							className={styles.illustration}
							height={240}
							src="/assets/images/home/search-illustration.svg"
							unoptimized
							width={223}
						/>
					</div>

					<div className={`fr-col-12 fr-col-md-8 ${styles.content}`}>
						<h2 className="fr-h3 fr-mb-0" id="search-heading">
							Consulter les résultats d&apos;une entreprise
						</h2>
						<p className={`fr-mb-0 ${styles.description}`}>
							Les résultats déclarés par les entreprises sont publics pour les
							indicateurs de rémunération pour l&apos;ensemble des salariés et
							les indicateurs de représentation dans les postes de direction.
						</p>
						<HomeSearchForm />
					</div>
				</div>
			</div>
		</section>
	);
}
