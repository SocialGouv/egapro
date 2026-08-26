import {
	COUNTIES,
	NAF_SECTION_CODES,
	NAF_SECTIONS,
	OBSERVATORY_WORKFORCE_RANGE_KEYS,
	OBSERVATORY_WORKFORCE_RANGES,
	REGION_CODES,
	REGIONS,
} from "~/modules/domain";
import {
	MultiSelectField,
	type MultiSelectOption,
} from "~/modules/shared/MultiSelectField";
import { DEFAULT_PAGE_SIZE, SEARCH_PATH } from "./constants";
import type { ConsultationSearchParams } from "./searchParams";

const REGION_OPTIONS: MultiSelectOption[] = REGION_CODES.map((code) => ({
	value: code,
	label: REGIONS[code],
})).sort((left, right) => left.label.localeCompare(right.label, "fr"));

const DEPARTMENT_OPTIONS: MultiSelectOption[] = Object.entries(COUNTIES)
	.map(([code, label]) => ({ value: code, label: `${code} — ${label}` }))
	.sort((left, right) =>
		left.value.localeCompare(right.value, "fr", { numeric: true }),
	);

const NAF_OPTIONS: MultiSelectOption[] = NAF_SECTION_CODES.map((code) => ({
	value: code,
	label: NAF_SECTIONS[code],
}));

const WORKFORCE_OPTIONS: MultiSelectOption[] =
	OBSERVATORY_WORKFORCE_RANGE_KEYS.map((key) => ({
		value: key,
		label: OBSERVATORY_WORKFORCE_RANGES[key].label,
	}));

type Props = { values: ConsultationSearchParams };

export function PublicSearchForm({ values }: Props) {
	return (
		<form action={SEARCH_PATH} method="get">
			<search className="fr-search-bar fr-search-bar--lg">
				<label className="fr-label" htmlFor="consultation-query">
					Rechercher une entreprise par son nom ou son numéro SIREN
				</label>
				<input
					autoComplete="organization"
					className="fr-input"
					defaultValue={values.q}
					id="consultation-query"
					name="q"
					placeholder="Rechercher une entreprise"
					type="search"
				/>
				<button className="fr-btn" title="Rechercher" type="submit">
					Rechercher
				</button>
			</search>

			<section className="fr-accordion fr-mt-3w">
				<h2 className="fr-accordion__title">
					<button
						aria-controls="consultation-advanced-search"
						aria-expanded="false"
						className="fr-accordion__btn"
						type="button"
					>
						Recherche avancée
					</button>
				</h2>
				<div className="fr-collapse" id="consultation-advanced-search">
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-12 fr-col-md-6">
							<MultiSelectField
								id="facet-region"
								label="Région"
								name="region"
								options={REGION_OPTIONS}
								searchable
								selected={values.region}
							/>
						</div>
						<div className="fr-col-12 fr-col-md-6">
							<MultiSelectField
								id="facet-departement"
								label="Département"
								name="departement"
								options={DEPARTMENT_OPTIONS}
								searchable
								selected={values.departement}
							/>
						</div>
						<div className="fr-col-12 fr-col-md-6">
							<MultiSelectField
								id="facet-naf"
								label="Secteur d’activité"
								name="naf"
								options={NAF_OPTIONS}
								searchable
								selected={values.naf}
							/>
						</div>
						<div className="fr-col-12 fr-col-md-6">
							<MultiSelectField
								id="facet-workforce"
								label="Effectif"
								name="workforceRanges"
								options={WORKFORCE_OPTIONS}
								selected={values.workforceRanges}
							/>
						</div>
					</div>
				</div>
			</section>

			{/* A new search restarts at page 1, but keeps the chosen page size. */}
			{values.limit !== DEFAULT_PAGE_SIZE && (
				<input name="limit" type="hidden" value={values.limit} />
			)}
		</form>
	);
}
