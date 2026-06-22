import type {
	AssociationMap,
	ContentTypeColumn,
	DeclarationNumber,
} from "../types";
import styles from "./OpinionSummaryBox.module.scss";

type Props = {
	columns: ContentTypeColumn[];
	associations: AssociationMap;
};

const DECLARATION_HEADINGS: Record<DeclarationNumber, string> = {
	1: "Première déclaration",
	2: "Deuxième déclaration",
};

export function OpinionSummaryBox({ columns, associations }: Props) {
	const declarationNumbers = [
		...new Set(columns.map((column) => column.declarationNumber)),
	];
	// The per-declaration heading only earns its place when there are two
	// declarations to tell apart; a single declaration just lists its obligations.
	const showDeclarationHeadings = declarationNumbers.length > 1;

	return (
		<div className={`fr-p-4w ${styles.container}`}>
			<p className="fr-text--bold fr-mb-2w">Avis CSE à transmettre :</p>

			{declarationNumbers.map((declarationNumber) => (
				<div className="fr-mb-2w" key={declarationNumber}>
					{showDeclarationHeadings && (
						<p className="fr-text--bold fr-mb-1w">
							{DECLARATION_HEADINGS[declarationNumber]}
						</p>
					)}
					<ul className={`fr-mb-0 ${styles.list}`}>
						{columns
							.filter(
								(column) => column.declarationNumber === declarationNumber,
							)
							.map((column) => {
								const isJoined = Boolean(associations[column.id]);
								return (
									<li className={styles.item} key={column.id}>
										{isJoined ? (
											<span
												className={`fr-icon-check-line fr-icon--sm ${styles.checkIcon}`}
											>
												<span className="fr-sr-only">Avis joint : </span>
											</span>
										) : (
											<span aria-hidden="true" className={styles.bullet}>
												•
											</span>
										)}
										<span>{column.description}</span>
									</li>
								);
							})}
					</ul>
				</div>
			))}
		</div>
	);
}
