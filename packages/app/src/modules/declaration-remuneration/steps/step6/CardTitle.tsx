import { TooltipButton } from "../../shared/TooltipButton";
import stepStyles from "../Step6Review.module.scss";

type Props = {
	children: React.ReactNode;
	tooltipId?: string;
};

/** Card title with check icon and optional tooltip */
export function CardTitle({ children, tooltipId }: Props) {
	return (
		<div className={stepStyles.cardTitleRow}>
			<span
				aria-hidden="true"
				className={`fr-icon-check-line ${stepStyles.checkIcon}`}
			/>
			<p className="fr-text--bold fr-text--lg fr-mb-0">{children}</p>
			{tooltipId && <TooltipButton id={tooltipId} label="Aide" />}
		</div>
	);
}
