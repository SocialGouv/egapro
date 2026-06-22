import Image from "next/image";
import styles from "./HomeSearch.module.scss";
import { HomeSearchForm } from "./HomeSearchForm";

/** Company search section by SIREN, region, department or sector. */
export function HomeSearch() {
	return (
		<section aria-labelledby="search-heading" className="fr-py-8w">
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12">
						<h2 className="fr-mb-2w" id="search-heading">
							Rechercher une entreprise et consulter ses résultats
						</h2>
						<p>
							Accédez aux résultats d&apos;égalité professionnelle des
							entreprises, comprenant :
						</p>
						<ul>
							<li>
								les <strong>indicateurs de rémunération</strong>
								{" femmes-hommes pour l'ensemble des salariés"}
							</li>
							<li>
								les <strong>indicateurs de représentation</strong>
								{" femmes-hommes au sein des postes de direction"}
							</li>
						</ul>
					</div>
				</div>

				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div
						aria-hidden="true"
						className={`fr-hidden fr-unhidden-md fr-col-md-3 ${styles.illustrationWrapper}`}
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

					<search className="fr-col-12 fr-col-md-9">
						<HomeSearchForm />
					</search>
				</div>
			</div>
		</section>
	);
}
