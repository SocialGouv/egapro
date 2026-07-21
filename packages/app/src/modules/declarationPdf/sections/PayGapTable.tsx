import { Text } from "@react-pdf/renderer";
import { computeGap, formatCurrency } from "~/modules/domain";
import { styles } from "../recapPdfStyles";
import { GapCell } from "./GapCell";
import { Cell, Row, Table } from "./tableParts";
import { PAY_TABLE } from "./tableWidths";

type PayGapTableRow = {
	label: string;
	women: string;
	men: string;
};

function PayGapDataRow({ row }: { row: PayGapTableRow }) {
	return (
		<Row>
			<Cell bold text={row.label} width={PAY_TABLE.label} />
			<Cell
				align="right"
				text={formatCurrency(row.women)}
				width={PAY_TABLE.value}
			/>
			<Cell
				align="right"
				text={formatCurrency(row.men)}
				width={PAY_TABLE.value}
			/>
			<Cell width={PAY_TABLE.gap}>
				<GapCell gap={computeGap(row.women, row.men)} />
			</Cell>
		</Row>
	);
}

export function PayGapTable({ rows }: { rows: PayGapTableRow[] }) {
	const allEmpty = rows.every((r) => r.women === "" && r.men === "");
	if (allEmpty) {
		return <Text style={styles.noData}>Aucune donnée renseignée.</Text>;
	}
	return (
		<Table>
			<Row>
				<Cell header width={PAY_TABLE.label} />
				<Cell
					header
					text={"Rémunération\ndes femmes"}
					width={PAY_TABLE.value}
				/>
				<Cell
					header
					text={"Rémunération\ndes hommes"}
					width={PAY_TABLE.value}
				/>
				<Cell
					header
					hint="Seuil réglementaire : 5%"
					text="Écart"
					width={PAY_TABLE.gap}
				/>
			</Row>
			{rows.map((row) => (
				<PayGapDataRow key={row.label} row={row} />
			))}
		</Table>
	);
}
