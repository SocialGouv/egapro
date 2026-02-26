"use client";

type DefinitionAccordionProps = {
	id: string;
	title?: string;
};

export function DefinitionAccordion({
	id,
	title = "Définitions et méthode de calcul",
}: DefinitionAccordionProps) {
	return (
		<section className="fr-accordion fr-mt-4w">
			<h3 className="fr-accordion__title">
				<button
					aria-controls={id}
					aria-expanded="false"
					className="fr-accordion__btn"
					type="button"
				>
					{title}
				</button>
			</h3>
			<div className="fr-collapse" id={id}>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
					minim veniam, quis nostrud exercitation ullamco laboris nisi ut
					aliquip ex ea commodo consequat.
				</p>
				<p>
					Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
					dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
					proident, sunt in culpa qui officia deserunt mollit anim id est
					laborum.
				</p>
			</div>
		</section>
	);
}
