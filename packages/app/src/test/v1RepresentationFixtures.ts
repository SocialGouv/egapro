/**
 * Fixtures for legacy V1 `representation_equilibree` rows, shared by the unit
 * and the integration suites of `scripts/import-v1-representation.mjs`.
 *
 * Key names and shapes mirror `RepresentationEquilibreeDataRaw` from the V1
 * codebase (`origin/master`), accents included — that jsonb is the contract
 * the import script reads.
 */

export type V1RepresentationCompany = {
	siren: string;
	raison_sociale: string;
	adresse?: string;
	code_naf?: string;
	code_postal?: string;
	commune?: string;
	département?: string;
	région?: string;
};

export type V1RepresentationIndicator = {
	motif_non_calculabilité_cadres?: string;
	motif_non_calculabilité_membres?: string;
	pourcentage_femmes_cadres?: number;
	pourcentage_femmes_membres?: number;
	pourcentage_hommes_cadres?: number;
	pourcentage_hommes_membres?: number;
};

export type V1RepresentationData = {
	déclarant: {
		email: string;
		nom: string;
		prénom: string;
		téléphone: string;
	};
	déclaration: {
		année_indicateurs: number;
		date?: string;
		fin_période_référence: string;
		publication?: { date: string; modalités?: string; url?: string };
	};
	entreprise: V1RepresentationCompany;
	indicateurs: { représentation_équilibrée: V1RepresentationIndicator };
};

export type V1RepresentationRow = {
	data: V1RepresentationData;
	declared_at: Date;
	modified_at: Date;
	siren: string;
	year: number;
};

export const V1_DECLARANT = {
	email: "declarant@example.fr",
	nom: "Martin",
	prénom: "Camille",
	téléphone: "0102030405",
};

export function v1Company(
	overrides: Partial<V1RepresentationCompany> = {},
): V1RepresentationCompany {
	return {
		siren: "123456789",
		raison_sociale: "Société Démo",
		adresse: "1 rue de la Paix",
		code_naf: "62.01Z",
		code_postal: "75002",
		commune: "Paris",
		département: "75",
		région: "11",
		...overrides,
	};
}

export function v1Indicator(
	overrides: Partial<V1RepresentationIndicator> = {},
): V1RepresentationIndicator {
	return {
		pourcentage_femmes_cadres: 45,
		pourcentage_hommes_cadres: 55,
		pourcentage_femmes_membres: 40,
		pourcentage_hommes_membres: 60,
		...overrides,
	};
}

export function v1Data(
	overrides: Partial<V1RepresentationData> = {},
): V1RepresentationData {
	return {
		déclarant: { ...V1_DECLARANT },
		déclaration: {
			année_indicateurs: 2023,
			date: "2024-02-10",
			fin_période_référence: "2023-12-31",
			publication: {
				date: "2024-02-01",
				url: "https://example.fr/representation",
			},
		},
		entreprise: v1Company(),
		indicateurs: { représentation_équilibrée: v1Indicator() },
		...overrides,
	};
}

export function v1Row(
	overrides: Partial<V1RepresentationRow> = {},
): V1RepresentationRow {
	return {
		siren: "123456789",
		year: 2023,
		declared_at: new Date("2024-02-10T09:30:00.000Z"),
		modified_at: new Date("2024-02-11T14:45:00.000Z"),
		data: v1Data(),
		...overrides,
	};
}
