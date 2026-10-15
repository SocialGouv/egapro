import { View } from "@react-pdf/renderer";
import { computeWorkforceTotal } from "~/modules/domain";
import { type PdfStyles, styles } from "../recapPdfStyles";
import { SectionBanner } from "./headings";
import { Cell, Row, Table } from "./tableParts";
import { PAY_TABLE } from "./tableWidths";

export type WorkforceCounts = {
	totalWomen: number | null;
	totalMen: number | null;
	hourlyWomen: number | null;
	hourlyMen: number | null;
};

export function formatHeadcount(value: number | null): string {
	return value === null ? "-" : String(value);
}

export function formatHeadcountTotal(
	women: number | null,
	men: number | null,
): string {
	if (women === null || men === null) return "-";
	return String(computeWorkforceTotal(women, men));
}

export function WorkforceSection({
	data,
	sheet = styles,
}: {
	data: WorkforceCounts;
	sheet?: PdfStyles;
}) {
	const rows = [
		{
			label: "Rémunération annuelle",
			women: data.totalWomen,
			men: data.totalMen,
		},
		{
			label: "Rémunération horaire",
			women: data.hourlyWomen,
			men: data.hourlyMen,
		},
	];

	return (
		<View wrap={false}>
			<SectionBanner
				sheet={sheet}
				title="Effectifs physiques pris en compte pour le calcul des indicateurs"
			/>
			<Table sheet={sheet}>
				<Row>
					<Cell
						header
						sheet={sheet}
						text="Nombre de salariés"
						width={PAY_TABLE.label}
					/>
					<Cell header sheet={sheet} text="Femmes" width={PAY_TABLE.value} />
					<Cell header sheet={sheet} text="Hommes" width={PAY_TABLE.value} />
					<Cell header sheet={sheet} text="Total" width={PAY_TABLE.total} />
				</Row>
				{rows.map((row) => (
					<Row key={row.label}>
						<Cell bold sheet={sheet} text={row.label} width={PAY_TABLE.label} />
						<Cell
							align="right"
							sheet={sheet}
							text={formatHeadcount(row.women)}
							width={PAY_TABLE.value}
						/>
						<Cell
							align="right"
							sheet={sheet}
							text={formatHeadcount(row.men)}
							width={PAY_TABLE.value}
						/>
						<Cell
							align="right"
							bold
							sheet={sheet}
							text={formatHeadcountTotal(row.women, row.men)}
							width={PAY_TABLE.total}
						/>
					</Row>
				))}
			</Table>
		</View>
	);
}
