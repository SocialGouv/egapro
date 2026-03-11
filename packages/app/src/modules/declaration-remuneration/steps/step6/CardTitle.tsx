import { TooltipButton } from "~/modules/declaration-remuneration/shared/TooltipButton";

type Props = {
	children: React.ReactNode;
	tooltipId?: string;
};

/** Card title with optional tooltip */
export function CardTitle({ children, tooltipId }: Props) {
	return (
		<div className="fr-grid-row fr-grid-row--middle">
			<p className="fr-text--bold fr-text--lg fr-mb-0">{children}</p>
			{tooltipId && <TooltipButton id={tooltipId} label="Aide" />}
		</div>
	);
}
