import styles from "./OpinionSummaryBox.module.scss";

type Props = {
	firstDeclTitle: string;
	secondDeclTitle: string;
	secondDeclGapTitle: string;
};

export function OpinionSummaryBox({
	firstDeclTitle,
	secondDeclTitle,
	secondDeclGapTitle,
}: Props) {
	return (
		<div className={`fr-p-4w ${styles.container}`}>
			<p className="fr-text--bold fr-text--sm fr-mb-2w">
				Avis CSE à transmettre :
			</p>

			<p className="fr-text--sm fr-mb-1w">Première déclaration</p>
			<ul className="fr-mb-2w">
				<li className="fr-text--sm">{firstDeclTitle}</li>
			</ul>

			<p className="fr-text--sm fr-mb-1w">Deuxième déclaration</p>
			<ul className="fr-mb-0">
				<li className="fr-text--sm">{secondDeclTitle}</li>
				<li className="fr-text--sm">{secondDeclGapTitle}</li>
			</ul>
		</div>
	);
}
