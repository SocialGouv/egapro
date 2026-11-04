import type { ReferentFormValues } from "../schemas";

export const REFERENT_FIELD_LABELS: Record<keyof ReferentFormValues, string> = {
	principal: "Principal",
	name: "Nom",
	region: "Région",
	county: "Département",
	type: "Type de la valeur",
	value: "Valeur",
	substituteName: "Nom du suppléant",
	substituteEmail: "Email du suppléant",
};
