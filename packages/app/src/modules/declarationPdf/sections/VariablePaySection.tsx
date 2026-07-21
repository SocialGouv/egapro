import { View } from "@react-pdf/renderer";

import { computePercentage, computeWorkforceTotal } from "~/modules/domain";

import type { DeclarationPdfData } from "../types";
import { SectionBanner, SubTitle } from "./headings";
import { PayGapTable } from "./PayGapTable";
import { Cell, Row, Table } from "./tableParts";

const LABEL_WIDTH = 88;
const WIDE_WIDTH = 158.5;
const TOTAL_WIDTH = 120;

function ProportionTable({ data }: { data: DeclarationPdfData }) {
	const tWomen = data.totalWomen;
	const tMen = data.totalMen;
	const grandTotal = computeWorkforceTotal(tWomen, tMen);
	const eWomen = Number.parseInt(data.step3Data.indicatorEWomen, 10);
	const eMen = Number.parseInt(data.step3Data.indicatorEMen, 10);
	return (
		<Table>
			<Row>
				<Cell header width={LABEL_WIDTH} />
				<Cell
					header
					text={`Total de salariés : ${grandTotal}`}
					width={WIDE_WIDTH}
				/>
				<Cell
					header
					text={"Bénéficiaires de composantes\nvariables ou complémentaires"}
					width={WIDE_WIDTH}
				/>
				<Cell header text="Total" width={TOTAL_WIDTH} />
			</Row>
			<Row>
				<Cell bold text="Femmes" width={LABEL_WIDTH} />
				<Cell align="right" bold text={String(tWomen)} width={WIDE_WIDTH} />
				<Cell
					align="right"
					text={Number.isNaN(eWomen) ? "-" : String(eWomen)}
					width={WIDE_WIDTH}
				/>
				<Cell
					align="right"
					bold
					text={
						Number.isNaN(eWomen) ? "- %" : computePercentage(eWomen, tWomen)
					}
					width={TOTAL_WIDTH}
				/>
			</Row>
			<Row>
				<Cell bold text="Hommes" width={LABEL_WIDTH} />
				<Cell align="right" bold text={String(tMen)} width={WIDE_WIDTH} />
				<Cell
					align="right"
					text={Number.isNaN(eMen) ? "-" : String(eMen)}
					width={WIDE_WIDTH}
				/>
				<Cell
					align="right"
					bold
					text={Number.isNaN(eMen) ? "- %" : computePercentage(eMen, tMen)}
					width={TOTAL_WIDTH}
				/>
			</Row>
		</Table>
	);
}

export function VariablePaySection({ data }: { data: DeclarationPdfData }) {
	const rows = [
		{
			label: "Annuelle brute moyenne",
			women: data.step3Data.indicatorBAnnualWomen,
			men: data.step3Data.indicatorBAnnualMen,
		},
		{
			label: "Horaire brute moyenne",
			women: data.step3Data.indicatorBHourlyWomen,
			men: data.step3Data.indicatorBHourlyMen,
		},
		{
			label: "Annuelle brute médiane",
			women: data.step3Data.indicatorDAnnualWomen,
			men: data.step3Data.indicatorDAnnualMen,
		},
		{
			label: "Horaire brute médiane",
			women: data.step3Data.indicatorDHourlyWomen,
			men: data.step3Data.indicatorDHourlyMen,
		},
	];
	return (
		<View>
			<SectionBanner title="Écart de rémunération variable ou complémentaire" />
			<View wrap={false}>
				<SubTitle title="Rémunération variable ou complémentaire" />
				<PayGapTable rows={rows} />
			</View>
			<View wrap={false}>
				<SubTitle title="Proportion de femmes et d'hommes bénéficiaires" />
				<ProportionTable data={data} />
			</View>
		</View>
	);
}
