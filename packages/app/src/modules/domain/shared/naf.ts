/**
 * NAF rév. 2 sections — the 21 top-level branches of the French activity
 * nomenclature (INSEE), used as the "Secteur d'activité" facet.
 *
 * The label table and the code ranges live together on purpose: a section is
 * defined by the two-digit divisions it spans, so a filter that resolves a
 * section to SQL and a form that offers it to a user must read the same source
 * or they will disagree about what "Industrie manufacturière" covers.
 */
export const NAF_SECTIONS = {
	A: "Agriculture, sylviculture et pêche",
	B: "Industries extractives",
	C: "Industrie manufacturière",
	D: "Électricité, gaz, vapeur et air conditionné",
	E: "Eau, assainissement, déchets et dépollution",
	F: "Construction",
	G: "Commerce et réparation automobile",
	H: "Transports et entreposage",
	I: "Hébergement et restauration",
	J: "Information et communication",
	K: "Activités financières et d’assurance",
	L: "Activités immobilières",
	M: "Activités spécialisées, scientifiques et techniques",
	N: "Activités de services administratifs et de soutien",
	O: "Administration publique",
	P: "Enseignement",
	Q: "Santé humaine et action sociale",
	R: "Arts, spectacles et activités récréatives",
	S: "Autres activités de services",
	T: "Activités des ménages en tant qu’employeurs",
	U: "Activités extraterritoriales",
} as const;

export type NafSection = keyof typeof NAF_SECTIONS;

export const NAF_SECTION_CODES = Object.keys(NAF_SECTIONS) as NafSection[];

/** Inclusive range of NAF divisions (the first two digits) covered by each section. */
export const NAF_SECTION_DIVISIONS: Record<NafSection, [number, number]> = {
	A: [1, 3],
	B: [5, 9],
	C: [10, 33],
	D: [35, 35],
	E: [36, 39],
	F: [41, 43],
	G: [45, 47],
	H: [49, 53],
	I: [55, 56],
	J: [58, 63],
	K: [64, 66],
	L: [68, 68],
	M: [69, 75],
	N: [77, 82],
	O: [84, 84],
	P: [85, 85],
	Q: [86, 88],
	R: [90, 93],
	S: [94, 96],
	T: [97, 98],
	U: [99, 99],
};
