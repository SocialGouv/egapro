"use client";

import type { FormEvent } from "react";
import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import {
	COUNTIES,
	NAF_SECTION_CODES,
	NAF_SECTIONS,
	REGIONS,
} from "~/modules/domain";

const FACET_FIELDS = ["q", "region", "departement", "naf"] as const;

// Records which search facets were used — by field name only, never their
// values (the free-text query may contain a SIREN or a company name).
function usedFacets(form: HTMLFormElement): string {
	const used = FACET_FIELDS.filter((field) => {
		const element = form.elements.namedItem(field);
		return element instanceof HTMLInputElement ||
			element instanceof HTMLSelectElement
			? element.value.trim() !== ""
			: false;
	});
	return used.length > 0 ? used.join("+") : "empty";
}

/** Public company search form — submits (GET) to the external consultation site. */
export function HomeSearchForm() {
	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.SEARCH,
			action: MATOMO_ACTION.SEARCH_SUBMIT,
			name: usedFacets(event.currentTarget),
		});
		// No preventDefault: let the native GET navigation to the consultation
		// site proceed.
	}

	return (
		<form
			action="/index-egapro/recherche"
			aria-label="Rechercher une entreprise"
			autoComplete="off"
			method="GET"
			onSubmit={handleSubmit}
		>
			<div className="fr-input-group">
				<label className="fr-label" htmlFor="search-query">
					Numéro Siren ou le nom de l&apos;entreprise
					<span className="fr-hint-text">
						Le numéro Siren se compose de 9 chiffres
					</span>
				</label>
				<input
					className="fr-input"
					id="search-query"
					name="q"
					placeholder="[siren] [raison sociale]"
					type="search"
				/>
			</div>

			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="search-region">
							Région
						</label>
						<select
							className="fr-select"
							defaultValue=""
							id="search-region"
							name="region"
						>
							<option value="">Toutes les régions</option>
							{Object.values(REGIONS).map((region) => (
								<option key={region} value={region}>
									{region}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="search-departement">
							Département
						</label>
						<select
							className="fr-select"
							defaultValue=""
							id="search-departement"
							name="departement"
						>
							<option value="">Tous les départements</option>
							{Object.entries(COUNTIES)
								.sort(([left], [right]) =>
									left.localeCompare(right, "fr", { numeric: true }),
								)
								.map(([code, department]) => (
									<option key={code} value={code}>
										{code} — {department}
									</option>
								))}
						</select>
					</div>
				</div>

				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="search-secteur">
							Secteur d'activité
						</label>
						<select
							className="fr-select"
							defaultValue=""
							id="search-secteur"
							name="naf"
						>
							<option value="">Tous les secteurs</option>
							{NAF_SECTION_CODES.map((code) => (
								<option key={code} value={code}>
									{code} — {NAF_SECTIONS[code]}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<button
				className="fr-btn fr-btn--secondary fr-icon-search-line fr-btn--icon-right fr-mt-2w"
				type="submit"
			>
				Rechercher
			</button>
		</form>
	);
}
