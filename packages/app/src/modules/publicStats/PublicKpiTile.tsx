import { KpiBadge, type KpiBadgeDelta } from "~/modules/shared";

export type PublicKpiTileDelta = KpiBadgeDelta;

type Props = {
	title: string;
	value: string;
	subtitle: string;
	delta: PublicKpiTileDelta | null;
};

export function PublicKpiTile({ title, value, subtitle, delta }: Props) {
	return (
		<div className="fr-tile fr-tile--vertical fr-tile--no-border">
			<div className="fr-tile__body">
				<div className="fr-tile__content">
					<h2 className="fr-tile__title">{title}</h2>
					<p className="fr-display--xs fr-mb-1w">{value}</p>
					<KpiBadge delta={delta} />
					<p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-1w">
						{subtitle}
					</p>
				</div>
			</div>
		</div>
	);
}
