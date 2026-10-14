import { KpiBadge, type KpiBadgeDelta } from "~/modules/shared/KpiBadge";

export type AdminKpiTileDelta = KpiBadgeDelta;

type Props = {
	title: string;
	value: string;
	subtitle: string | string[];
	delta: AdminKpiTileDelta | null;
	// true when the underlying KPI is "lower is better" (e.g. share above gap threshold).
	inverted?: boolean;
};

export function AdminKpiTile({
	title,
	value,
	subtitle,
	delta,
	inverted = false,
}: Props) {
	return (
		<div className="fr-tile fr-tile--vertical fr-tile--no-border">
			<div className="fr-tile__body">
				<div className="fr-tile__content">
					<h3 className="fr-tile__title">{title}</h3>
					<p className="fr-display--xs fr-mb-1w">{value}</p>
					<KpiBadge delta={delta} inverted={inverted} />
					<div className="fr-mt-1w">
						{(typeof subtitle === "string" ? [subtitle] : subtitle).map(
							(line) => (
								<p
									className="fr-text--sm fr-text-mention--grey fr-mb-0"
									key={line}
								>
									{line}
								</p>
							),
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
