import Image from "next/image";

import styles from "./ErrorImage.module.scss";

/** 503 Service Unavailable page content following DSFR error page template. */
export function MaintenancePage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container">
				<div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
					<div className="fr-py-0 fr-col-12 fr-col-md-6">
						<h1>Service indisponible</h1>
						<p className="fr-text--sm fr-mb-3w">Erreur 503</p>
						<p className="fr-text--sm fr-mb-5w">
							Désolé, le service est temporairement inaccessible, la page
							demandée ne peut être affichée.
						</p>
						<p className="fr-text--lead fr-mb-3w">
							Merci de réessayer plus tard, vous serez bientôt en mesure de
							réutiliser le service.
						</p>
					</div>
					<div
						className={`fr-col-12 fr-col-md-4 fr-col-offset-md-1 fr-py-0 ${styles.container}`}
					>
						<Image
							alt=""
							aria-hidden="true"
							className={styles.image}
							height={300}
							src="/assets/images/error/technical-error-illustration.svg"
							unoptimized
							width={300}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
