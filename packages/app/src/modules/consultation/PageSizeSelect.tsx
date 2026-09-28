"use client";

import { useRouter } from "next/navigation";
import { PAGE_SIZE_OPTIONS } from "./constants";
import { type ConsultationSearchParams, searchHref } from "./searchParams";

type Props = { params: ConsultationSearchParams };

/**
 * "10 lignes par page" — changing the page size restarts at page 1, because the
 * offset the current page stands for no longer points at the same companies.
 */
export function PageSizeSelect({ params }: Props) {
	const router = useRouter();
	return (
		<div className="fr-select-group fr-mb-0">
			<label className="fr-label fr-sr-only" htmlFor="consultation-page-size">
				Nombre de résultats par page
			</label>
			{/* WCAG 3.2.2: the reload is what a sighted user asked for by picking a
			    size, but a screen-reader user has to be told it will happen. */}
			<p className="fr-sr-only" id="consultation-page-size-hint">
				Le choix d’un nombre de résultats recharge la liste.
			</p>
			<select
				aria-describedby="consultation-page-size-hint"
				className="fr-select"
				id="consultation-page-size"
				onChange={(event) =>
					router.push(
						searchHref(params, {
							limit: Number(event.currentTarget.value),
							page: 1,
						}),
					)
				}
				value={params.limit}
			>
				{PAGE_SIZE_OPTIONS.map((size) => (
					<option key={size} value={size}>
						{size} lignes par page
					</option>
				))}
			</select>
		</div>
	);
}
