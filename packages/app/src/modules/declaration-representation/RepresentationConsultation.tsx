import Link from "next/link";

import {
	companyLocationRow,
	formatOptionalIsoDate,
	formatPercentage,
	formatShortDate,
	formatSiren,
	formatWorkforceForUser,
} from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { formatNafForDisplay } from "~/modules/my-space";
import { API_REPRESENTATION_PDF, MY_SPACE } from "~/modules/routes";
import { FileFormatDetail } from "~/modules/shared";
import { DsfrTable } from "~/modules/shared/DsfrTable";
import styles from "./RepresentationConsultation.module.scss";
import { ComplianceBadge } from "./shared/ComplianceBadge";
import { type InfoItem, InfoList } from "./shared/InfoList";
import { publicationInfoItems } from "./shared/PublicationSummary";
import { summarizeRepresentationReview } from "./shared/reviewSummary";
import type { RepresentationDraft } from "./types";

type CompanyInfo = {
	name: string;
	siren: string;
	nafCode: string | null;
	nafLabel: string | null;
	address: string | null;
	countryCode: string | null;
	countryLabel: string | null;
	departmentLabel: string | null;
};

type DeclarantInfo = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
};

type Props = {
	campaignYear: number;
	referenceYear: number;
	submittedAt: Date | null;
	company: CompanyInfo;
	declarant: DeclarantInfo;
	workforceEma: number | null;
	draft: RepresentationDraft;
};

export function RepresentationConsultation({
	campaignYear,
	referenceYear,
	submittedAt,
	company,
	declarant,
	workforceEma,
	draft,
}: Props) {
	const summary = summarizeRepresentationReview(draft, campaignYear);
	const title = `Démarche des indicateurs de représentation ${campaignYear}`;

	const declarantName = [declarant.firstName, declarant.lastName]
		.filter(Boolean)
		.join(" ");
	const declarantItems: InfoItem[] = [];
	if (declarantName) {
		declarantItems.push({ label: "Nom Prénom", value: declarantName });
	}
	if (declarant.email) {
		declarantItems.push({ label: "Adresse email", value: declarant.email });
	}
	if (declarant.phone) {
		declarantItems.push({
			label: "Numéro de téléphone",
			value: declarant.phone,
		});
	}

	const companyItems: InfoItem[] = [
		{ label: "Raison sociale", value: company.name },
		{ label: "SIREN", value: formatSiren(company.siren) },
	];
	const location = companyLocationRow({
		countryCode: company.countryCode,
		countryLabel: company.countryLabel,
		departmentLabel: company.departmentLabel,
		domesticAddress: company.address,
	});
	if (location) companyItems.push(location);
	const naf = formatNafForDisplay(company.nafCode, company.nafLabel);
	if (naf) companyItems.push({ label: "Code NAF", value: naf });
	companyItems.push({
		label: `Effectif annuel moyen en ${referenceYear}`,
		value: formatWorkforceForUser(workforceEma),
	});

	const calcItems: InfoItem[] = [
		{
			label: "Période de référence",
			value: `${formatOptionalIsoDate(draft.referencePeriodStart)} - ${formatOptionalIsoDate(draft.referencePeriodEnd)}`,
		},
	];

	const pdfHref = `${API_REPRESENTATION_PDF}?year=${referenceYear}`;

	const transmittedLabel =
		submittedAt === null
			? "La déclaration a été transmise."
			: `La déclaration a été transmise le ${formatShortDate(submittedAt)}.`;

	return (
		<>
			<div className="fr-container fr-pt-3w">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: MY_SPACE },
						{ label: company.name, href: MY_SPACE },
						{ label: title },
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
					<div className={`fr-col-12 fr-col-lg-8 ${styles.page}`}>
						<div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
							<div className="fr-col">
								<h1 className="fr-h4 fr-mb-1w">{title}</h1>
								<p className="fr-text--md fr-mb-0">{transmittedLabel}</p>
							</div>
							<div className="fr-col-auto">
								<a
									aria-label="Télécharger la déclaration des indicateurs de représentation (PDF)"
									className="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-download-line"
									download
									href={pdfHref}
								>
									Télécharger
								</a>
								<p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
									<FileFormatDetail href={pdfHref} />
								</p>
							</div>
						</div>

						<section className={styles.section}>
							<h2 className="fr-h6 fr-mb-0">Informations</h2>
							<div className={styles.infoGroups}>
								<div>
									<h3 className="fr-text--md fr-text--bold fr-mb-1w">
										Déclarant
									</h3>
									<InfoList items={declarantItems} />
								</div>
								<div>
									<h3 className="fr-text--md fr-text--bold fr-mb-1w">
										Entreprise
									</h3>
									<InfoList items={companyItems} />
								</div>
								<div>
									<h3 className="fr-text--md fr-text--bold fr-mb-1w">Calcul</h3>
									<InfoList items={calcItems} />
								</div>
							</div>
						</section>

						<section className={styles.section}>
							<h2 className="fr-h6 fr-mb-0">Écarts de représentation</h2>
							<div className={styles.gapColumns}>
								{summary.indicators.map((indicator) => (
									<div className={styles.gapColumn} key={indicator.key}>
										<h3 className="fr-text--md fr-text--bold fr-mb-0">
											{indicator.title}
										</h3>
										{indicator.notComputableReason === null ? (
											<DsfrTable
												caption={`Écart de représentation — ${indicator.title}`}
											>
												<thead>
													<tr>
														<th scope="col">Femmes</th>
														<th scope="col">Hommes</th>
														<th scope="col">Conformité</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td>{formatPercentage(indicator.womenPercent)}</td>
														<td>{formatPercentage(indicator.menPercent)}</td>
														<td>
															<ComplianceBadge verdict={indicator.verdict} />
														</td>
													</tr>
												</tbody>
											</DsfrTable>
										) : (
											<>
												<p className="fr-mb-0">
													{indicator.notComputableReason}
												</p>
												<ComplianceBadge verdict={indicator.verdict} />
											</>
										)}
									</div>
								))}
							</div>
						</section>

						{summary.publicationApplicable ? (
							<section className={styles.section}>
								<h2 className="fr-h6 fr-mb-0">Publication</h2>
								<InfoList items={publicationInfoItems(draft)} />
							</section>
						) : null}

						<Link
							className={`fr-btn fr-btn--secondary ${styles.bottomAction}`}
							href={MY_SPACE}
						>
							Mon espace
						</Link>
					</div>
				</div>
			</main>
		</>
	);
}
