import stepStyles from "../Step6Review.module.scss";

type Props = {
	title: string;
	quartiles: Array<{ label: string; womenCount: number; menCount: number }>;
};

export function QuartileColumn({ title, quartiles }: Props) {
	return (
		<div className={stepStyles.column}>
			<p className="fr-text--bold fr-text--sm fr-mb-0">{title}</p>

			<p className="fr-text--sm fr-mb-0">Pourcentage de femmes</p>
			<div className={stepStyles.subSection}>
				{quartiles.map((q) => {
					const total = q.womenCount + q.menCount || 1;
					const pct = ((q.womenCount / total) * 100).toFixed(1);
					return (
						<div className={stepStyles.flex1} key={`f-${q.label}`}>
							<p className="fr-text--sm fr-mb-0">{q.label}</p>
							<strong className="fr-text--sm">{pct} %</strong>
						</div>
					);
				})}
			</div>

			<p className="fr-text--sm fr-mb-0 fr-mt-1w">Pourcentage d&apos;hommes</p>
			<div className={stepStyles.subSection}>
				{quartiles.map((q) => {
					const total = q.womenCount + q.menCount || 1;
					const pct = ((q.menCount / total) * 100).toFixed(1);
					return (
						<div className={stepStyles.flex1} key={`m-${q.label}`}>
							<p className="fr-text--sm fr-mb-0">{q.label}</p>
							<strong className="fr-text--sm">{pct} %</strong>
						</div>
					);
				})}
			</div>
		</div>
	);
}
