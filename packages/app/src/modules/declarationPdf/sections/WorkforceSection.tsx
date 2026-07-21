import { View } from "@react-pdf/renderer";

import { computeWorkforceTotal } from "~/modules/domain";

import type { DeclarationPdfData } from "../types";
import { SectionBanner } from "./headings";
import { Cell, Row, Table } from "./tableParts";

const LABEL_WIDTH = 141;
const VALUE_WIDTH = 132;
const TOTAL_WIDTH = 120;

export function WorkforceSection({ data }: { data: DeclarationPdfData }) {
	const total = computeWorkforceTotal(data.totalWomen, data.totalMen);
	return (
		<View wrap={false}>
			<SectionBanner title="Effectifs physiques pris en compte pour le calcul des indicateurs" />
			<Table>
				<Row>
					<Cell header width={LABEL_WIDTH} />
					<Cell header text="Nombre de femmes" width={VALUE_WIDTH} />
					<Cell header text="Nombre d'hommes" width={VALUE_WIDTH} />
					<Cell header text="Total" width={TOTAL_WIDTH} />
				</Row>
				<Row>
					<Cell bold text="Effectif physique" width={LABEL_WIDTH} />
					<Cell
						align="right"
						text={String(data.totalWomen)}
						width={VALUE_WIDTH}
					/>
					<Cell
						align="right"
						text={String(data.totalMen)}
						width={VALUE_WIDTH}
					/>
					<Cell align="right" bold text={String(total)} width={TOTAL_WIDTH} />
				</Row>
			</Table>
		</View>
	);
}
