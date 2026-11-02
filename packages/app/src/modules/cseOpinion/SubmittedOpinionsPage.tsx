import Link from "next/link";
import type { CseOpinionRecapData } from "~/modules/declarationPdf/buildCseOpinionRecapData";
import { Breadcrumb } from "~/modules/layout";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import {
	API_CSE_OPINION_PDF,
	apiV1FileHref,
	MY_SPACE,
	MY_SPACE_JOINT_EVALUATION_VIEW,
} from "~/modules/routes";
import { FileDownloadLink, FileFormatDetail } from "~/modules/shared";
import styles from "./SubmittedOpinionsPage.module.scss";
import {
	ASSOCIATED_FILE_LABEL,
	SUBMITTED_FILES_TITLE,
	type SubmittedInfoRow,
	UNASSOCIATED_FILE_LABEL,
} from "./submittedOpinionLabels";

type Props = CseOpinionRecapData & { hasSubmittedJointEvaluation: boolean };

function InfoList({ rows }: { rows: SubmittedInfoRow[] }) {
	return (
		<dl className={`fr-raw-list ${styles.infoList}`}>
			{rows.map(({ label, value }) => (
				<div className={styles.infoRow} key={label}>
					<dt className={styles.infoLabel}>{label}</dt>
					<dd className={styles.infoValue}>{value}</dd>
				</div>
			))}
		</dl>
	);
}

function InfoGroup({
	title,
	rows,
}: {
	title: string;
	rows: SubmittedInfoRow[];
}) {
	return (
		<div className={styles.group}>
			<h3 className="fr-text--md fr-text--bold fr-mb-0">{title}</h3>
			<InfoList rows={rows} />
		</div>
	);
}

function DeclarationOpinions({
	declaration,
}: {
	declaration: CseOpinionRecapData["declarations"][number];
}) {
	return (
		<div className={styles.section}>
			<h3 className="fr-text--lg fr-text--bold fr-mb-0">{declaration.title}</h3>
			{declaration.opinions.map((opinion) => (
				<div className={styles.group} key={opinion.id}>
					<h4 className="fr-text--md fr-text--bold fr-mb-0">{opinion.title}</h4>
					<InfoList rows={opinion.rows} />
				</div>
			))}
		</div>
	);
}

function FilesTable({
	columns,
	files,
}: Pick<CseOpinionRecapData, "files"> & {
	columns: CseOpinionRecapData["fileColumns"];
}) {
	return (
		<div className="fr-table fr-table--bordered fr-mb-0">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">
								Fichiers déposés et avis du CSE auxquels ils sont associés
							</caption>
							<thead>
								<tr>
									<th scope="col">{SUBMITTED_FILES_TITLE}</th>
									{columns.map((column) => (
										<th key={column.id} scope="col">
											{column.label}
											{column.declarationLabel && (
												<>
													{" "}
													<br />
													{column.declarationLabel}
												</>
											)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{files.map((file) => (
									<tr key={file.id}>
										<th className={styles.fileCell} scope="row">
											<a
												className={`fr-link fr-icon-external-link-line fr-link--icon-right ${styles.fileLink}`}
												href={apiV1FileHref(file.id)}
												rel="noopener noreferrer"
												target="_blank"
												title={`Visualiser ${file.name}`}
											>
												<span className={styles.fileName}>{file.name}</span>
												<NewTabNotice />
											</a>
											<p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
												{file.detail}
											</p>
										</th>
										{columns.map((column) => {
											const associated = file.columnIds.includes(column.id);
											return (
												<td className={styles.markCell} key={column.id}>
													<span
														aria-hidden="true"
														className={
															associated
																? "fr-icon-check-line"
																: "fr-icon-subtract-line"
														}
													/>
													<span className="fr-sr-only">
														{associated
															? ASSOCIATED_FILE_LABEL
															: UNASSOCIATED_FILE_LABEL}
													</span>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

export function SubmittedOpinionsPage({
	year,
	transmittedAt,
	company,
	declarantRows,
	companyRows,
	referencePeriods,
	declarations,
	fileColumns,
	files,
	hasSubmittedJointEvaluation,
}: Props) {
	const recapHref = `${API_CSE_OPINION_PDF}?year=${year}`;
	return (
		<>
			<div className="fr-container fr-pt-3w">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/" },
						{ label: company.name, href: MY_SPACE },
						{ label: `Démarche des indicateurs de rémunération ${year}` },
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
				className="fr-container fr-pb-8w fr-pt-4w"
				id="content"
				tabIndex={-1}
			>
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-lg-8">
						<div className={styles.content}>
							<div className={styles.headingRow}>
								<div>
									<h1 className="fr-h4 fr-mb-1w">
										Transmission du ou des avis du CSE {year}
									</h1>
									<p className="fr-mb-0">
										La déclaration a été transmise le {transmittedAt}.
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
											le récapitulatif de la transmission du ou des avis du CSE
											(PDF)
										</span>
									</FileDownloadLink>
									<p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
										<FileFormatDetail href={recapHref} />
									</p>
								</div>
							</div>

							<section className={styles.section}>
								<h2 className="fr-h6 fr-mb-0">Informations</h2>
								<InfoGroup rows={declarantRows} title="Déclarant" />
								<InfoGroup rows={companyRows} title="Entreprise" />
								<InfoGroup rows={referencePeriods} title="Calcul" />
							</section>

							<section className={styles.group}>
								<h2 className="fr-text--lg fr-text--bold fr-mb-0">
									Évaluation conjointe des rémunérations
								</h2>
								<p className="fr-mb-0">
									{hasSubmittedJointEvaluation ? "Oui" : "Non"}
								</p>
								{hasSubmittedJointEvaluation && (
									<p className="fr-mb-0">
										<Link
											className="fr-link"
											href={MY_SPACE_JOINT_EVALUATION_VIEW}
										>
											Consulter le rapport de l’évaluation conjointe
										</Link>
									</p>
								)}
							</section>

							<section className={styles.section}>
								<h2 className="fr-h6 fr-mb-0">Avis CSE</h2>
								{declarations.map((declaration) => (
									<DeclarationOpinions
										declaration={declaration}
										key={declaration.declarationNumber}
									/>
								))}
								<div className={styles.group}>
									<h3 className="fr-text--lg fr-text--bold fr-mb-0">
										{SUBMITTED_FILES_TITLE}
									</h3>
									<FilesTable columns={fileColumns} files={files} />
								</div>
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
