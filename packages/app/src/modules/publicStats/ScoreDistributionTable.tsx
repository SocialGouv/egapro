import { formatCount, formatRate, NARROW_NBSP } from "~/modules/domain";

import type { ScoreDistributionBracket } from "./ScoreDistributionChart";

type Props = {
	brackets: ScoreDistributionBracket[];
	captionId: string;
};

export function ScoreDistributionTable({ brackets, captionId }: Props) {
	return (
		<div className="fr-table fr-table--bordered">
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table aria-labelledby={captionId}>
							<caption className="fr-sr-only" id={captionId}>
								Nombre d'entreprises par tranche de score global, pour l'année
								en cours.
							</caption>
							<thead>
								<tr>
									<th scope="col">Tranche de score</th>
									<th scope="col">Nombre d'entreprises</th>
									<th scope="col">Part du total</th>
								</tr>
							</thead>
							<tbody>
								{brackets.map((bracket) => (
									<tr key={bracket.id}>
										<th scope="row">{bracket.label}</th>
										<td>{formatCount(bracket.count)}</td>
										<td>
											{formatRate(bracket.percentage)}
											{NARROW_NBSP}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
