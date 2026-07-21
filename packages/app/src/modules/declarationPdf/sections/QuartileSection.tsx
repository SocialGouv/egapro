import { View } from "@react-pdf/renderer";

import type { Step4Data } from "~/modules/declaration-remuneration/types";
import {
	computePercentage,
	computeWorkforceTotal,
	sumQuartileWorkforce,
} from "~/modules/domain";

import type { DeclarationPdfData } from "../types";
import { SectionBanner, SubTitle } from "./headings";
import { Cell, Row, Table } from "./tableParts";

const LABEL_WIDTH = 88;
const TRANCHE_WIDTH = 79;
const SPAN_WIDTH = 246; // label + 2 tranche columns
const NUM_WIDTH = 69.75;

const QUARTILE_LABELS = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
];

function formatTranche(value: string | undefined): string {
	if (!value) return "- €";
	const n = Number.parseFloat(value);
	if (Number.isNaN(n)) return "- €";
	return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
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
				<Cell header width={LABEL_WIDTH} />
				<Cell
					header
					text={`Montants des tranches de rémunération ${trancheLabel}`}
					width={TRANCHE_WIDTH * 2}
				/>
				<Cell header text={"Nombre\nde femmes"} width={NUM_WIDTH} />
				<Cell header text={"Nombre\nd'hommes"} width={NUM_WIDTH} />
				<Cell header text={"Pourcentage\nde femmes"} width={NUM_WIDTH} />
				<Cell header text={"Pourcentage\nd'hommes"} width={NUM_WIDTH} />
			</Row>
			{quartiles.map((q, i) => {
				const min = formatTranche(quartiles[i - 1]?.threshold);
				const max = formatTranche(q.threshold);
				const lineTotal = computeWorkforceTotal(q.women ?? 0, q.men ?? 0);
				return (
					<Row key={QUARTILE_LABELS[i]}>
						<Cell bold text={QUARTILE_LABELS[i]} width={LABEL_WIDTH} />
						<Cell align="right" text={min} width={TRANCHE_WIDTH} />
						<Cell align="right" text={max} width={TRANCHE_WIDTH} />
						<Cell
							align="right"
							text={q.women !== undefined ? String(q.women) : "-"}
							width={NUM_WIDTH}
						/>
						<Cell
							align="right"
							text={q.men !== undefined ? String(q.men) : "-"}
							width={NUM_WIDTH}
						/>
						<Cell
							align="right"
							bold
							text={
								lineTotal > 0
									? computePercentage(q.women ?? 0, lineTotal)
									: "- %"
							}
							width={NUM_WIDTH}
						/>
						<Cell
							align="right"
							bold
							text={
								lineTotal > 0 ? computePercentage(q.men ?? 0, lineTotal) : "- %"
							}
							width={NUM_WIDTH}
						/>
					</Row>
				);
			})}
			<Row>
				<Cell bold text="Tous les salariés" width={SPAN_WIDTH} />
				<Cell
					align="right"
					bold
					text={totals.women > 0 ? String(totals.women) : "-"}
					width={NUM_WIDTH}
				/>
				<Cell
					align="right"
					bold
					text={totals.men > 0 ? String(totals.men) : "-"}
					width={NUM_WIDTH}
				/>
				<Cell
					align="right"
					bold
					text={
						totals.total > 0
							? computePercentage(totals.women, totals.total)
							: "- %"
					}
					width={NUM_WIDTH}
				/>
				<Cell
					align="right"
					bold
					text={
						totals.total > 0
							? computePercentage(totals.men, totals.total)
							: "- %"
					}
					width={NUM_WIDTH}
				/>
			</Row>
		</Table>
	);
}

export function QuartileSection({ data }: { data: DeclarationPdfData }) {
	return (
		<View>
			<SectionBanner title="Proportion de femmes et d'hommes dans chaque quartile de rémunération" />
			<View wrap={false}>
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
