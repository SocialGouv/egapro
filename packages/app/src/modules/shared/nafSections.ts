/**
 * NAF sections — French "Nomenclature d'Activités Française" (INSEE 2008).
 *
 * 21 top-level sections keyed by their single-letter prefix (A–U), used by
 * the admin-stats NAF filter. The full company NAF code (e.g. `62.01Z`) is
 * stored on `companies.nafCode`; matching a section is `LIKE 'J%'`.
 *
 * Source: https://www.insee.fr/fr/information/2120875
 */
export type NafSectionCode =
	| "A"
	| "B"
	| "C"
	| "D"
	| "E"
	| "F"
	| "G"
	| "H"
	| "I"
	| "J"
	| "K"
	| "L"
	| "M"
	| "N"
	| "O"
	| "P"
	| "Q"
	| "R"
	| "S"
	| "T"
	| "U";

export const NAF_SECTIONS: Record<NafSectionCode, string> = {
	A: "Agriculture, sylviculture et pêche",
	B: "Industries extractives",
	C: "Industrie manufacturière",
	D: "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
	E: "Production et distribution d'eau, assainissement, gestion des déchets et dépollution",
	F: "Construction",
	G: "Commerce, réparation d'automobiles et de motocycles",
	H: "Transports et entreposage",
	I: "Hébergement et restauration",
	J: "Information et communication",
	K: "Activités financières et d'assurance",
	L: "Activités immobilières",
	M: "Activités spécialisées, scientifiques et techniques",
	N: "Activités de services administratifs et de soutien",
	O: "Administration publique",
	P: "Enseignement",
	Q: "Santé humaine et action sociale",
	R: "Arts, spectacles et activités récréatives",
	S: "Autres activités de services",
	T: "Activités des ménages en tant qu'employeurs",
	U: "Activités extra-territoriales",
};

export const NAF_SECTION_CODES = Object.keys(NAF_SECTIONS) as NafSectionCode[];
