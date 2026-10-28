import Link from "next/link";
import {
	companyLocationRow,
	formatShortDate,
	formatWorkforceForUser,
	getObligationWorkforce,
	isCseRequired,
} from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import {
	API_JOINT_EVALUATION_PDF,
	apiV1FileHref,
	MY_SPACE,
} from "~/modules/routes";
import { FileDownloadLink, FileFormatDetail } from "~/modules/shared";
import styles from "./JointEvaluationView.module.scss";

type InfoItem = { label: string; value: string };

type Props = {
	company: {
		name: string;
		siren: string;
		address: string | null;
		countryCode: string | null;
		countryLabel: string | null;
		departmentLabel: string | null;
		gipWorkforce: number | null;
		nafCode: string | null;
		nafLabel: string | null;
		hasCse: boolean | null;
	};
	declarant: {
		firstName: string | null;
		lastName: string | null;
		email: string;
		phone: string | null;
	} | null;
	file: { id: string; fileName: string; uploadedAt: Date };
	referencePeriod: string;
	submittedAt: Date;
	year: number;
};

function InfoSection({ title, items }: { title: string; items: InfoItem[] }) {
	return (
		<div>
			<h3 className="fr-text--md fr-text--bold fr-mb-2w">{title}</h3>
			<dl className={`fr-raw-list ${styles.infoList}`}>
				{items.map(({ label, value }) => (
					<div className={styles.infoRow} key={label}>
						<dt className={styles.infoLabel}>{label}</dt>
						<dd className={styles.infoValue}>{value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

export function JointEvaluationView({
	company,
	declarant,
	file,
	referencePeriod,
	submittedAt,
	year,
}: Props) {
	const recapHref = `${API_JOINT_EVALUATION_PDF}?year=${year}`;
	const name = [declarant?.firstName, declarant?.lastName]
		.filter(Boolean)
		.join(" ");
	const declarantItems: InfoItem[] = [];
	if (name) declarantItems.push({ label: "Nom Prénom", value: name });
	if (declarant?.email)
		declarantItems.push({ label: "Adresse email", value: declarant.email });
	declarantItems.push({
		label: "Téléphone",
		value: declarant?.phone || "Non renseigné",
	});

	const companyItems: InfoItem[] = [
		{ label: "Raison sociale", value: company.name },
		{ label: "SIREN", value: company.siren },
	];
	const location = companyLocationRow({
		countryCode: company.countryCode,
		countryLabel: company.countryLabel,
		departmentLabel: company.departmentLabel,
		domesticAddress: company.address,
	});
	if (location) companyItems.push(location);
	if (company.nafCode) {
		companyItems.push({
			label: "Code NAF",
			value: [company.nafCode, company.nafLabel].filter(Boolean).join(" — "),
		});
	}
	companyItems.push({
		label: `Effectif annuel moyen en ${year}`,
		value: formatWorkforceForUser(company.gipWorkforce),
	});
	if (isCseRequired(getObligationWorkforce(company.gipWorkforce))) {
		companyItems.push({
			label: "Existence d’un CSE",
			value:
				company.hasCse === null
					? "Non renseigné"
					: company.hasCse
						? "Oui"
						: "Non",
		});
	}

	return (
		<>
			<div className="fr-container fr-pt-3w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Mon espace", href: MY_SPACE },
						{ label: "Rapport de l’évaluation conjointe" },
					]}
				/>
				<Link
					className="fr-link fr-icon-arrow-left-line fr-link--icon-left fr-mt-2w"
					href={MY_SPACE}
				>
					Retour
				</Link>
			</div>
			<main
				className="fr-container fr-pb-7w fr-pt-7w"
				id="content"
				tabIndex={-1}
			>
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-lg-8">
						<div className={styles.content}>
							<div className={styles.headingRow}>
								<div>
									<h1 className="fr-h4 fr-mb-2w">
										Évaluation conjointe des rémunérations {year}
									</h1>
									<p className="fr-mb-0">
										La déclaration a été transmise le{" "}
										{formatShortDate(submittedAt)}
									</p>
								</div>
								<div>
									<FileDownloadLink
										className="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-download-line"
										href={recapHref}
										pendingLabel="Génération du récapitulatif en cours…"
									>
										Télécharger{" "}
										<span className="fr-sr-only">
											le récapitulatif de l'évaluation conjointe des
											rémunérations (PDF)
										</span>
									</FileDownloadLink>
									<p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
										<FileFormatDetail href={recapHref} />
									</p>
								</div>
							</div>
							<section className={styles.sectionContent}>
								<h2 className="fr-h6 fr-mb-0">Informations</h2>
								<InfoSection items={declarantItems} title="Déclarant" />
								<InfoSection items={companyItems} title="Entreprise" />
							</section>
							<section>
								<h2 className="fr-h6 fr-mb-3w">Calcul</h2>
								<dl className={`fr-raw-list ${styles.infoList}`}>
									<div className={styles.infoRow}>
										<dt className={styles.infoLabel}>Période de référence</dt>
										<dd className={styles.infoValue}>{referencePeriod}</dd>
									</div>
								</dl>
							</section>
							<section>
								<h2 className="fr-h6 fr-mb-3w">
									Évaluation conjointe des rémunérations
								</h2>
								<p className="fr-text--bold fr-mb-2w">Fichiers déposés</p>
								<a
									className="fr-link fr-icon-external-link-line fr-link--icon-right"
									href={apiV1FileHref(file.id)}
									rel="noopener noreferrer"
									target="_blank"
									title={`Visualiser ${file.fileName}`}
								>
									{file.fileName}
									<NewTabNotice />
								</a>
								<p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
									Déposé le {formatShortDate(file.uploadedAt)} · PDF
								</p>
							</section>
							<Link
								className={`fr-btn fr-btn--secondary ${styles.bottomAction}`}
								href={MY_SPACE}
							>
								Mon espace
							</Link>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
