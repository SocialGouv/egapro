export const PUBLIC_PAGE_SIZE = 50;

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

export const WORKFORCE_RANGES = [
	{ value: "", label: "Toutes les tailles" },
	{ value: "50-99", label: "50 à 99 salariés" },
	{ value: "100-249", label: "100 à 249 salariés" },
	{ value: "250-999", label: "250 à 999 salariés" },
	{ value: "1000-", label: "1 000 salariés et plus" },
] as const;
