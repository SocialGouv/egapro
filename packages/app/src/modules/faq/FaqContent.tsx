import { FaqAccordionGroup } from "./FaqAccordionGroup";
import styles from "./FaqPage.module.scss";
import type { FaqSection } from "./types";

type Props = {
	sections: FaqSection[];
};

/** Right column: white card with all FAQ sections, subsections, and accordions. */
export function FaqContent({ sections }: Props) {
	return (
		<div className={styles.contentCard}>
			{sections.map((section) => (
				<section
					aria-labelledby={section.id}
					className="fr-mb-4w"
					key={section.id}
				>
					<h2 className="fr-h5" id={section.id}>
						{section.title}
					</h2>
					{section.subsections.map((subsection, subIndex) => (
						<div className="fr-mt-3w" key={`${section.id}-sub-${subIndex}`}>
							<h3 className="fr-h6">{subsection.title}</h3>
							<FaqAccordionGroup
								items={subsection.items}
								sectionId={section.id}
								subsectionIndex={subIndex}
							/>
						</div>
					))}
				</section>
			))}
		</div>
	);
}
