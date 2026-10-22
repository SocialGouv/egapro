import Link from "next/link";
import {
	companyLocationRow,
	formatWorkforceForUser,
	getDeclarationReferencePeriod,
	getObligationWorkforce,
	isCseRequired,
} from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import {
	apiV1FileHref,
	MY_SPACE,
	MY_SPACE_JOINT_EVALUATION_VIEW,
} from "~/modules/routes";

export type SubmittedOpinion = {
	declarationNumber: number;
	type: string;
	gapConsulted: boolean | null;
	opinion: string | null;
	opinionDate: string | null;
};

export type SubmittedOpinionAssociation = {
	declarationNumber: number;
	type: string;
	fileId: string;
	fileName: string;
	uploadedAt: Date;
};

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
	declarationYear: number;
	declarantFirstName: string | null;
	declarantLastName: string | null;
	declarantEmail: string;
	declarantPhone: string | null;
	submittedAt: Date;
	secondDeclReferencePeriodStart: string | null;
	secondDeclReferencePeriodEnd: string | null;
	hasSubmittedSecondDeclaration: boolean;
	hasSubmittedJointEvaluation: boolean;
	opinions: SubmittedOpinion[];
	associations: SubmittedOpinionAssociation[];
};

export function formatSubmittedOpinionDate(value: Date | string): string {
	const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
	return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(
		date,
	);
}

export function getSubmittedOpinionLabel(opinion: string | null): string {
	if (opinion === "favorable") return "Favorable";
	if (opinion === "unfavorable") return "Défavorable";
	return "Non renseigné";
}

export function getSubmittedOpinionTypeLabel(type: string): string {
	return type === "accuracy"
		? "Exactitude des données et des méthodes de calcul"
		: "Justification des écarts ≥ 5 %";
}

