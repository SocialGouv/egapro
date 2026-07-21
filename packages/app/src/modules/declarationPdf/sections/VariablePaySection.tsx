import { View } from "@react-pdf/renderer";
import { computePercentage, computeWorkforceTotal } from "~/modules/domain";
import type { DeclarationPdfData } from "../types";
import { SectionBanner, SubTitle } from "./headings";
import { PayGapTable } from "./PayGapTable";
import { Cell, Row, Table } from "./tableParts";
import { BENEFICIARY_TABLE } from "./tableWidths";

function ProportionTable({ data }: { data: DeclarationPdfData }) {
	const tWomen = data.totalWomen;
	const tMen = data.totalMen;
	const grandTotal = computeWorkforceTotal(tWomen, tMen);
	const eWomen = Number.parseInt(data.step3Data.indicatorEWomen, 10);
	const eMen = Number.parseInt(data.step3Data.indicatorEMen, 10);
	return (
		<Table>
			<Row>
				<Cell header width={BENEFICIARY_TABLE.label} />
				<Cell
					header
					text={`Total de salariés : ${grandTotal}`}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					header
					text={"Bénéficiaires de composantes\nvariables ou complémentaires"}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell header text="Total" width={BENEFICIARY_TABLE.total} />
			</Row>
			<Row>
				<Cell bold text="Femmes" width={BENEFICIARY_TABLE.label} />
				<Cell
					align="right"
					bold
					text={String(tWomen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					text={Number.isNaN(eWomen) ? "-" : String(eWomen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					bold
					text={
						Number.isNaN(eWomen) ? "- %" : computePercentage(eWomen, tWomen)
					}
					width={BENEFICIARY_TABLE.total}
				/>
			</Row>
			<Row>
				<Cell bold text="Hommes" width={BENEFICIARY_TABLE.label} />
				<Cell
					align="right"
					bold
					text={String(tMen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					text={Number.isNaN(eMen) ? "-" : String(eMen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					bold
					text={Number.isNaN(eMen) ? "- %" : computePercentage(eMen, tMen)}
					width={BENEFICIARY_TABLE.total}
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
			<View wrap={false}>
				<SectionBanner title="Écart de rémunération variable ou complémentaire" />
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
