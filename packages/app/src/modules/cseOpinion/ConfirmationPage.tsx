import Link from "next/link";
import { ComplianceCompletionEffect } from "~/modules/declaration-remuneration";
import { getCurrentYear } from "~/modules/domain";
import { DsfrPictogram } from "~/modules/home";
import styles from "./ConfirmationPage.module.scss";
import formStyles from "./shared/formActions.module.scss";

const DOWNLOAD_CARD_TITLES = [
	"Télécharger le récapitulatif de la déclaration des indicateurs",
	"Télécharger le récapitulatif de la seconde déclaration de l\u2019indicateur par catégorie de salarié",
	"Télécharger le récapitulatif des éléments transmis",
];
type Props = {
	email?: string;
};

export function ConfirmationPage({ email }: Props) {
	const displayEmail = email ?? "adresse@exemple.fr";
	const dataYear = getCurrentYear();
	const year = dataYear + 1;
	return (
		<div>
			<ComplianceCompletionEffect />
			<h1 className="fr-h4 fr-mb-4w">
				Démarche des indicateurs de rémunération {year}
			</h1>
			<div className={`fr-mb-4w ${styles.successRow}`}>
				<DsfrPictogram
					path="/dsfr/artwork/pictograms/system/success.svg"
					size={64}
				/>
				<p className="fr-text--lg fr-text--bold fr-mb-0">
					Votre parcours {year} est désormais terminé
				</p>
			</div>
			<div className={styles.receiptCard}>
				<p className="fr-text--sm fr-mb-1w">
					Un accusé de réception a été envoyé à l&apos;adresse e-mail{" "}
					<strong>{displayEmail}</strong>.
				</p>
				<p className="fr-text--sm fr-text--mention-grey fr-mb-2w">
					Si ce n&apos;est pas le cas, vérifiez vos courriers indésirables ou
					SPAM. Sinon, cliquez sur le bouton ci-dessous.
				</p>
				<button className="fr-btn fr-btn--tertiary fr-btn--sm" type="button">
					Renvoyer l&apos;accusé de réception
				</button>
			</div>

			<h2 className="fr-h5 fr-mb-3w">
				Documents récapitulatifs de votre déclaration
			</h2>

			<div className={`fr-mb-4w ${styles.downloadCards}`}>
				{DOWNLOAD_CARD_TITLES.map((title) => (
					<div className={styles.downloadCard} key={title}>
						<p className="fr-text--bold fr-text--md fr-mb-1w">{title}</p>
						<p className="fr-text--sm fr-text--default-grey fr-mb-1w">
							Année {year} au titre des données {dataYear}
						</p>
						<div className={styles.downloadFooter}>
							<span className="fr-text--xs fr-text--mention-grey">PDF</span>
							<span aria-hidden="true" className="fr-icon-download-line" />
						</div>
					</div>
				))}
			</div>

			<div className={`fr-p-5w fr-mb-4w ${styles.feedbackBanner}`}>
				<div>
					<p className="fr-text--bold fr-mb-1w">
						Comment s&apos;est passée votre démarche ?
					</p>
					<p className="fr-text--sm fr-mb-0">
						Aidez nous à améliorer Egapro en donnant votre avis, cela ne prend
						que 2 minutes.
					</p>
				</div>
			</div>
			<div className={formStyles.actions}>
				<Link
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					href="/avis-cse/etape/2"
				>
					Modifier mes dépôts
				</Link>
				<Link className="fr-btn" href="/mon-espace">
					Mon espace
				</Link>
			</div>
		</div>
	);
}
