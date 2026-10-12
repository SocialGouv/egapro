import { Text } from "@react-pdf/renderer";
import type {
	PayGapReferences,
	Step2Data,
} from "~/modules/declaration-remuneration";
import type { GipGapReference } from "~/modules/domain";
import { formatCurrency, resolveGap } from "~/modules/domain";
import { type PdfStyles, styles } from "../recapPdfStyles";
import { GapCell, type GapCellVariant } from "./GapCell";
import { Cell, Row, Table } from "./tableParts";
import { PAY_TABLE } from "./tableWidths";

type PayGapTableRow = {
	label: string;
	women: string;
	men: string;
	/** Gap as persisted on the declaration, shown instead of recomputing it. */
	reference?: GipGapReference;
};

export function step2PayGapRows({
	step2Data,
	step2Gaps,
}: {
	step2Data: Step2Data;
	step2Gaps: PayGapReferences;
}): PayGapTableRow[] {
	return [
		{
			label: "Annuelle brute moyenne",
			women: step2Data.indicatorAAnnualWomen,
			men: step2Data.indicatorAAnnualMen,
			reference: step2Gaps[0],
		},
		{
			label: "Horaire brute moyenne",
			women: step2Data.indicatorAHourlyWomen,
			men: step2Data.indicatorAHourlyMen,
			reference: step2Gaps[1],
		},
		{
			label: "Annuelle brute médiane",
			women: step2Data.indicatorCAnnualWomen,
			men: step2Data.indicatorCAnnualMen,
			reference: step2Gaps[2],
		},
		{
			label: "Horaire brute médiane",
			women: step2Data.indicatorCHourlyWomen,
			men: step2Data.indicatorCHourlyMen,
			reference: step2Gaps[3],
		},
	];
}

function PayGapDataRow({
	row,
	gapVariant,
	sheet,
}: {
	row: PayGapTableRow;
	gapVariant?: GapCellVariant;
	sheet: PdfStyles;
}) {
	return (
		<Row>
			<Cell bold sheet={sheet} text={row.label} width={PAY_TABLE.label} />
			<Cell
				align="right"
				sheet={sheet}
				text={formatCurrency(row.women)}
				width={PAY_TABLE.value}
			/>
			<Cell
				align="right"
				sheet={sheet}
				text={formatCurrency(row.men)}
				width={PAY_TABLE.value}
			/>
			<Cell sheet={sheet} width={PAY_TABLE.gap}>
				<GapCell
					gap={resolveGap(row.women, row.men, row.reference)}
					sheet={sheet}
					variant={gapVariant}
				/>
			</Cell>
		</Row>
	);
}

export function PayGapTable({
	rows,
	gapVariant,
	sheet = styles,
}: {
	rows: PayGapTableRow[];
	gapVariant?: GapCellVariant;
	sheet?: PdfStyles;
}) {
	const allEmpty = rows.every((r) => r.women === "" && r.men === "");
	if (allEmpty) {
		return <Text style={sheet.noData}>Aucune donnée renseignée.</Text>;
	}
	return (
		<Table sheet={sheet}>
			<Row>
				<Cell header sheet={sheet} width={PAY_TABLE.label} />
				<Cell
					header
					sheet={sheet}
					text={"Rémunération\ndes femmes"}
					width={PAY_TABLE.value}
				/>
				<Cell
					header
					sheet={sheet}
					text={"Rémunération\ndes hommes"}
					width={PAY_TABLE.value}
				/>
				<Cell
					header
					hint="Seuil réglementaire : 5%"
					sheet={sheet}
					text="Écart"
					width={PAY_TABLE.gap}
				/>
			</Row>
			{rows.map((row) => (
				<PayGapDataRow
					gapVariant={gapVariant}
					key={row.label}
					row={row}
					sheet={sheet}
				/>
			))}
		</Table>
	);
}
