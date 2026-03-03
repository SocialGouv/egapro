import { AideBreadcrumb } from "./AideBreadcrumb";
import { AideIllustration } from "./AideIllustration";
import styles from "./AideLayout.module.scss";
import { CopyEmailButton } from "./CopyEmailButton";

const CONTACT_EMAIL = "index@travail.gouv.fr";

/** Contact page with regional referent download link and national email. */
export function ContactPage() {
	return (
		<main className={styles.pageBackground} id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<AideBreadcrumb
					collapseId="breadcrumb-contact"
					current={{ label: "Nous contacter", href: "/aide/nous-contacter" }}
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Aide et ressources", href: "/aide" },
					]}
				/>

				<a
					aria-label="Retour à Aide et ressources"
					className="fr-link fr-icon-arrow-left-line fr-link--icon-left"
					href="/aide"
				>
					Retour
				</a>

				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8">
						<h1 className="fr-h1 fr-mt-4w">Nous contacter</h1>
						<p className="fr-mb-4w">
							Notre équipe est à votre disposition pour répondre à vos questions
							concernant les indicateurs d'égalité professionnelle.
						</p>

						<div className="fr-mb-4w">
							<h2 className="fr-h6">Contactez votre référent régional :</h2>
							<a
								className="fr-link fr-link--download"
								download
								href="/assets/documents/referents-egapro-dreets.xlsx"
							>
								Télécharger la liste des référents Egapro - Dreets
								<span className="fr-link__detail">EXCEL – 61,88 Ko</span>
							</a>
						</div>

						<div className="fr-mb-4w">
							<h2 className="fr-h6">
								Vous pouvez également contacter l'équipe nationale à cette
								adresse :
							</h2>
							<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
								<div className="fr-col-auto">
									<span>{CONTACT_EMAIL}</span>
								</div>
								<div className="fr-col-auto">
									<CopyEmailButton email={CONTACT_EMAIL} />
								</div>
							</div>
						</div>

						<AideIllustration />
					</div>
				</div>
			</div>
		</main>
	);
}
