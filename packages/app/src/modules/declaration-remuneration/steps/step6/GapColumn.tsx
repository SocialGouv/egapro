import stepStyles from "../Step6Review.module.scss";
import { GapBadge } from "./GapBadge";

type Props = {
	title: string;
	columns: Array<{ label: string; gap: number | null }>;
};

export function GapColumn({ title, columns }: Props) {
	return (
		<div className={stepStyles.column}>
			<p className="fr-text--bold fr-text--sm fr-mb-0">{title}</p>
			<div className={stepStyles.subSection}>
				{columns.map((col) => (
					<div className={stepStyles.flex1} key={col.label}>
						<p className="fr-text--xs fr-mb-0">{col.label}</p>
						<GapBadge gap={col.gap} />
					</div>
				))}
			</div>
		</div>
	);
}
