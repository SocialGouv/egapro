"use client";

import Link from "next/link";
import { useId } from "react";

type BreadcrumbItem = {
	label: string;
	href?: string;
};

type Props = {
	items: BreadcrumbItem[];
};

/** Shared DSFR breadcrumb component. Last item (without href) is the current page. */
export function Breadcrumb({ items }: Props) {
	const collapseId = `breadcrumb-${useId()}`;
	const parentItems = items.slice(0, -1);
	const currentItem = items.at(-1);

	if (!currentItem) return null;

	return (
		<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
			{/* DSFR JS will manage aria-expanded after hydration */}
			<button
				aria-controls={collapseId}
				aria-expanded="false"
				className="fr-breadcrumb__button"
				suppressHydrationWarning
				type="button"
			>
				Voir le fil d&#39;Ariane
			</button>
			<div className="fr-collapse" id={collapseId}>
				<ol className="fr-breadcrumb__list">
					{parentItems.map((item) => (
						<li key={item.href ?? item.label}>
							<Link className="fr-breadcrumb__link" href={item.href ?? "/"}>
								{item.label}
							</Link>
						</li>
					))}
					<li>
						<span aria-current="page" className="fr-breadcrumb__link">
							{currentItem.label}
						</span>
					</li>
				</ol>
			</div>
		</nav>
	);
}
