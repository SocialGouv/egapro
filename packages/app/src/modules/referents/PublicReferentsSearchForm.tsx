"use client";

import { REFERENTS } from "~/modules/routes";
import { publicSearchReferentsFormSchema } from "./schemas";
import { ReferentsSearchForm } from "./shared/ReferentsSearchForm";

export function PublicReferentsSearchForm() {
	return (
		<ReferentsSearchForm
			basePath={REFERENTS}
			fieldPrefix="referents"
			schema={publicSearchReferentsFormSchema}
			wrapFieldsInFieldset
		/>
	);
}
