export const REGIONS = {
	"01": "Guadeloupe",
	"02": "Martinique",
	"03": "Guyane",
	"04": "La Réunion",
	"06": "Mayotte",
	"11": "Île-de-France",
	"24": "Centre-Val de Loire",
	"27": "Bourgogne-Franche-Comté",
	"28": "Normandie",
	"32": "Hauts-de-France",
	"44": "Grand-Est",
	"52": "Pays de la Loire",
	"53": "Bretagne",
	"75": "Nouvelle-Aquitaine",
	"76": "Occitanie",
	"84": "Auvergne-Rhône-Alpes",
	"93": "Provence-Alpes-Côte d'Azur",
	"94": "Corse",
} as const;

export type RegionCode = keyof typeof REGIONS;

export const REGION_CODES = Object.keys(REGIONS) as [
	RegionCode,
	...RegionCode[],
];

export const COUNTIES = {
	"01": "Ain",
	"02": "Aisne",
	"03": "Allier",
	"04": "Alpes-de-Haute-Provence",
	"05": "Hautes-Alpes",
	"06": "Alpes-Maritimes",
	"07": "Ardèche",
	"08": "Ardennes",
	"09": "Ariège",
	"10": "Aube",
	"11": "Aude",
	"12": "Aveyron",
	"13": "Bouches-du-Rhône",
	"14": "Calvados",
	"15": "Cantal",
	"16": "Charente",
	"17": "Charente-Maritime",
	"18": "Cher",
	"19": "Corrèze",
	"2A": "Corse-du-Sud",
	"2B": "Haute-Corse",
	"21": "Côte-d'Or",
	"22": "Côtes-d'Armor",
	"23": "Creuse",
	"24": "Dordogne",
	"25": "Doubs",
	"26": "Drôme",
	"27": "Eure",
	"28": "Eure-et-Loir",
	"29": "Finistère",
	"30": "Gard",
	"31": "Haute-Garonne",
	"32": "Gers",
	"33": "Gironde",
	"34": "Hérault",
	"35": "Ille-et-Vilaine",
	"36": "Indre",
	"37": "Indre-et-Loire",
	"38": "Isère",
	"39": "Jura",
	"40": "Landes",
	"41": "Loir-et-Cher",
	"42": "Loire",
	"43": "Haute-Loire",
	"44": "Loire-Atlantique",
	"45": "Loiret",
	"46": "Lot",
	"47": "Lot-et-Garonne",
	"48": "Lozère",
	"49": "Maine-et-Loire",
	"50": "Manche",
	"51": "Marne",
	"52": "Haute-Marne",
	"53": "Mayenne",
	"54": "Meurthe-et-Moselle",
	"55": "Meuse",
	"56": "Morbihan",
	"57": "Moselle",
	"58": "Nièvre",
	"59": "Nord",
	"60": "Oise",
	"61": "Orne",
	"62": "Pas-de-Calais",
	"63": "Puy-de-Dôme",
	"64": "Pyrénées-Atlantiques",
	"65": "Hautes-Pyrénées",
	"66": "Pyrénées-Orientales",
	"67": "Bas-Rhin",
	"68": "Haut-Rhin",
	"69": "Rhône",
	"70": "Haute-Saône",
	"71": "Saône-et-Loire",
	"72": "Sarthe",
	"73": "Savoie",
	"74": "Haute-Savoie",
	"75": "Paris",
	"76": "Seine-Maritime",
	"77": "Seine-et-Marne",
	"78": "Yvelines",
	"79": "Deux-Sèvres",
	"80": "Somme",
	"81": "Tarn",
	"82": "Tarn-et-Garonne",
	"83": "Var",
	"84": "Vaucluse",
	"85": "Vendée",
	"86": "Vienne",
	"87": "Haute-Vienne",
	"88": "Vosges",
	"89": "Yonne",
	"90": "Territoire de Belfort",
	"91": "Essonne",
	"92": "Hauts-de-Seine",
	"93": "Seine-Saint-Denis",
	"94": "Val-de-Marne",
	"95": "Val-d'Oise",
	"971": "Guadeloupe",
	"972": "Martinique",
	"973": "Guyane",
	"974": "La Réunion",
	"976": "Mayotte",
} as const;

export type CountyCode = keyof typeof COUNTIES;

export const COUNTY_CODES = Object.keys(COUNTIES) as [
	CountyCode,
	...CountyCode[],
];

export const REGIONS_TO_COUNTIES: Record<RegionCode, CountyCode[]> = {
	"84": [
		"01",
		"03",
		"07",
		"15",
		"26",
		"38",
		"42",
		"43",
		"63",
		"69",
		"73",
		"74",
	],
	"27": ["21", "25", "39", "58", "70", "71", "89", "90"],
	"53": ["35", "22", "56", "29"],
	"24": ["18", "28", "36", "37", "41", "45"],
	"94": ["2A", "2B"],
	"44": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
	"01": ["971"],
	"03": ["973"],
	"32": ["02", "59", "60", "62", "80"],
	"11": ["75", "77", "78", "91", "92", "93", "94", "95"],
	"04": ["974"],
	"06": ["976"],
	"02": ["972"],
	"28": ["14", "27", "50", "61", "76"],
	"75": [
		"16",
		"17",
		"19",
		"23",
		"24",
		"33",
		"40",
		"47",
		"64",
		"79",
		"86",
		"87",
	],
	"52": ["44", "49", "53", "72", "85"],
	"93": ["04", "05", "06", "13", "83", "84"],
	"76": [
		"09",
		"11",
		"12",
		"30",
		"31",
		"32",
		"34",
		"46",
		"48",
		"65",
		"66",
		"81",
		"82",
	],
};

export const COUNTY_TO_REGION = Object.fromEntries(
	Object.entries(REGIONS_TO_COUNTIES).flatMap(([regionCode, counties]) =>
		counties.map((countyCode) => [countyCode, regionCode as RegionCode]),
	),
) as Record<CountyCode, RegionCode>;

export function getRegionCodeFromCountyCode(
	countyCode: CountyCode | null | undefined,
): RegionCode | null {
	if (!countyCode) return null;
	return COUNTY_TO_REGION[countyCode] ?? null;
}

export function getCountyCodeFromPostalCode(
	postalCode: string | null | undefined,
): CountyCode | null {
	if (!postalCode) return null;
	const cp = postalCode.trim();
	if (!/^\d{5}$/.test(cp)) return null;

	let code: string;
	if (cp.startsWith("20")) {
		// Corsica shares postal prefix "20": Ajaccio side (< 20200) is 2A,
		// Bastia side is 2B.
		code = Number(cp) < 20200 ? "2A" : "2B";
	} else if (cp.startsWith("97") || cp.startsWith("98")) {
		// Overseas départements use a 3-digit code (971–976).
		code = cp.slice(0, 3);
	} else {
		code = cp.slice(0, 2);
	}

	return code in COUNTIES ? (code as CountyCode) : null;
}

export type CompanyLocation = {
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
};

export function getLocationFromPostalCode(
	postalCode: string | null | undefined,
): CompanyLocation {
	const departmentCode = getCountyCodeFromPostalCode(postalCode);
	if (!departmentCode) {
		return { region: null, departmentCode: null, departmentLabel: null };
	}
	const regionCode = getRegionCodeFromCountyCode(departmentCode);
	return {
		region: regionCode ? REGIONS[regionCode] : null,
		departmentCode,
		departmentLabel: COUNTIES[departmentCode],
	};
}
