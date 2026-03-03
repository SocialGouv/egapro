import type { FaqItem } from "./types";

type Props = {
	items: FaqItem[];
	sectionId: string;
	subsectionIndex: number;
};

/** DSFR accordion group rendering a list of Q&A items. */
export function FaqAccordionGroup({
	items,
	sectionId,
	subsectionIndex,
}: Props) {
	return (
		<div className="fr-accordions-group" data-fr-group="false">
			{items.map((item, index) => {
				const accordionId = `accordion-${sectionId}-${subsectionIndex}-${index}`;
				return (
					<div className="fr-accordion" key={accordionId}>
						<h4 className="fr-accordion__title">
							<button
								aria-controls={accordionId}
								aria-expanded={false}
								className="fr-accordion__btn"
								type="button"
							>
								{item.question}
							</button>
						</h4>
						<div className="fr-collapse" id={accordionId}>
							<p>{item.answer}</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
