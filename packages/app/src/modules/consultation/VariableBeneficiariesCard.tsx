import { gapRatioToPercent } from "~/modules/domain";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import { DataDetailsAccordion } from "~/modules/shared/DataDetailsAccordion";
import { SingleGenderBar } from "~/modules/shared/GenderBar";
import { IndicatorCard } from "~/modules/shared/IndicatorCard";
import { formatGap } from "./formatters";
import { GenderDetailsTable } from "./GenderDetailsTable";
import styles from "./indicatorSection.module.scss";
import { INDICATOR_TOOLTIPS } from "./tooltips";

const ROW_LABEL =
	"Pourcentage de bénéficiaires de rémunération variable et complémentaire";

type Props = {
	declaration: Pick<
		PublicDeclarationDTO,
		"variableProportionWomen" | "variableProportionMen"
	>;
};

/**
 * The two proportions do not add up to 100 % — they are computed against each
 * sex's own headcount — so they are drawn as two independent full-width bars
 * rather than as one stacked track.
 */
export function VariableBeneficiariesCard({ declaration }: Props) {
	const { variableProportionWomen, variableProportionMen } = declaration;

	return (
		<IndicatorCard
			className="fr-mt-3w"
			title="Proportion de femmes et d’hommes bénéficiaires de rémunération variable et complémentaire"
			tooltip={{
				id: "tooltip-variable-beneficiaries",
				label: "Aide sur la proportion de bénéficiaires",
				text: INDICATOR_TOOLTIPS.variableBeneficiaries,
			}}
		>
			<div className={styles.stackedBars}>
				<SingleGenderBar
					gender="women"
					label={
						<>
							Femmes bénéficiaires de rémunération variable et complémentaire :{" "}
							<strong>{formatGap(variableProportionWomen)}</strong>
						</>
					}
					percent={gapRatioToPercent(variableProportionWomen)}
				/>
				<SingleGenderBar
					gender="men"
					label={
						<>
							Hommes bénéficiaires de rémunération variable et complémentaire :{" "}
							<strong>{formatGap(variableProportionMen)}</strong>
						</>
					}
					percent={gapRatioToPercent(variableProportionMen)}
				/>
			</div>
			<div className={styles.accordionSlot}>
				<DataDetailsAccordion id="details-variable-beneficiaries">
					<GenderDetailsTable
						caption="Proportion de bénéficiaires de rémunération variable et complémentaire par sexe"
						columns={["Femmes", "Hommes"]}
						rows={[
							{
								label: ROW_LABEL,
								values: [
									formatGap(variableProportionWomen),
									formatGap(variableProportionMen),
								],
							},
						]}
					/>
				</DataDetailsAccordion>
			</div>
		</IndicatorCard>
	);
}
