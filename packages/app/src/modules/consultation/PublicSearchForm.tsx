import { COUNTIES, REGIONS } from "~/modules/domain";
import { CompanyAutocomplete } from "./CompanyAutocomplete";
import { NAF_SECTIONS, WORKFORCE_RANGES } from "./constants";
import type { ConsultationSearchParams } from "./searchParams";

type Props = { values: ConsultationSearchParams };

export function PublicSearchForm({ values }: Props) {
	return (
		<form action="/index-egapro/recherche" method="get">
			<search className="fr-search-bar fr-search-bar--lg fr-mb-4w">
				<CompanyAutocomplete
					autoComplete="organization"
					defaultValue={values.q}
				/>
				<button className="fr-btn" title="Rechercher" type="submit">
					Rechercher
				</button>
			</search>

			<fieldset className="fr-fieldset fr-mb-2w">
				<legend className="fr-fieldset__legend fr-text--lg">
					Affiner la recherche
				</legend>
				<div className="fr-fieldset__content">
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-input-group">
								<label className="fr-label" htmlFor="consultation-city">
									Ville
								</label>
								<input
									autoComplete="address-level2"
									className="fr-input"
									defaultValue={values.city}
									id="consultation-city"
									name="city"
								/>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-select-group">
								<label className="fr-label" htmlFor="consultation-region">
									Région
								</label>
								<select
									className="fr-select"
									defaultValue={values.region}
									id="consultation-region"
									name="region"
								>
									<option value="">Toutes les régions</option>
									{Object.values(REGIONS).map((label) => (
										<option key={label} value={label}>
											{label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-select-group">
								<label className="fr-label" htmlFor="consultation-departement">
									Département
								</label>
								<select
									className="fr-select"
									defaultValue={values.departement}
									id="consultation-departement"
									name="departement"
								>
									<option value="">Tous les départements</option>
									{Object.entries(COUNTIES)
										.sort(([left], [right]) =>
											left.localeCompare(right, "fr", { numeric: true }),
										)
										.map(([code, label]) => (
											<option key={code} value={code}>
												{code} — {label}
											</option>
										))}
								</select>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-select-group">
								<label className="fr-label" htmlFor="consultation-naf">
									Secteur d’activité
								</label>
								<select
									className="fr-select"
									defaultValue={values.naf}
									id="consultation-naf"
									name="naf"
								>
									<option value="">Tous les secteurs</option>
									{Object.entries(NAF_SECTIONS).map(([code, label]) => (
										<option key={code} value={code}>
											{code} — {label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-select-group">
								<label className="fr-label" htmlFor="consultation-workforce">
									Taille de l’entreprise
								</label>
								<select
									className="fr-select"
									defaultValue={values.workforce}
									id="consultation-workforce"
									name="workforce"
								>
									{WORKFORCE_RANGES.map((range) => (
										<option key={range.value || "all"} value={range.value}>
											{range.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-input-group">
								<label className="fr-label" htmlFor="consultation-year">
									Année des données
								</label>
								<input
									className="fr-input"
									defaultValue={values.year}
									id="consultation-year"
									max={2100}
									min={2000}
									name="year"
									placeholder="Ex. 2025"
									type="number"
								/>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<div className="fr-select-group">
								<label className="fr-label" htmlFor="consultation-sort">
									Trier les résultats
								</label>
								<select
									className="fr-select"
									defaultValue={values.sort}
									id="consultation-sort"
									name="sort"
								>
									<option value="relevance">Pertinence</option>
									<option value="name">Ordre alphabétique</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</fieldset>

			<ul className="fr-btns-group fr-btns-group--inline-sm">
				<li>
					<button className="fr-btn" type="submit">
						Appliquer les critères
					</button>
				</li>
				<li>
					<a
						className="fr-btn fr-btn--secondary"
						href="/index-egapro/recherche"
					>
						Réinitialiser
					</a>
				</li>
			</ul>
		</form>
	);
}
