import type { PublicDeclarationDTO } from "~/modules/public-api";
import { PayGapSection, type PeriodContent } from "./PayGapSection";
import { QuartileSection } from "./QuartileSection";
import { INDICATOR_TOOLTIPS } from "./tooltips";
import { VariableBeneficiariesCard } from "./VariableBeneficiariesCard";
import { WorkforceBreakdownCard } from "./WorkforceBreakdownCard";

const GLOBAL_SECTION_ID = "globalGap";
const VARIABLE_SECTION_ID = "variableGap";

type Props = { declaration: PublicDeclarationDTO; threshold: string };

function globalPeriods(declaration: PublicDeclarationDTO): {
	hourly: PeriodContent;
	annual: PeriodContent;
} {
	return {
		hourly: {
			mean: {
				title: "Écarts de rémunération horaire brute moyenne",
				value: declaration.globalHourlyMeanGap,
				tooltip: {
					id: "tooltip-global-hourly-mean",
					label: "Aide sur l’écart de rémunération horaire brute moyenne",
					text: INDICATOR_TOOLTIPS.globalHourlyMean,
				},
			},
			median: {
				title: "Écarts de rémunération horaire brute médiane",
				value: declaration.globalHourlyMedianGap,
				tooltip: {
					id: "tooltip-global-hourly-median",
					label: "Aide sur l’écart de rémunération horaire brute médiane",
					text: INDICATOR_TOOLTIPS.globalHourlyMedian,
				},
			},
		},
		annual: {
			mean: {
				title: "Écarts de rémunération annuelle brute moyenne",
				value: declaration.globalAnnualMeanGap,
				tooltip: {
					id: "tooltip-global-annual-mean",
					label: "Aide sur l’écart de rémunération annuelle brute moyenne",
					text: INDICATOR_TOOLTIPS.globalAnnualMean,
				},
			},
			median: {
				title: "Écarts de rémunération annuelle brute médiane",
				value: declaration.globalAnnualMedianGap,
				tooltip: {
					id: "tooltip-global-annual-median",
					label: "Aide sur l’écart de rémunération annuelle brute médiane",
					text: INDICATOR_TOOLTIPS.globalAnnualMedian,
				},
			},
		},
	};
}

function variablePeriods(declaration: PublicDeclarationDTO): {
	hourly: PeriodContent;
	annual: PeriodContent;
} {
	const prefix = "Écarts de rémunération variable et complémentaire";
	return {
		hourly: {
			mean: {
				title: `${prefix} horaire brute moyenne`,
				value: declaration.variableHourlyMeanGap,
				tooltip: {
					id: "tooltip-variable-hourly-mean",
					label: "Aide sur l’écart de rémunération variable horaire moyenne",
					text: INDICATOR_TOOLTIPS.variableHourlyMean,
				},
			},
			median: {
				title: `${prefix} horaire brute médiane`,
				value: declaration.variableHourlyMedianGap,
				tooltip: {
					id: "tooltip-variable-hourly-median",
					label: "Aide sur l’écart de rémunération variable horaire médiane",
					text: INDICATOR_TOOLTIPS.variableHourlyMedian,
				},
			},
		},
		annual: {
			mean: {
				title: `${prefix} annuelle brute moyenne`,
				value: declaration.variableAnnualMeanGap,
				tooltip: {
					id: "tooltip-variable-annual-mean",
					label: "Aide sur l’écart de rémunération variable annuelle moyenne",
					text: INDICATOR_TOOLTIPS.variableAnnualMean,
				},
			},
			median: {
				title: `${prefix} annuelle brute médiane`,
				value: declaration.variableAnnualMedianGap,
				tooltip: {
					id: "tooltip-variable-annual-median",
					label: "Aide sur l’écart de rémunération variable annuelle médiane",
					text: INDICATOR_TOOLTIPS.variableAnnualMedian,
				},
			},
		},
	};
}

export function RemunerationTab({ declaration, threshold }: Props) {
	const global = globalPeriods(declaration);
	const variable = variablePeriods(declaration);

	return (
		<>
			<WorkforceBreakdownCard declaration={declaration} />
			<PayGapSection
				annual={global.annual}
				hourly={global.hourly}
				id={GLOBAL_SECTION_ID}
				threshold={threshold}
				title="Écart de rémunération"
			/>
			<PayGapSection
				annual={variable.annual}
				hourly={variable.hourly}
				id={VARIABLE_SECTION_ID}
				threshold={threshold}
				title="Écart de rémunération variable et complémentaire"
			>
				<VariableBeneficiariesCard declaration={declaration} />
			</PayGapSection>
			<QuartileSection declaration={declaration} />
		</>
	);
}
