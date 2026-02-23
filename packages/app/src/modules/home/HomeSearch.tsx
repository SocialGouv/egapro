/** Company search section by SIREN, region, department or sector. */
export function HomeSearch() {
	return (
		<section className="fr-py-8w">
			<div className="fr-container">
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12">
						<h2>Search for a company and view its results</h2>
						<p>
							Access the professional equality results of companies, including:
						</p>
						<ul>
							<li>
								<strong>remuneration indicators</strong> women-men for all
								employees
							</li>
							<li>
								<strong>representation indicators</strong> women-men within
								management positions
							</li>
						</ul>
					</div>
				</div>

				<div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
					<div
						aria-hidden="true"
						className="fr-col-3 fr-unhidden-md"
						style={{ display: "flex", justifyContent: "center" }}
					>
						<svg
							aria-hidden="true"
							className="fr-artwork"
							height="160px"
							viewBox="0 0 80 80"
							width="160px"
						>
							<use
								className="fr-artwork-decorative"
								href="/dsfr/artwork/pictograms/digital/search.svg#artwork-decorative"
							/>
							<use
								className="fr-artwork-minor"
								href="/dsfr/artwork/pictograms/digital/search.svg#artwork-minor"
							/>
							<use
								className="fr-artwork-major"
								href="/dsfr/artwork/pictograms/digital/search.svg#artwork-major"
							/>
						</svg>
					</div>

					<div className="fr-col-12 fr-col-md-9">
						<form action="/index-egapro/recherche" method="GET">
							<div className="fr-input-group">
								<label className="fr-label" htmlFor="search-query">
									Siren number or company name
									<span className="fr-hint-text">
										The Siren number consists of 9 digits
									</span>
								</label>
								<input
									className="fr-input"
									id="search-query"
									name="query"
									placeholder="[siren] [company name]"
									type="search"
								/>
							</div>

							<div className="fr-grid-row fr-grid-row--gutters">
								<div className="fr-col-12 fr-col-md-4">
									<div className="fr-select-group">
										<label className="fr-label" htmlFor="search-region">
											Region
										</label>
										<select
											className="fr-select"
											defaultValue=""
											id="search-region"
											name="region"
										>
											<option disabled hidden value="">
												Select an option
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
											Department
										</label>
										<select
											className="fr-select"
											defaultValue=""
											id="search-departement"
											name="departement"
										>
											<option disabled hidden value="">
												Select an option
											</option>
										</select>
									</div>
								</div>

								<div className="fr-col-12 fr-col-md-4">
									<div className="fr-select-group">
										<label className="fr-label" htmlFor="search-secteur">
											Activity sector
										</label>
										<select
											className="fr-select"
											defaultValue=""
											id="search-secteur"
											name="secteur"
										>
											<option disabled hidden value="">
												Select an option
											</option>
										</select>
									</div>
								</div>
							</div>

							<button
								className="fr-btn fr-btn--secondary fr-icon-search-line fr-btn--icon-right fr-mt-2w"
								type="submit"
							>
								Search
							</button>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
}
