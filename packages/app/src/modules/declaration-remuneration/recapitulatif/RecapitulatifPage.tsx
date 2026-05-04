import Link from "next/link";
import { DownloadDeclarationPdfButton } from "~/modules/declarationPdf";
import { ResourceBanner } from "~/modules/layout";
import common from "../shared/common.module.scss";
import stepStyles from "../steps/Step6Review.module.scss";
import { CardTitle, IndicatorSections } from "../steps/step6";
import type {
	EmployeeCategoryRow,
	Step2Data,
	Step3Data,
	Step4Data,
} from "../types";

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
	const periodStart = `01/01/${declarationYear}`;
	const periodEnd = `31/12/${declarationYear}`;

	const totalWorkforce = (totalWomen ?? 0) + (totalMen ?? 0);

	return (
		<>
			<div className={common.flexColumnGap2}>
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

				{/* Section: Declarant info */}
				<section>
					<h2 className="fr-h6 fr-mb-2w">Informations déclarant</h2>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Informations déclarant</caption>
							<tbody>
								<tr>
									<th scope="row">Mail déclarant</th>
									<td>{declarantEmail}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				{/* Section: Company info */}
				<section>
					<h2 className="fr-h6 fr-mb-2w">Informations entreprise</h2>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Informations entreprise</caption>
							<tbody>
								<tr>
									<th scope="row">Raison sociale</th>
									<td>{company.name}</td>
								</tr>
								<tr>
									<th scope="row">SIREN</th>
									<td>{company.siren}</td>
								</tr>
								{company.nafCode && (
									<tr>
										<th scope="row">Code NAF</th>
										<td>{company.nafCode}</td>
									</tr>
								)}
								{company.address && (
									<tr>
										<th scope="row">Adresse</th>
										<td>{company.address}</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>

				{/* Section: Reference period */}
				<section>
					<h2 className="fr-h6 fr-mb-2w">Informations période de référence</h2>
					<div className="fr-table fr-table--no-caption">
						<table>
							<caption>Informations période de référence</caption>
							<tbody>
								<tr>
									<th scope="row">Date de début</th>
									<td>{periodStart}</td>
								</tr>
								<tr>
									<th scope="row">Date de fin</th>
									<td>{periodEnd}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

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

				{/* Return button */}
				<Link className="fr-btn fr-btn--primary" href="/mon-espace">
					Retour à Mon Espace
				</Link>
			</div>

			{/* ResourceBanner outside the narrow column (rendered after the container content) */}
			<ResourceBanner />
		</>
	);
}