export function SubmittedOpinionsPage({
	company,
	declarationYear,
	declarantFirstName,
	declarantLastName,
	declarantEmail,
	declarantPhone,
	submittedAt,
	secondDeclReferencePeriodStart,
	secondDeclReferencePeriodEnd,
	hasSubmittedSecondDeclaration,
	hasSubmittedJointEvaluation,
	opinions,
	associations,
}: Props) {
	const declarationNumbers = [
		...new Set(opinions.map((row) => row.declarationNumber)),
	].sort((a, b) => a - b);
	const files = [
		...new Map(associations.map((row) => [row.fileId, row])).values(),
	];
	const columns = [
		...new Map(
			associations.map((row) => [
				`${row.declarationNumber}:${row.type}`,
				{ declarationNumber: row.declarationNumber, type: row.type },
			]),
		).values(),
	].sort(
		(a, b) =>
			a.declarationNumber - b.declarationNumber || a.type.localeCompare(b.type),
	);
	const declarantName = [declarantFirstName, declarantLastName]
		.filter(Boolean)
		.join(" ");
	const location = companyLocationRow({
		countryCode: company.countryCode,
		countryLabel: company.countryLabel,
		departmentLabel: company.departmentLabel,
		domesticAddress: company.address,
	});
	const cseApplicable = isCseRequired(
		getObligationWorkforce(company.gipWorkforce),
	);

	return (
		<>
			<div className="fr-container fr-pt-3w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Mon espace", href: MY_SPACE },
						{ label: "Avis du CSE" },
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
						<div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
							<div className="fr-col">
								<h1 className="fr-h4">
									Avis du CSE pour la déclaration des indicateurs de
									rémunération {declarationYear}
								</h1>
								<p>
									Les avis ont été transmis le{" "}
									{formatSubmittedOpinionDate(submittedAt)}
								</p>
							</div>
							{files.length === 1 && files[0] && (
								<div className="fr-col-auto">
									<a
										className="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-download-line"
										download={files[0].fileName}
										href={apiV1FileHref(files[0].fileId)}
									>
										Télécharger
									</a>
								</div>
							)}
						</div>

						<section
							aria-labelledby="cse-identite"
							className="fr-mb-6w fr-mt-6w"
						>
							<h2 className="fr-h6" id="cse-identite">
								Informations
							</h2>
							<h3 className="fr-text--md fr-text--bold">Déclarant</h3>
							<dl className="fr-grid-row fr-grid-row--gutters">
								<div className="fr-col-12 fr-col-md-6">
									<dt className="fr-text--bold">Nom Prénom</dt>
									<dd>{declarantName || "Non renseigné"}</dd>
								</div>
								<div className="fr-col-12 fr-col-md-6">
									<dt className="fr-text--bold">Adresse email</dt>
									<dd>{declarantEmail}</dd>
								</div>
								<div className="fr-col-12 fr-col-md-6">
									<dt className="fr-text--bold">Téléphone</dt>
									<dd>{declarantPhone || "Non renseigné"}</dd>
								</div>
							</dl>
							<h3 className="fr-text--md fr-text--bold">Entreprise</h3>
							<dl className="fr-grid-row fr-grid-row--gutters">
								<div className="fr-col-12 fr-col-md-6">
									<dt className="fr-text--bold">Raison sociale</dt>
									<dd>{company.name}</dd>
								</div>
								<div className="fr-col-12 fr-col-md-6">
									<dt className="fr-text--bold">SIREN</dt>
									<dd>{company.siren}</dd>
								</div>
								{location && (
									<div className="fr-col-12 fr-col-md-6">
										<dt className="fr-text--bold">{location.label}</dt>
										<dd>{location.value}</dd>
									</div>
								)}
								{company.nafCode && (
									<div className="fr-col-12 fr-col-md-6">
										<dt className="fr-text--bold">Code NAF</dt>
										<dd>
											{[company.nafCode, company.nafLabel]
												.filter(Boolean)
												.join(" — ")}
										</dd>
									</div>
								)}
								<div className="fr-col-12 fr-col-md-6">
									<dt className="fr-text--bold">
										Effectif annuel moyen en {declarationYear}
									</dt>
									<dd>{formatWorkforceForUser(company.gipWorkforce)}</dd>
								</div>
								{cseApplicable && (
									<div className="fr-col-12 fr-col-md-6">
										<dt className="fr-text--bold">Existence d’un CSE</dt>
										<dd>
											{company.hasCse === null
												? "Non renseigné"
												: company.hasCse
													? "Oui"
													: "Non"}
										</dd>
									</div>
								)}
							</dl>
						</section>
						<section aria-labelledby="cse-calcul" className="fr-mb-6w">
							<h2 className="fr-h6" id="cse-calcul">
								Calcul
							</h2>
							<dl>
								<div>
									<dt className="fr-text--bold">
										Période de référence
										{hasSubmittedSecondDeclaration
											? " de la première déclaration"
											: ""}
									</dt>
									<dd>
										{getDeclarationReferencePeriod(
											declarationYear,
											false,
											null,
											null,
										)}
									</dd>
								</div>
								{hasSubmittedSecondDeclaration && (
									<div>
										<dt className="fr-text--bold">
											Période de référence de la deuxième déclaration
										</dt>
										<dd>
											{getDeclarationReferencePeriod(
												declarationYear,
												true,
												secondDeclReferencePeriodStart,
												secondDeclReferencePeriodEnd,
											)}
										</dd>
									</div>
								)}
							</dl>
						</section>
						<section aria-labelledby="cse-evaluation" className="fr-mb-6w">
							<h2 className="fr-h6" id="cse-evaluation">
								Évaluation conjointe des rémunérations
							</h2>
							<p>{hasSubmittedJointEvaluation ? "Oui" : "Non"}</p>
							{hasSubmittedJointEvaluation && (
								<Link className="fr-link" href={MY_SPACE_JOINT_EVALUATION_VIEW}>
									Consulter le rapport de l’évaluation conjointe
								</Link>
							)}
						</section>

						<section aria-labelledby="cse-opinions" className="fr-mb-6w">
							<h2 className="fr-h6" id="cse-opinions">
								Avis rendus par le CSE
							</h2>
							{declarationNumbers.map((number) => (
								<div className="fr-mb-4w" key={number}>
									<h3 className="fr-text--md fr-text--bold">
										{number === 1 ? "Première" : "Deuxième"} déclaration
									</h3>
									<dl className="fr-grid-row fr-grid-row--gutters">
										{opinions
											.filter((row) => row.declarationNumber === number)
											.map((row) => (
												<div
													className="fr-col-12 fr-col-md-6"
													key={`${number}:${row.type}`}
												>
													<dt className="fr-text--bold">
														{getSubmittedOpinionTypeLabel(row.type)}
													</dt>
													<dd>
														{row.type === "gap" &&
														row.gapConsulted === false ? (
															"Le CSE n’a pas été consulté"
														) : (
															<>
																{getSubmittedOpinionLabel(row.opinion)}
																{row.opinionDate
																	? ` — avis du ${formatSubmittedOpinionDate(row.opinionDate)}`
																	: ""}
															</>
														)}
													</dd>
												</div>
											))}
									</dl>
								</div>
							))}
						</section>

						<section aria-labelledby="cse-files" className="fr-mb-6w">
							<h2 className="fr-h6" id="cse-files">
								Fichiers transmis
							</h2>
							<div className="fr-table fr-table--bordered">
								<div className="fr-table__wrapper">
									<div className="fr-table__container">
										<div className="fr-table__content">
											<table>
												<caption className="fr-sr-only">
													Fichiers associés aux avis du CSE transmis
												</caption>
												<thead>
													<tr>
														<th scope="col">Fichier</th>
														{columns.map((column) => (
															<th
																key={`${column.declarationNumber}:${column.type}`}
																scope="col"
															>
																{getSubmittedOpinionTypeLabel(column.type)} —{" "}
																{column.declarationNumber === 1
																	? "première"
																	: "deuxième"}{" "}
																déclaration
															</th>
														))}
														<th scope="col">Téléchargement</th>
													</tr>
												</thead>
												<tbody>
													{files.map((file) => (
														<tr key={file.fileId}>
															<th scope="row">
																<a
																	className="fr-link"
																	href={apiV1FileHref(file.fileId)}
																	rel="noopener noreferrer"
																	target="_blank"
																	title={`Visualiser ${file.fileName}`}
																>
																	{file.fileName}
																	<NewTabNotice />
																</a>
															</th>
															{columns.map((column) => {
																const associated = associations.some(
																	(row) =>
																		row.fileId === file.fileId &&
																		row.declarationNumber ===
																			column.declarationNumber &&
																		row.type === column.type,
																);
																return (
																	<td
																		key={`${column.declarationNumber}:${column.type}`}
																	>
																		{associated ? (
																			<span
																				aria-label="Avis associé"
																				className="fr-icon-check-line"
																				role="img"
																			/>
																		) : (
																			<span className="fr-sr-only">
																				Non associé
																			</span>
																		)}
																	</td>
																);
															})}
															<td>
																<a
																	aria-label={`Télécharger ${file.fileName}`}
																	className="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-download-line"
																	download={file.fileName}
																	href={apiV1FileHref(file.fileId)}
																>
																	Télécharger
																</a>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							</div>
						</section>
						<Link className="fr-btn fr-btn--secondary" href={MY_SPACE}>
							Mon espace
						</Link>
					</div>
				</div>
			</main>
		</>
	);
}
