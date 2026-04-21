"use client";

import { ReferentsSearchForm } from "~/modules/referents";

import { searchReferentsFormSchema } from "./schemas";

export function SearchForm() {
	return (
		<ReferentsSearchForm
			basePath="/admin/liste-referents"
			emptyCountyLabel="Tous"
			emptyRegionLabel="Toutes"
			fieldPrefix="search"
			schema={searchReferentsFormSchema}
		/>
	);
}
