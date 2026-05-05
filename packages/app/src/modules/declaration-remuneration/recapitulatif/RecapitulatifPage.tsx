import Link from "next/link";
import common from "../shared/common.module.scss";
import type {
	EmployeeCategoryRow,
	Step2Data,
	Step3Data,
	Step4Data,
} from "../types";
import { CategoryRecapTable } from "./CategoryRecapTable";
import { EmptyNotice, IndicatorTables } from "./IndicatorTables";
import styles from "./RecapitulatifPage.module.scss";

const SOURCE_LABELS: Record<string, string> = {
	"convention-collective": "Convention collective",
	"accord-entreprise": "Accord d'entreprise",
	"accord-groupe": "Accord de groupe",
	"accord-branche": "Accord de branche",
	"decision-unilaterale": "Décision unilatérale",
	"classification-interne": "Classification interne",
	autre: "Autre",
};

type CompanyInfo = {
	name: string;
	siren: string;
	nafCode: string | null;
	address: string | null;
	workforce: number | null;
};

type Props = {
	company: CompanyInfo;
	declarationYear: number;
	referencePeriod: string;
	declarantName: string;
	declarantEmail: string;
	isCorrection: boolean;
	totalWomen: number | null;
	totalMen: number | null;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories: EmployeeCategoryRow[];
	step5Source: string | null;
};

type InfoItem = { label: string; value: string };

function InfoSection({ title, items }: { title: string; items: InfoItem[] }) {
	if (items.length === 0) return null;
	return (
		<section className={styles.infoSection}>
			<h2 className={styles.infoTitle}>{title}</h2>
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

function buildPdfHref(year: number, isCorrection: boolean) {
	const params = new URLSearchParams();
	params.set("year", String(year));
	if (isCorrection) params.set("type", "correction");
	return `/api/declaration-pdf?${params.toString()}`;
}

export function RecapitulatifPage({
	company,
	declarationYear,
	referencePeriod,
	declarantName,
	declarantEmail,
	isCorrection,
	totalWomen,
	totalMen,
	step2Data,
	step3Data,
	step4Data,
	step5Categories,
	step5Source,
}: Props) {
	const declarantItems: InfoItem[] = [];
	if (declarantName) {
		declarantItems.push({ label: "Nom Prénom", value: declarantName });
	}
	declarantItems.push({ label: "Adresse email", value: declarantEmail });

	const companyItems: InfoItem[] = [
		{ label: "Raison sociale", value: company.name },
		{ label: "SIREN", value: company.siren },
	];
	if (company.address) {
		companyItems.push({ label: "Adresse", value: company.address });
	}
	if (company.nafCode) {
		companyItems.push({ label: "Code NAF", value: company.nafCode });
	}
	if (company.workforce !== null) {
		companyItems.push({
			label: `Effectif annuel moyen en ${declarationYear}`,
			value: String(company.workforce),
		});
	}

	const sourceLabel = step5Source
		? (SOURCE_LABELS[step5Source] ?? step5Source)
		: null;

	const indexedCategories = step5Categories.map((cat, i) => ({
		...cat,
		position: i,
	}));

	return (
		<div className={common.flexColumnGap2}>
			{/* Title row — Marianne Bold 24/32 per Figma (DSFR fr-h4) */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {declarationYear}
					</h1>
				</div>
				<div className="fr-col-auto">
					<a
						className="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-download-line"
						download
						href={buildPdfHref(declarationYear, isCorrection)}
					>
						Télécharger
					</a>
				</div>
			</div>

			<InfoSection items={declarantItems} title="Informations déclarant" />

			<InfoSection items={companyItems} title="Informations entreprise" />

			<InfoSection
				items={[{ label: "Période de référence", value: referencePeriod }]}
				title="Informations calcul"
			/>

			{/* Indicators for all employees */}
			<section>
				<h2 className={`fr-h6 fr-mb-3w ${styles.sectionHeading}`}>
					Indicateurs pour l&apos;ensemble de vos salariés
				</h2>
				<div className={styles.indicatorsSection}>
					<IndicatorTables
						declarationYear={declarationYear}
						step2Data={step2Data}
						step3Data={step3Data}
						step4Data={step4Data}
						totalMen={totalMen}
						totalWomen={totalWomen}
					/>
				</div>
			</section>

			{/* Indicators by employee category */}
			<section>
				<h2 className={`fr-h6 fr-mb-3w ${styles.sectionHeading}`}>
					Indicateurs par catégorie de salariés
				</h2>
				{sourceLabel && (
					<p className={`fr-mb-3w ${styles.sourceLine}`}>
						<span className={styles.sourceLabel}>
							Source utilisée pour déterminer les catégories d&apos;emplois :
						</span>{" "}
						<strong>{sourceLabel}</strong>
					</p>
				)}
				<div className={styles.indicatorsSection}>
					{indexedCategories.length > 0 ? (
						indexedCategories.map((cat) => (
							<CategoryRecapTable
								category={cat}
								declarationYear={declarationYear}
								index={cat.position}
								key={cat.position}
							/>
						))
					) : (
						<EmptyNotice />
					)}
				</div>
			</section>

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
