import { Text } from "@react-pdf/renderer";

import { computeGap, formatCurrency } from "~/modules/domain";

import { styles } from "../recapPdfStyles";
import { GapCell } from "./GapCell";
import { Cell, Row, Table } from "./tableParts";

export type PayGapTableRow = {
	label: string;
	women: string;
	men: string;
};

const LABEL_WIDTH = 141;
const VALUE_WIDTH = 132;
const GAP_WIDTH = 120;

export function PayGapTable({ rows }: { rows: PayGapTableRow[] }) {
	const allEmpty = rows.every((r) => r.women === "" && r.men === "");
	if (allEmpty) {
		return <Text style={styles.noData}>Aucune donnée renseignée.</Text>;
	}
	return (
		<Table>
			<Row>
				<Cell header width={LABEL_WIDTH} />
				<Cell header text={"Rémunération\ndes femmes"} width={VALUE_WIDTH} />
				<Cell header text={"Rémunération\ndes hommes"} width={VALUE_WIDTH} />
				<Cell
					header
					hint="Seuil réglementaire : 5%"
					text="Écart"
					width={GAP_WIDTH}
				/>
			</Row>
			{rows.map((row) => (
				<Row key={row.label}>
					<Cell bold text={row.label} width={LABEL_WIDTH} />
					<Cell
						align="right"
						text={formatCurrency(row.women)}
						width={VALUE_WIDTH}
					/>
					<Cell
						align="right"
						text={formatCurrency(row.men)}
						width={VALUE_WIDTH}
					/>
					<Cell width={GAP_WIDTH}>
						<GapCell gap={computeGap(row.women, row.men)} />
					</Cell>
				</Row>
			))}
		</Table>
	);
}
