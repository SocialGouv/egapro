import { View } from "@react-pdf/renderer";
import { computeWorkforceTotal } from "~/modules/domain";
import type { DeclarationPdfData } from "../types";
import { SectionBanner } from "./headings";
import { Cell, Row, Table } from "./tableParts";
import { PAY_TABLE } from "./tableWidths";

export function WorkforceSection({ data }: { data: DeclarationPdfData }) {
	const total = computeWorkforceTotal(data.totalWomen, data.totalMen);
	return (
		<View wrap={false}>
			<SectionBanner title="Effectifs physiques pris en compte pour le calcul des indicateurs" />
			<Table>
				<Row>
					<Cell header width={PAY_TABLE.label} />
					<Cell header text="Nombre de femmes" width={PAY_TABLE.value} />
					<Cell header text="Nombre d'hommes" width={PAY_TABLE.value} />
					<Cell header text="Total" width={PAY_TABLE.total} />
				</Row>
				<Row>
					<Cell bold text="Effectif physique" width={PAY_TABLE.label} />
					<Cell
						align="right"
						text={String(data.totalWomen)}
						width={PAY_TABLE.value}
					/>
					<Cell
						align="right"
						text={String(data.totalMen)}
						width={PAY_TABLE.value}
					/>
					<Cell
						align="right"
						bold
						text={String(total)}
						width={PAY_TABLE.total}
					/>
				</Row>
			</Table>
		</View>
	);
}
