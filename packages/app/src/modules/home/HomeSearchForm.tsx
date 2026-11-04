"use client";

import type { FormEvent } from "react";
import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { COMPANY_SIZE_VOLUNTARY_MAX, formatCount } from "~/modules/domain";
import { OBSERVATORY_SEARCH } from "~/modules/routes";
import { TooltipButton } from "~/modules/shared/TooltipButton";
import styles from "./HomeSearchForm.module.scss";

const QUERY_FIELD = "q";

function usedFacet(form: HTMLFormElement): string {
	const query = form.elements.namedItem(QUERY_FIELD);
	return query instanceof HTMLInputElement && query.value.trim() !== ""
		? QUERY_FIELD
		: "empty";
}

export function HomeSearchForm() {
	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.SEARCH,
			action: MATOMO_ACTION.SEARCH_SUBMIT,
			name: usedFacet(event.currentTarget),
		});
	}

	return (
		<form
			action={OBSERVATORY_SEARCH}
			aria-label="Rechercher une entreprise"
			autoComplete="off"
			className={styles.form}
			method="GET"
			onSubmit={handleSubmit}
		>
			<div className={styles.labelRow}>
				<label className="fr-label" htmlFor="home-search-query">
					Recherchez une entreprise par son nom ou son numéro SIREN (9
					chiffres).
				</label>
				<TooltipButton
					id="home-search-tooltip"
					label="Information sur les entreprises assujetties"
					text={`Les entreprises assujetties sont celles qui comptent au moins ${formatCount(COMPANY_SIZE_VOLUNTARY_MAX)} salariés.`}
				/>
			</div>
			<search className="fr-search-bar fr-search-bar--lg">
				<input
					className="fr-input"
					id="home-search-query"
					name={QUERY_FIELD}
					placeholder="Rechercher une entreprise"
					type="search"
				/>
				<button className="fr-btn" title="Rechercher" type="submit">
					Rechercher
				</button>
			</search>
		</form>
	);
}
