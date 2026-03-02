import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import stepStyles from "../Step6Review.module.scss";

type Props = {
	title: string;
	quartiles: Array<{ label: string; womenCount: number; menCount: number }>;
};

/** Quartile column: title, then quartile names as columns with percentages below */
export function QuartileColumn({ title, quartiles }: Props) {
	return (
		<div className={stepStyles.column}>
			<p className="fr-text--bold fr-text--sm fr-mb-0">{title}</p>

			<p className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}>
				Pourcentage de femmes
			</p>
			<div className={stepStyles.subSection}>
				{quartiles.map((q) => {
					const total = q.womenCount + q.menCount || 1;
					const pct = ((q.womenCount / total) * 100).toFixed(1);
					return (
						<div className={stepStyles.flex1} key={`f-${q.label}`}>
							<p className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}>
								{q.label}
							</p>
							<strong>{pct} %</strong>
						</div>
					);
				})}
			</div>

			<p className={`fr-text--xs fr-mb-0 fr-mt-1w ${common.mentionGrey}`}>
				Pourcentage d&apos;hommes
			</p>
			<div className={stepStyles.subSection}>
				{quartiles.map((q) => {
					const total = q.womenCount + q.menCount || 1;
					const pct = ((q.menCount / total) * 100).toFixed(1);
					return (
						<div className={stepStyles.flex1} key={`m-${q.label}`}>
							<p className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}>
								{q.label}
							</p>
							<strong>{pct} %</strong>
						</div>
					);
				})}
			</div>
		</div>
	);
}
