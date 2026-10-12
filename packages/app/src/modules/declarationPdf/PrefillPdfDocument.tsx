import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
	formatRatioAsPercentage,
	formatWorkforceForUser,
	getReferenceYearFor,
	parseGipWorkforce,
} from "~/modules/domain";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./pdfStyles";

export type PrefillPdfData = {
	siren: string;
	companyName: string;
	year: number;
	periodStart: string | null;
	periodEnd: string | null;
	row: Record<string, string | number | null>;
};

type Section = {
	title: string;
	fields: Array<[label: string, key: string, kind?: "ratio"]>;
};

const SECTIONS: Section[] = [
	{
		title: "Effectifs",
		fields: [
			["Effectif EMA", "workforceEma"],
			["Femmes — annuel global", "womenCountAnnualGlobal"],
			["Hommes — annuel global", "menCountAnnualGlobal"],
			["Femmes — horaire global", "womenCountHourlyGlobal"],
			["Hommes — horaire global", "menCountHourlyGlobal"],
		],
	},
	{
		title: "Indicateur A — Écart de rémunération moyen global",
		fields: [
			["Écart annuel moyen", "globalAnnualMeanGap", "ratio"],
			["Rémunération annuelle moyenne — femmes", "globalAnnualMeanWomen"],
			["Rémunération annuelle moyenne — hommes", "globalAnnualMeanMen"],
			["Écart horaire moyen", "globalHourlyMeanGap", "ratio"],
		],
	},
	{
		title: "Indicateur B — Écart de rémunération variable moyen",
		fields: [
			["Écart annuel moyen", "variableAnnualMeanGap", "ratio"],
			["Rémunération annuelle moyenne — femmes", "variableAnnualMeanWomen"],
			["Rémunération annuelle moyenne — hommes", "variableAnnualMeanMen"],
		],
	},
	{
		title: "Indicateur C — Écart de rémunération médian global",
		fields: [
			["Écart annuel médian", "globalAnnualMedianGap", "ratio"],
			["Rémunération annuelle médiane — femmes", "globalAnnualMedianWomen"],
			["Rémunération annuelle médiane — hommes", "globalAnnualMedianMen"],
		],
	},
	{
		title: "Indicateur D — Écart de rémunération variable médian",
		fields: [
			["Écart annuel médian", "variableAnnualMedianGap", "ratio"],
			["Rémunération annuelle médiane — femmes", "variableAnnualMedianWomen"],
			["Rémunération annuelle médiane — hommes", "variableAnnualMedianMen"],
		],
	},
	{
		title: "Indicateur E — Proportion de rémunération variable",
		fields: [
			["Proportion — femmes", "variableProportionWomen", "ratio"],
			["Proportion — hommes", "variableProportionMen", "ratio"],
		],
	},
	{
		title: "Indicateur F — Distribution par quartile (annuel)",
		fields: [
			["Seuil Q1", "annualQuartileThreshold1"],
			["Seuil Q2", "annualQuartileThreshold2"],
			["Seuil Q3", "annualQuartileThreshold3"],
			["Q1 — femmes", "annualQuartile1ProportionWomen", "ratio"],
			["Q1 — hommes", "annualQuartile1ProportionMen", "ratio"],
			["Q2 — femmes", "annualQuartile2ProportionWomen", "ratio"],
			["Q2 — hommes", "annualQuartile2ProportionMen", "ratio"],
			["Q3 — femmes", "annualQuartile3ProportionWomen", "ratio"],
			["Q3 — hommes", "annualQuartile3ProportionMen", "ratio"],
			["Q4 — femmes", "annualQuartile4ProportionWomen", "ratio"],
			["Q4 — hommes", "annualQuartile4ProportionMen", "ratio"],
		],
	},
	{
		title: "Indice de confiance",
		fields: [["Indice de confiance global", "confidenceIndex"]],
	},
];

// The headcount follows the same rule as every other surface: a company of the
// voluntary tier is shown its bracket, not its exact figure (issue 3914).
const WORKFORCE_FIELD = "workforceEma";

function formatValue(
	key: string,
	value: string | number | null | undefined,
	kind: "ratio" | undefined,
): string {
	// Ahead of the empty-value guard on purpose: the column is nullable and the
	// route only 404s on a missing GIP row, so a present row with no headcount
	// reaches here — and an unknown headcount is the voluntary tier, "< 50",
	// exactly as on the five other surfaces. Falling through to "—" would make
	// this PDF the lone dissenter.
	if (key === WORKFORCE_FIELD) {
		return formatWorkforceForUser(parseGipWorkforce(value));
	}
	if (value === null || value === undefined || value === "") return "—";
	if (kind === "ratio") return formatRatioAsPercentage(Number(value));
	return String(value);
}

type Props = {
	data: PrefillPdfData;
};

export function PrefillPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.title}>
						Données préremplies {data.year} (issues des données DSN)
					</Text>
					<Text style={styles.subtitle}>
						Au titre des données {getReferenceYearFor(data.year)}
					</Text>
					<Text style={styles.companyInfo}>
						{data.companyName} — SIREN {data.siren}
					</Text>
					{data.periodStart && data.periodEnd && (
						<Text style={styles.companyInfo}>
							Période : {data.periodStart} → {data.periodEnd}
						</Text>
					)}
				</View>

				{SECTIONS.map((section) => (
					<View key={section.title} style={styles.card}>
						<Text style={styles.cardTitle}>{section.title}</Text>
						{section.fields.map(([label, key, kind], index) => {
							const isLast = index === section.fields.length - 1;
							return (
								<View
									key={key}
									style={isLast ? styles.tableRowLast : styles.tableRow}
								>
									<Text style={styles.tableCellLabel}>{label}</Text>
									<Text style={styles.tableCellValue}>
										{formatValue(key, data.row[key], kind)}
									</Text>
								</View>
							);
						})}
					</View>
				))}
			</Page>
		</Document>
	);
}
