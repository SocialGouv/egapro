import { TooltipButton } from "~/modules/shared/TooltipButton";
import type { WorkforceRowDefinition } from "./workforceRows";
import {
	WORKFORCE_MEN_HEADER,
	WORKFORCE_WOMEN_HEADER,
	workforceRowTooltip,
	workforceRowTooltipLabel,
} from "./workforceRows";

export function WorkforceTableHead() {
	return (
		<thead>
			<tr>
				<th scope="col">
					<span className="fr-sr-only">Base de rémunération</span>
				</th>
				<th scope="col">{WORKFORCE_WOMEN_HEADER}</th>
				<th scope="col">{WORKFORCE_MEN_HEADER}</th>
				<th scope="col">Total</th>
			</tr>
		</thead>
	);
}

type WorkforceRowHeaderProps = {
	row: WorkforceRowDefinition;
	tooltipId?: string;
};

export function WorkforceRowHeader({
	row,
	tooltipId,
}: WorkforceRowHeaderProps) {
	return (
		<th scope="row">
			{row.label}
			{tooltipId && (
				<TooltipButton
					id={tooltipId}
					label={workforceRowTooltipLabel(row)}
					text={workforceRowTooltip(row)}
				/>
			)}
		</th>
	);
}
