import Link from "next/link";
import { DownloadDeclarationPdfButton } from "~/modules/declarationPdf";
import common from "../shared/common.module.scss";
import stepStyles from "../steps/Step6Review.module.scss";
import { CardTitle, IndicatorSections } from "../steps/step6";
import type {
	EmployeeCategoryRow,
	Step2Data,
	Step3Data,
	Step4Data,
} from "../types";
import styles from "./RecapitulatifPage.module.scss";

type CompanyInfo = {
	name: string;
	siren: string;
	nafCode: string | null;
	address: string | null;
};

type Props = {
	company: CompanyInfo;
	declarationYear: number;
	declarantEmail: string;
	isCorrection: boolean;
	totalWomen: number | null;
	totalMen: number | null;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories: EmployeeCategoryRow[];
};

type InfoItem = { label: string; value: string };

function InfoSection({ title, items }: { title: string; items: InfoItem[] }) {
	return (
		<section>
			<h2 className="fr-h6 fr-mb-2w">{title}</h2>
			<dl className={styles.infoList}>
				{items.map((item) => (
					<div className={styles.infoRow} key={item.label}>
						<dt className={styles.infoLabel}>{item.label}</dt>
						<dd className={styles.infoValue}>{item.value}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

export function RecapitulatifPage({
	company,
	declarationYear,
	declarantEmail,
	isCorrection,
	totalWomen,
	totalMen,
	step2Data,
	step3Data,
	step4Data,
	step5Categories,
}: Props) {
	// Reference period is implicit in this app: every declaration spans the
	// full calendar year of `declarationYear` — the in-flow forms hardcode
	// the same boundaries and `declarations` does not store custom windows.
	const periodStart = `01/01/${declarationYear}`;
	const periodEnd = `31/12/${declarationYear}`;

	const totalWorkforce = (totalWomen ?? 0) + (totalMen ?? 0);

	const companyItems: InfoItem[] = [
		{ label: "Raison sociale", value: company.name },
		{ label: "SIREN", value: company.siren },
	];
	if (company.nafCode) {
		companyItems.push({ label: "Code NAF", value: company.nafCode });
	}
	if (company.address) {
		companyItems.push({ label: "Adresse", value: company.address });
	}

	return (
		<div className={common.flexColumnGap2}>
			{/* Back link (between breadcrumb and title) */}
			<Link
				className={`fr-link fr-icon-arrow-left-line fr-link--icon-left ${styles.backLink}`}
				href="/mon-espace"
			>
				Retour
			</Link>

			{/* Title row */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">
					<h1 className="fr-h2 fr-mb-0">
						Déclaration des indicateurs de rémunération {declarationYear}
					</h1>
				</div>
				<div className="fr-col-auto">
					<DownloadDeclarationPdfButton
						correction={isCorrection}
						variant="tertiary"
						year={declarationYear}
					/>
				</div>
			</div>

			<InfoSection
				items={[{ label: "Mail déclarant", value: declarantEmail }]}
				title="Informations déclarant"
			/>

			<InfoSection items={companyItems} title="Informations entreprise" />

			<InfoSection
				items={[
					{ label: "Date de début", value: periodStart },
					{ label: "Date de fin", value: periodEnd },
				]}
				title="Informations période de référence"
			/>

			{/* Workforce card (recap-only — Step6Review doesn't render this) */}
			<div className={stepStyles.section}>
				<div className={stepStyles.card}>
					<CardTitle>Effectif</CardTitle>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Effectif</caption>
							<thead>
								<tr>
									<th scope="col">Femmes</th>
									<th scope="col">Hommes</th>
									<th scope="col">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{totalWomen ?? 0}</td>
									<td>{totalMen ?? 0}</td>
									<td>
										<strong>{totalWorkforce}</strong>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<IndicatorSections
				step2Data={step2Data}
				step3Data={step3Data}
				step4Data={step4Data}
				step5Categories={step5Categories}
			/>

			{/* Primary action — return to Mon Espace */}
			<Link
				className={`fr-btn fr-btn--primary ${styles.primaryAction}`}
				href="/mon-espace"
			>
				Retour à Mon Espace
			</Link>
		</div>
	);
}
