import { Text, View } from "@react-pdf/renderer";

import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import {
	computeGap,
	computeTotal,
	computeWorkforceTotal,
	formatCurrency,
	formatTotal,
} from "~/modules/domain";

import { styles } from "../recapPdfStyles";
import type { DeclarationPdfData } from "../types";
import { GapCell } from "./GapCell";
import { CategoryBanner, SectionBanner, SubTitle } from "./headings";
import { Cell, Row, Table } from "./tableParts";

const LABEL_WIDTH = 141;
const VALUE_WIDTH = 132;
const GAP_WIDTH = 120;
const EFFECTIF_TOTAL_WIDTH = 120;

function EffectifTable({ category }: { category: EmployeeCategoryRow }) {
	const womenCount = category.womenCount ?? 0;
	const menCount = category.menCount ?? 0;
	const total = computeWorkforceTotal(womenCount, menCount);
	return (
		<Table>
			<Row>
				<Cell header width={LABEL_WIDTH} />
				<Cell header text="Femmes" width={VALUE_WIDTH} />
				<Cell header text="Hommes" width={VALUE_WIDTH} />
				<Cell header text="Total" width={EFFECTIF_TOTAL_WIDTH} />
			</Row>
			<Row>
				<Cell bold text="Nombre de salariés" width={LABEL_WIDTH} />
				<Cell align="right" text={String(womenCount)} width={VALUE_WIDTH} />
				<Cell align="right" text={String(menCount)} width={VALUE_WIDTH} />
				<Cell
					align="right"
					bold
					text={String(total)}
					width={EFFECTIF_TOTAL_WIDTH}
				/>
			</Row>
		</Table>
	);
}

function PayTable({
	baseWomen,
	baseMen,
	variableWomen,
	variableMen,
}: {
	baseWomen: string | null;
	baseMen: string | null;
	variableWomen: string | null;
	variableMen: string | null;
}) {
	const womenSum = computeTotal(baseWomen ?? "", variableWomen ?? "");
	const menSum = computeTotal(baseMen ?? "", variableMen ?? "");
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
			<Row>
				<Cell bold text="Salaire de base" width={LABEL_WIDTH} />
				<Cell
					align="right"
					text={formatCurrency(baseWomen)}
					width={VALUE_WIDTH}
				/>
				<Cell
					align="right"
					text={formatCurrency(baseMen)}
					width={VALUE_WIDTH}
				/>
				<Cell width={GAP_WIDTH}>
					<GapCell gap={computeGap(baseWomen ?? "", baseMen ?? "")} />
				</Cell>
			</Row>
			<Row>
				<Cell
					bold
					text={"Composantes variables\nou complémentaires"}
					width={LABEL_WIDTH}
				/>
				<Cell
					align="right"
					text={formatCurrency(variableWomen)}
					width={VALUE_WIDTH}
				/>
				<Cell
					align="right"
					text={formatCurrency(variableMen)}
					width={VALUE_WIDTH}
				/>
				<Cell width={GAP_WIDTH}>
					<GapCell gap={computeGap(variableWomen ?? "", variableMen ?? "")} />
				</Cell>
			</Row>
			<Row>
				<Cell bold text="Total" width={LABEL_WIDTH} />
				<Cell
					align="right"
					bold
					text={formatTotal(womenSum, "€")}
					width={VALUE_WIDTH}
				/>
				<Cell
					align="right"
					bold
					text={formatTotal(menSum, "€")}
					width={VALUE_WIDTH}
				/>
				<Cell width={GAP_WIDTH} />
			</Row>
		</Table>
	);
}

function CategoryBlock({
	category,
	index,
}: {
	category: EmployeeCategoryRow;
	index: number;
}) {
	const heading = `Catégorie d'emplois n°${index + 1}${category.name ? ` : ${category.name}` : ""}`;
	return (
		<View style={styles.categoryBlock}>
			<CategoryBanner title={heading} />
			<View wrap={false}>
				<SubTitle title="Effectifs physiques" />
				<EffectifTable category={category} />
			</View>
			<View wrap={false}>
				<SubTitle title="Rémunération annuelle brute moyenne" />
				<PayTable
					baseMen={category.annualBaseMen}
					baseWomen={category.annualBaseWomen}
					variableMen={category.annualVariableMen}
					variableWomen={category.annualVariableWomen}
				/>
			</View>
			<View wrap={false}>
				<SubTitle title="Rémunération horaire brute moyenne" />
				<PayTable
					baseMen={category.hourlyBaseMen}
					baseWomen={category.hourlyBaseWomen}
					variableMen={category.hourlyVariableMen}
					variableWomen={category.hourlyVariableWomen}
				/>
			</View>
		</View>
	);
}

export function CategorySection({ data }: { data: DeclarationPdfData }) {
	const indexedCategories = data.categories.map((category, position) => ({
		category,
		position,
	}));
	return (
		<View>
			<SectionBanner title="Écart de rémunération par catégories de salariés" />
			{indexedCategories.length > 0 ? (
				<>
					<View style={styles.infoBody}>
						<View style={styles.infoLabelColumn}>
							<Text style={styles.infoLabel}>Source</Text>
						</View>
						<View style={styles.infoValueColumn}>
							<Text style={styles.infoValue}>{data.source ?? "-"}</Text>
						</View>
					</View>
					{indexedCategories.map(({ category, position }) => (
						<CategoryBlock
							category={category}
							index={position}
							key={position}
						/>
					))}
				</>
			) : (
				<Text style={styles.noData}>Aucune donnée renseignée.</Text>
			)}
		</View>
	);
}
