import type { PublicDeclarationDTO } from "~/modules/public-api";
import { VariablePayIndicatorPanel } from "./VariablePayIndicatorPanel";

const formatRatio = (value: number | null) =>
	value === null
		? "—"
		: `${(value * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

const formatPercentage = (value: number | null) =>
	value === null
		? "—"
		: `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

type Props = { declaration: PublicDeclarationDTO };

export function IndicatorTables({ declaration }: Props) {
	const gaps = [
		[
			"A — Écart de rémunération moyenne",
			declaration.globalAnnualMeanGap,
			declaration.globalHourlyMeanGap,
		],
		[
			"C — Écart de rémunération médiane",
			declaration.globalAnnualMedianGap,
			declaration.globalHourlyMedianGap,
		],
	] as const;
	const quartiles = [1, 2, 3, 4] as const;
	return (
		<div className="fr-mt-5w">
			<div className="fr-table fr-table--multiline">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>
									Écarts de rémunération globale en {declaration.year}
								</caption>
								<thead>
									<tr>
										<th scope="col">Indicateur</th>
										<th scope="col">Écart annuel</th>
										<th scope="col">Écart horaire</th>
									</tr>
								</thead>
								<tbody>
									{gaps.map(([label, annual, hourly]) => (
										<tr key={label}>
											<th scope="row">{label}</th>
											<td>{formatRatio(annual)}</td>
											<td>{formatRatio(hourly)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
			<VariablePayIndicatorPanel {...declaration} />
			<div className="fr-table fr-table--multiline fr-mt-5w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>
									Indicateur F — répartition femmes-hommes par quartile
								</caption>
								<thead>
									<tr>
										<th scope="col">Quartile</th>
										<th scope="col">Femmes — annuel</th>
										<th scope="col">Hommes — annuel</th>
										<th scope="col">Femmes — horaire</th>
										<th scope="col">Hommes — horaire</th>
									</tr>
								</thead>
								<tbody>
									{quartiles.map((quartile) => {
										const annualWomen =
											declaration[`annualQuartile${quartile}ProportionWomen`];
										const annualMen =
											declaration[`annualQuartile${quartile}ProportionMen`];
										const hourlyWomen =
											declaration[`hourlyQuartile${quartile}ProportionWomen`];
										const hourlyMen =
											declaration[`hourlyQuartile${quartile}ProportionMen`];
										return (
											<tr key={quartile}>
												<th scope="row">Quartile {quartile}</th>
												<td>{formatPercentage(annualWomen)}</td>
												<td>{formatPercentage(annualMen)}</td>
												<td>{formatPercentage(hourlyWomen)}</td>
												<td>{formatPercentage(hourlyMen)}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
