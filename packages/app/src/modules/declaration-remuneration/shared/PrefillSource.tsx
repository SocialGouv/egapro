import { getReferencePeriod } from "~/modules/domain";

import { TooltipButton } from "~/modules/shared/TooltipButton";

type Props = {
	year: number;
	tooltipId?: string;
};

export function PrefillSource({ year, tooltipId = "tooltip-source" }: Props) {
	return (
		<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
			Source&nbsp;: DSN (Déclarations Sociales Nominatives), période de
			référence&nbsp;: {getReferencePeriod(year)}.
			<TooltipButton
				id={tooltipId}
				label="Information sur la source des données"
			/>
		</p>
	);
}
