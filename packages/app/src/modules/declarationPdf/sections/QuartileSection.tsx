import { View } from "@react-pdf/renderer";
import type { Step4Data } from "~/modules/declaration-remuneration";
import {
	computePercentage,
	computeWorkforceTotal,
	formatCurrency,
	sumQuartileWorkforce,
} from "~/modules/domain";
import type { DeclarationPdfData } from "../types";
import { SectionBanner, SubTitle } from "./headings";
import { Cell, Row, Table } from "./tableParts";
import { QUARTILE_TABLE } from "./tableWidths";

const QUARTILE_LABELS = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
];

function formatTranche(value: string | undefined): string {
	if (!value) return "- €";
	return formatCurrency(value);
}

function QuartileRow({
	quartile,
	previousThreshold,
	label,
}: {
	quartile: Step4Data["annual"][number];
	previousThreshold: string | undefined;
	label: string | undefined;
}) {
	const lineTotal = computeWorkforceTotal(
		quartile.women ?? 0,
		quartile.men ?? 0,
	);
	return (
		<Row>
			<Cell bold text={label} width={QUARTILE_TABLE.label} />
			<Cell
				align="right"
				text={formatTranche(previousThreshold)}
				width={QUARTILE_TABLE.tranche}
			/>
			<Cell
				align="right"
				text={formatTranche(quartile.threshold)}
				width={QUARTILE_TABLE.tranche}
			/>
			<Cell
				align="right"
				text={quartile.women !== undefined ? String(quartile.women) : "-"}
				width={QUARTILE_TABLE.num}
			/>
			<Cell
				align="right"
				text={quartile.men !== undefined ? String(quartile.men) : "-"}
				width={QUARTILE_TABLE.num}
			/>
			<Cell
				align="right"
				bold
				text={
					lineTotal > 0
						? computePercentage(quartile.women ?? 0, lineTotal)
						: "- %"
				}
				width={QUARTILE_TABLE.num}
			/>
			<Cell
				align="right"
				bold
				text={
					lineTotal > 0
						? computePercentage(quartile.men ?? 0, lineTotal)
						: "- %"
				}
				width={QUARTILE_TABLE.num}
			/>
		</Row>
	);
}

function QuartileTable({
	quartiles,
	trancheLabel,
}: {
	quartiles: Step4Data["annual"];
	trancheLabel: string;
}) {
	const totals = sumQuartileWorkforce(quartiles);
	return (
		<Table>
			<Row>
				<Cell header width={QUARTILE_TABLE.label} />
				<Cell
					header
					text={`Montants des tranches de rémunération ${trancheLabel}`}
					width={QUARTILE_TABLE.tranche * 2}
				/>
				<Cell header text={"Nombre\nde femmes"} width={QUARTILE_TABLE.num} />
				<Cell header text={"Nombre\nd'hommes"} width={QUARTILE_TABLE.num} />
				<Cell
					header
					text={"Pourcentage\nde femmes"}
					width={QUARTILE_TABLE.num}
				/>
				<Cell
					header
					text={"Pourcentage\nd'hommes"}
					width={QUARTILE_TABLE.num}
				/>
			</Row>
			{quartiles.map((q, i) => (
				<QuartileRow
					key={QUARTILE_LABELS[i]}
					label={QUARTILE_LABELS[i]}
					previousThreshold={quartiles[i - 1]?.threshold}
					quartile={q}
				/>
			))}
			<Row>
				<Cell bold text="Tous les salariés" width={QUARTILE_TABLE.span} />
				<Cell
					align="right"
					bold
					text={totals.women > 0 ? String(totals.women) : "-"}
					width={QUARTILE_TABLE.num}
				/>
				<Cell
					align="right"
					bold
					text={totals.men > 0 ? String(totals.men) : "-"}
					width={QUARTILE_TABLE.num}
				/>
				<Cell
					align="right"
					bold
					text={
						totals.total > 0
							? computePercentage(totals.women, totals.total)
							: "- %"
					}
					width={QUARTILE_TABLE.num}
				/>
				<Cell
					align="right"
					bold
					text={
						totals.total > 0
							? computePercentage(totals.men, totals.total)
							: "- %"
					}
					width={QUARTILE_TABLE.num}
				/>
			</Row>
		</Table>
	);
}

export function QuartileSection({ data }: { data: DeclarationPdfData }) {
	return (
		<View>
			<View wrap={false}>
				<SectionBanner title="Proportion de femmes et d'hommes dans chaque quartile de rémunération" />
				<SubTitle title="Rémunération annuelle brute moyenne" />
				<QuartileTable
					quartiles={data.step4Data.annual}
					trancheLabel="annuelle brute"
				/>
			</View>
			<View wrap={false}>
				<SubTitle title="Rémunération horaire brute moyenne" />
				<QuartileTable
					quartiles={data.step4Data.hourly}
					trancheLabel="horaire brute"
				/>
			</View>
		</View>
	);
}
