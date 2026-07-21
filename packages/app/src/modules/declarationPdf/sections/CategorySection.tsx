import { Text, View } from "@react-pdf/renderer";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration";
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
import { PAY_TABLE } from "./tableWidths";

function EffectifTable({ category }: { category: EmployeeCategoryRow }) {
	const womenCount = category.womenCount ?? 0;
	const menCount = category.menCount ?? 0;
	const total = computeWorkforceTotal(womenCount, menCount);
	return (
		<Table>
			<Row>
				<Cell header width={PAY_TABLE.label} />
				<Cell header text="Femmes" width={PAY_TABLE.value} />
				<Cell header text="Hommes" width={PAY_TABLE.value} />
				<Cell header text="Total" width={PAY_TABLE.total} />
			</Row>
			<Row>
				<Cell bold text="Nombre de salariés" width={PAY_TABLE.label} />
				<Cell align="right" text={String(womenCount)} width={PAY_TABLE.value} />
				<Cell align="right" text={String(menCount)} width={PAY_TABLE.value} />
				<Cell align="right" bold text={String(total)} width={PAY_TABLE.total} />
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
				<Cell header width={PAY_TABLE.label} />
				<Cell
					header
					text={"Rémunération\ndes femmes"}
					width={PAY_TABLE.value}
				/>
				<Cell
					header
					text={"Rémunération\ndes hommes"}
					width={PAY_TABLE.value}
				/>
				<Cell
					header
					hint="Seuil réglementaire : 5%"
					text="Écart"
					width={PAY_TABLE.gap}
				/>
			</Row>
			<Row>
				<Cell bold text="Salaire de base" width={PAY_TABLE.label} />
				<Cell
					align="right"
					text={formatCurrency(baseWomen)}
					width={PAY_TABLE.value}
				/>
				<Cell
					align="right"
					text={formatCurrency(baseMen)}
					width={PAY_TABLE.value}
				/>
				<Cell width={PAY_TABLE.gap}>
					<GapCell gap={computeGap(baseWomen ?? "", baseMen ?? "")} />
				</Cell>
			</Row>
			<Row>
				<Cell
					bold
					text={"Composantes variables\nou complémentaires"}
					width={PAY_TABLE.label}
				/>
				<Cell
					align="right"
					text={formatCurrency(variableWomen)}
					width={PAY_TABLE.value}
				/>
				<Cell
					align="right"
					text={formatCurrency(variableMen)}
					width={PAY_TABLE.value}
				/>
				<Cell width={PAY_TABLE.gap}>
					<GapCell gap={computeGap(variableWomen ?? "", variableMen ?? "")} />
				</Cell>
			</Row>
			<Row>
				<Cell bold text="Total" width={PAY_TABLE.label} />
				<Cell
					align="right"
					bold
					text={formatTotal(womenSum, "€")}
					width={PAY_TABLE.value}
				/>
				<Cell
					align="right"
					bold
					text={formatTotal(menSum, "€")}
					width={PAY_TABLE.value}
				/>
				<Cell width={PAY_TABLE.gap} />
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
	return (
		<View>
			<View minPresenceAhead={80} wrap={false}>
				<SectionBanner title="Écart de rémunération par catégories de salariés" />
				{data.categories.length > 0 ? (
					<View style={styles.infoBody}>
						<View style={styles.infoLabelColumn}>
							<Text style={styles.infoLabel}>Source</Text>
						</View>
						<View style={styles.infoValueColumn}>
							<Text style={styles.infoValue}>{data.source ?? "-"}</Text>
						</View>
					</View>
				) : (
					<Text style={styles.noData}>Aucune donnée renseignée.</Text>
				)}
			</View>
			{data.categories.map((category, position) => (
				<CategoryBlock
					category={category}
					index={position}
					key={category.name}
				/>
			))}
		</View>
	);
}
