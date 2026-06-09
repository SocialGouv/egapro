"use client";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";

const FACET_FIELDS = ["query", "region", "departement", "secteur"] as const;

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
	function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
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
					name="query"
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
							<option disabled hidden value="">
								Sélectionner une option
							</option>
							<option value="11">Île-de-France</option>
							<option value="24">Centre-Val de Loire</option>
							<option value="27">Bourgogne-Franche-Comté</option>
							<option value="28">Normandie</option>
							<option value="32">Hauts-de-France</option>
							<option value="44">Grand Est</option>
							<option value="52">Pays de la Loire</option>
							<option value="53">Bretagne</option>
							<option value="75">Nouvelle-Aquitaine</option>
							<option value="76">Occitanie</option>
							<option value="84">Auvergne-Rhône-Alpes</option>
							<option value="93">Provence-Alpes-Côte d'Azur</option>
							<option value="94">Corse</option>
							<option value="01">Guadeloupe</option>
							<option value="02">Martinique</option>
							<option value="03">Guyane</option>
							<option value="04">La Réunion</option>
							<option value="06">Mayotte</option>
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
							<option disabled hidden value="">
								Sélectionner une option
							</option>
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
							name="secteur"
						>
							<option disabled hidden value="">
								Sélectionner une option
							</option>
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
