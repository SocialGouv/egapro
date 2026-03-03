type BreadcrumbItem = {
	label: string;
	href: string;
};

type Props = {
	/** Unique id for the DSFR collapsible breadcrumb container. */
	collapseId: string;
	items: BreadcrumbItem[];
	/** Label + href for the current page (rendered with aria-current="page"). */
	current: BreadcrumbItem;
};

/** Shared DSFR breadcrumb used across aide pages. */
export function AideBreadcrumb({ collapseId, items, current }: Props) {
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
				Voir le fil d'Ariane
			</button>
			<div className="fr-collapse" id={collapseId}>
				<ol className="fr-breadcrumb__list">
					{items.map((item) => (
						<li key={item.href}>
							<a className="fr-breadcrumb__link" href={item.href}>
								{item.label}
							</a>
						</li>
					))}
					<li>
						<a
							aria-current="page"
							className="fr-breadcrumb__link"
							href={current.href}
						>
							{current.label}
						</a>
					</li>
				</ol>
			</div>
		</nav>
	);
}
