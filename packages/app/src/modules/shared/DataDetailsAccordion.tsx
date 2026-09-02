import type { ReactNode } from "react";

type Props = {
	/** Id of the collapsible panel; must be unique in the document. */
	id: string;
	/** Heading rank, so the accordion slots under the card that wraps it. */
	headingLevel?: "h4" | "h5";
	label?: string;
	children: ReactNode;
};

/**
 * The "Détails des données" disclosure of the observatory cards. Plain DSFR
 * accordion markup — the DSFR runtime drives the toggle, so it renders on the
 * server, starts collapsed, and keeps `aria-controls` pointing at a panel that
 * is always in the DOM.
 */
export function DataDetailsAccordion({
	id,
	headingLevel = "h4",
	label = "Détails des données",
	children,
}: Props) {
	const Heading = headingLevel;
	return (
		<div className="fr-accordion">
			<Heading className="fr-accordion__title">
				<button
					aria-controls={id}
					aria-expanded="false"
					className="fr-accordion__btn"
					type="button"
				>
					{label}
				</button>
			</Heading>
			<div className="fr-collapse fr-pt-0" id={id}>
				{children}
			</div>
		</div>
	);
}
