"use client";

// Direct import (not via `~/modules/referents` barrel) to avoid pulling
// server-only transitive imports (auth → db → postgres) into this client
// component bundle. The barrel re-exports server components that drag them in.
import { ReferentsSearchForm } from "~/modules/referents/shared/ReferentsSearchForm";

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
