import common from "../../shared/common.module.scss";
import stepStyles from "../Step6Review.module.scss";
import { GapBadge } from "./GapBadge";

type Props = {
	title: string;
	columns: Array<{ label: string; gap: number | null }>;
};

/** Column within a side-by-side section: header row + value row */
export function GapColumn({ title, columns }: Props) {
	return (
		<div className={stepStyles.column}>
			<p className="fr-text--bold fr-text--sm fr-mb-0">{title}</p>
			<div className={stepStyles.subSection}>
				{columns.map((col) => (
					<div key={col.label} className={stepStyles.flex1}>
						<p className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}>
							{col.label}
						</p>
						<GapBadge gap={col.gap} />
					</div>
				))}
			</div>
		</div>
	);
}
