import type { PublicDeclarationDTO } from "~/modules/public-api";
import { DataDetailsAccordion } from "~/modules/shared/DataDetailsAccordion";
import { StackedGenderBar } from "~/modules/shared/GenderBar";
import { IndicatorCard } from "~/modules/shared/IndicatorCard";
import { formatCount, shareOf } from "./formatters";
import { GenderDetailsTable } from "./GenderDetailsTable";
import styles from "./indicatorSection.module.scss";
import { INDICATOR_TOOLTIPS } from "./tooltips";

type Props = {
	declaration: Pick<PublicDeclarationDTO, "totalWomen" | "totalMen">;
};

function legend(count: number | null, share: number | null) {
	const percent =
		share === null
			? null
			: `${share.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %`;
	return percent === null
		? formatCount(count)
		: `${formatCount(count)} (${percent})`;
}

export function WorkforceBreakdownCard({ declaration }: Props) {
	const { totalWomen, totalMen } = declaration;
	const total =
		totalWomen === null && totalMen === null
			? null
			: (totalWomen ?? 0) + (totalMen ?? 0);
	const womenShare = shareOf(totalWomen, total);
	const menShare = shareOf(totalMen, total);

	return (
		<section className={styles.section}>
			<h3 className={styles.title}>Répartition des effectifs</h3>
			<IndicatorCard
				aside={
					<>
						<p className={styles.totalLabel}>Total salariés</p>
						<p className={styles.totalValue}>{formatCount(total)}</p>
					</>
				}
				className="fr-mt-2w"
				title="Répartition"
				tooltip={{
					id: "tooltip-workforce",
					label: "Aide sur la répartition des effectifs",
					text: INDICATOR_TOOLTIPS.workforce,
				}}
			>
				<StackedGenderBar
					menLabel={
						<>
							Hommes : <strong>{legend(totalMen, menShare)}</strong>
						</>
					}
					menPercent={menShare}
					womenLabel={
						<>
							Femmes : <strong>{legend(totalWomen, womenShare)}</strong>
						</>
					}
					womenPercent={womenShare}
				/>
				<div className={styles.accordionSlot}>
					<DataDetailsAccordion id="details-workforce">
						<GenderDetailsTable
							caption="Répartition des effectifs par sexe"
							columns={["Femmes", "Hommes", "Total"]}
							rows={[
								{
									label: "Nombre de salariés",
									values: [
										formatCount(totalWomen),
										formatCount(totalMen),
										formatCount(total),
									],
								},
							]}
						/>
					</DataDetailsAccordion>
				</div>
			</IndicatorCard>
		</section>
	);
}
