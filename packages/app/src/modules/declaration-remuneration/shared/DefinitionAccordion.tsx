"use client";

import type { ReactNode } from "react";

type DefinitionAccordionProps = {
	id: string;
	title: string;
	className?: string;
	children: ReactNode;
};

export function DefinitionAccordion({
	id,
	title,
	className,
	children,
}: DefinitionAccordionProps) {
	return (
		<section className={`fr-accordion ${className ?? ""}`}>
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
				<div className="fr-callout">{children}</div>
			</div>
		</section>
	);
}
