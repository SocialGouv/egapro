import { Document, Page, Text, View } from "@react-pdf/renderer";

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
	fields: Array<[string, string]>; // [label, key]
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
			["Écart annuel moyen", "globalAnnualMeanGap"],
			["Rémunération annuelle moyenne — femmes", "globalAnnualMeanWomen"],
			["Rémunération annuelle moyenne — hommes", "globalAnnualMeanMen"],
			["Écart horaire moyen", "globalHourlyMeanGap"],
		],
	},
	{
		title: "Indicateur B — Écart de rémunération variable moyen",
		fields: [
			["Écart annuel moyen", "variableAnnualMeanGap"],
			["Rémunération annuelle moyenne — femmes", "variableAnnualMeanWomen"],
			["Rémunération annuelle moyenne — hommes", "variableAnnualMeanMen"],
		],
	},
	{
		title: "Indicateur C — Écart de rémunération médian global",
		fields: [
			["Écart annuel médian", "globalAnnualMedianGap"],
			["Rémunération annuelle médiane — femmes", "globalAnnualMedianWomen"],
			["Rémunération annuelle médiane — hommes", "globalAnnualMedianMen"],
		],
	},
	{
		title: "Indicateur D — Écart de rémunération variable médian",
		fields: [
			["Écart annuel médian", "variableAnnualMedianGap"],
			["Rémunération annuelle médiane — femmes", "variableAnnualMedianWomen"],
			["Rémunération annuelle médiane — hommes", "variableAnnualMedianMen"],
		],
	},
	{
		title: "Indicateur E — Proportion de rémunération variable",
		fields: [
			["Proportion — femmes", "variableProportionWomen"],
			["Proportion — hommes", "variableProportionMen"],
		],
	},
	{
		title: "Indicateur F — Distribution par quartile (annuel)",
		fields: [
			["Seuil Q1", "annualQuartileThreshold1"],
			["Seuil Q2", "annualQuartileThreshold2"],
			["Seuil Q3", "annualQuartileThreshold3"],
			["Seuil Q4", "annualQuartileThreshold4"],
			["Q1 — femmes", "annualQuartile1ProportionWomen"],
			["Q1 — hommes", "annualQuartile1ProportionMen"],
			["Q2 — femmes", "annualQuartile2ProportionWomen"],
			["Q2 — hommes", "annualQuartile2ProportionMen"],
			["Q3 — femmes", "annualQuartile3ProportionWomen"],
			["Q3 — hommes", "annualQuartile3ProportionMen"],
			["Q4 — femmes", "annualQuartile4ProportionWomen"],
			["Q4 — hommes", "annualQuartile4ProportionMen"],
		],
	},
	{
		title: "Indice de confiance",
		fields: [["Indice de confiance global", "confidenceIndex"]],
	},
];

function formatValue(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === "") return "—";
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
						Au titre des données {data.year - 1}
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
						{section.fields.map(([label, key], index) => {
							const isLast = index === section.fields.length - 1;
							return (
								<View
									key={key}
									style={isLast ? styles.tableRowLast : styles.tableRow}
								>
									<Text style={styles.tableCellLabel}>{label}</Text>
									<Text style={styles.tableCellValue}>
										{formatValue(data.row[key])}
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
