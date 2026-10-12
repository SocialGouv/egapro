import { View } from "@react-pdf/renderer";
import type {
	PayGapReferences,
	Step3Data,
} from "~/modules/declaration-remuneration";
import { formatVariablePayProportion } from "~/modules/domain";
import { type PdfStyles, styles } from "../recapPdfStyles";
import type { GapCellVariant } from "./GapCell";
import { SectionBanner, SubTitle } from "./headings";
import { PayGapTable } from "./PayGapTable";
import { Cell, Row, Table } from "./tableParts";
import { BENEFICIARY_TABLE } from "./tableWidths";
import { formatHeadcount, formatHeadcountTotal } from "./WorkforceSection";

export type VariablePayData = {
	totalWomen: number | null;
	totalMen: number | null;
	step3Data: Step3Data;
	step3Gaps: PayGapReferences;
};

function ProportionTable({
	data,
	sheet,
}: {
	data: VariablePayData;
	sheet: PdfStyles;
}) {
	const tWomen = data.totalWomen;
	const tMen = data.totalMen;
	const grandTotal = formatHeadcountTotal(tWomen, tMen);
	const eWomen = Number.parseInt(data.step3Data.indicatorEWomen, 10);
	const eMen = Number.parseInt(data.step3Data.indicatorEMen, 10);
	return (
		<Table sheet={sheet}>
			<Row>
				<Cell header sheet={sheet} width={BENEFICIARY_TABLE.label} />
				<Cell
					header
					sheet={sheet}
					text={`Total de salariés : ${grandTotal}`}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					header
					sheet={sheet}
					text={"Bénéficiaires de composantes\nvariables ou complémentaires"}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					header
					sheet={sheet}
					text="Total"
					width={BENEFICIARY_TABLE.total}
				/>
			</Row>
			<Row>
				<Cell
					bold
					sheet={sheet}
					text="Femmes"
					width={BENEFICIARY_TABLE.label}
				/>
				<Cell
					align="right"
					bold
					sheet={sheet}
					text={formatHeadcount(tWomen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					sheet={sheet}
					text={Number.isNaN(eWomen) ? "-" : String(eWomen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					bold
					sheet={sheet}
					text={formatVariablePayProportion(eWomen, tWomen)}
					width={BENEFICIARY_TABLE.total}
				/>
			</Row>
			<Row>
				<Cell
					bold
					sheet={sheet}
					text="Hommes"
					width={BENEFICIARY_TABLE.label}
				/>
				<Cell
					align="right"
					bold
					sheet={sheet}
					text={formatHeadcount(tMen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					sheet={sheet}
					text={Number.isNaN(eMen) ? "-" : String(eMen)}
					width={BENEFICIARY_TABLE.wide}
				/>
				<Cell
					align="right"
					bold
					sheet={sheet}
					text={formatVariablePayProportion(eMen, tMen)}
					width={BENEFICIARY_TABLE.total}
				/>
			</Row>
		</Table>
	);
}

export function VariablePaySection({
	data,
	gapVariant,
	sheet = styles,
}: {
	data: VariablePayData;
	gapVariant?: GapCellVariant;
	sheet?: PdfStyles;
}) {
	const rows = [
		{
			label: "Annuelle brute moyenne",
			women: data.step3Data.indicatorBAnnualWomen,
			men: data.step3Data.indicatorBAnnualMen,
			reference: data.step3Gaps[0],
		},
		{
			label: "Horaire brute moyenne",
			women: data.step3Data.indicatorBHourlyWomen,
			men: data.step3Data.indicatorBHourlyMen,
			reference: data.step3Gaps[1],
		},
		{
			label: "Annuelle brute médiane",
			women: data.step3Data.indicatorDAnnualWomen,
			men: data.step3Data.indicatorDAnnualMen,
			reference: data.step3Gaps[2],
		},
		{
			label: "Horaire brute médiane",
			women: data.step3Data.indicatorDHourlyWomen,
			men: data.step3Data.indicatorDHourlyMen,
			reference: data.step3Gaps[3],
		},
	];
	return (
		<View>
			<View wrap={false}>
				<SectionBanner
					sheet={sheet}
					title="Écart de rémunération variable ou complémentaire"
				/>
				<SubTitle title="Rémunération variable ou complémentaire" />
				<PayGapTable gapVariant={gapVariant} rows={rows} sheet={sheet} />
			</View>
			<View wrap={false}>
				<SubTitle title="Proportion de femmes et d'hommes bénéficiaires" />
				<ProportionTable data={data} sheet={sheet} />
			</View>
		</View>
	);
}
