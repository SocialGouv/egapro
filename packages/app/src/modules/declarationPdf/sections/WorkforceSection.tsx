import { View } from "@react-pdf/renderer";
import { computeWorkforceTotal } from "~/modules/domain";
import type { DeclarationPdfData } from "../types";
import { SectionBanner } from "./headings";
import { Cell, Row, Table } from "./tableParts";
import { PAY_TABLE } from "./tableWidths";

export function WorkforceSection({ data }: { data: DeclarationPdfData }) {
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
			<SectionBanner title="Effectifs physiques pris en compte pour le calcul des indicateurs" />
			<Table>
				<Row>
					<Cell header text="Nombre de salariés" width={PAY_TABLE.label} />
					<Cell header text="Femmes" width={PAY_TABLE.value} />
					<Cell header text="Hommes" width={PAY_TABLE.value} />
					<Cell header text="Total" width={PAY_TABLE.total} />
				</Row>
				{rows.map((row) => (
					<Row key={row.label}>
						<Cell bold text={row.label} width={PAY_TABLE.label} />
						<Cell
							align="right"
							text={String(row.women)}
							width={PAY_TABLE.value}
						/>
						<Cell
							align="right"
							text={String(row.men)}
							width={PAY_TABLE.value}
						/>
						<Cell
							align="right"
							bold
							text={String(computeWorkforceTotal(row.women, row.men))}
							width={PAY_TABLE.total}
						/>
					</Row>
				))}
			</Table>
		</View>
	);
}
