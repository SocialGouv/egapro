"use client";

import { publicSearchReferentsFormSchema } from "./schemas";
import { ReferentsSearchForm } from "./shared/ReferentsSearchForm";

export function PublicReferentsSearchForm() {
	return (
		<ReferentsSearchForm
			basePath="/referents"
			fieldPrefix="referents"
			queryPlaceholder="Ex : Durand"
			queryType="search"
			schema={publicSearchReferentsFormSchema}
			wrapFieldsInFieldset
		/>
	);
}
