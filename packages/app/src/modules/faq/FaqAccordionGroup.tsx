"use client";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
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
	// DSFR JS toggles `aria-expanded` on click; read it on the next frame so we
	// only count opens, not closes.
	function handleAccordionClick(
		event: React.MouseEvent<HTMLButtonElement>,
		accordionId: string,
	): void {
		const button = event.currentTarget;
		requestAnimationFrame(() => {
			if (button.getAttribute("aria-expanded") === "true") {
				trackEvent({
					category: MATOMO_EVENT_CATEGORY.HELP,
					action: MATOMO_ACTION.FAQ_SECTION_OPEN,
					name: accordionId,
				});
			}
		});
	}

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
								onClick={(event) => handleAccordionClick(event, accordionId)}
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
