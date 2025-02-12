import { times, upperFirst } from "lodash";

import { NAF, NAF_SECTIONS } from "./utils/naf";
import { type SimpleObject, type UnknownMapping } from "./utils/types";

// this is first year of egapro existance from where we can search declarations
export const FIRST_YEAR = 2018 as const;

export const FIRST_DECLARATION_YEAR = 2021 as const;

// this is oldest year of possible index declaration
export const FIRST_PUBLIC_YEAR = 2021 as const;
export const FIRST_YEAR_REPEQ = 2021 as const;

// TODO: move to a better place 👼
/**
 * Number of year where opmc can be modified after first add.
 * @todo Note: For 2022, first year of OPMC, we consider that the duration to be frozen is 2 years, but for next years, it will be 1 year like isFrozenDeclaration.
 */
export const OPMC_OPEN_DURATION_AFTER_EDIT = 2;

/** Need to be set manually because declaration are not opened on Jan 1rst */
export const CURRENT_YEAR = 2024 as const;
/** Need to be set */
export const PUBLIC_CURRENT_YEAR = 2023;
export const ALL_YEARS = times(CURRENT_YEAR - FIRST_YEAR + 1, idx => FIRST_YEAR + idx);
export const YEARS = times(CURRENT_YEAR - FIRST_DECLARATION_YEAR + 1, idx => FIRST_DECLARATION_YEAR + idx);
export const ADMIN_YEARS = times(CURRENT_YEAR - FIRST_YEAR + 1, idx => FIRST_YEAR + idx);
export const REPEQ_ADMIN_YEARS = times(CURRENT_YEAR - FIRST_YEAR_REPEQ + 1, idx => FIRST_YEAR_REPEQ + idx);
export const PUBLIC_YEARS = new Array(PUBLIC_CURRENT_YEAR - FIRST_PUBLIC_YEAR + 1)
  .fill(null)
  .map((_, idx) => FIRST_PUBLIC_YEAR + idx);

export const SEARCHABLE_YEARS = new Array(PUBLIC_CURRENT_YEAR - FIRST_YEAR + 1)
  .fill(null)
  .map((_, idx) => FIRST_YEAR + idx);

export const PUBLIC_YEARS_DESC = PUBLIC_YEARS.reverse();
export const YEARS_REPEQ = new Array(CURRENT_YEAR - FIRST_YEAR_REPEQ + 1)
  .fill(null)
  .map((_, idx) => FIRST_YEAR_REPEQ + idx);
export const PUBLIC_YEARS_REPEQ = new Array(PUBLIC_CURRENT_YEAR - FIRST_YEAR_REPEQ + 1)
  .fill(null)
  .map((_, idx) => FIRST_YEAR_REPEQ + idx);
export const PUBLIC_YEARS_REPEQ_DESC = PUBLIC_YEARS_REPEQ.reverse();

export const DISPLAY_CURRENT_YEAR = PUBLIC_CURRENT_YEAR + 1;
export const DISPLAY_PUBLIC_YEARS = PUBLIC_YEARS.map(y => y + 1);

export const INVALID_YEAR = 0 as const;

export const entrepriseTypes = {
  Entreprise: "entreprise",
  UES: "ues",
} as const;

export type EntrepriseTypes = typeof entrepriseTypes;

export type REGIONS = typeof REGIONS;
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

export const REGIONS_IDS = [
  "01",
  "02",
  "03",
  "04",
  "06",
  "11",
  "24",
  "27",
  "28",
  "32",
  "44",
  "52",
  "53",
  "75",
  "76",
  "84",
  "93",
  "94",
] as const;

export type COUNTIES = typeof COUNTIES;
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

export const COUNTIES_IDS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "2A",
  "2B",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "971",
  "972",
  "973",
  "974",
  "976",
] as const;

export const REGIONS_TO_COUNTIES: Record<keyof typeof REGIONS, Array<keyof typeof COUNTIES>> = {
  "84": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
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
  "75": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  "52": ["44", "49", "53", "72", "85"],
  "93": ["04", "05", "06", "13", "83", "84"],
  "76": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
};

export const COUNTY_TO_REGION = Object.entries(REGIONS_TO_COUNTIES).reduce(
  (accReg, [reg, counties]) => ({
    ...accReg,
    ...counties.reduce((accCounty, dep) => ({ ...accCounty, [dep]: reg }), {}),
  }),
  {} as Record<keyof typeof COUNTIES, keyof typeof REGIONS>,
);

export const inseeCodeToCounty = (code: string) => {
  const countyCode = code.substring(0, code.startsWith("97") ? 3 : 2) as keyof COUNTIES;
  if (COUNTIES[countyCode]) {
    return countyCode;
  }
  return null;
};

export const addressLabel = ({
  country,
  county,
  region,
}: {
  country?: string;
  county?: UnknownMapping | keyof typeof COUNTIES;
  region?: UnknownMapping | keyof typeof REGIONS;
}) => {
  if (country && country !== "FR") {
    const countryName = COUNTRIES_ISO_TO_LIB[country];

    if (countryName) return `${countryName.toLocaleLowerCase().split("-").map(upperFirst).join("-")}`;
  }

  let result = "";
  if (county && county in COUNTIES) {
    result = COUNTIES[county as keyof typeof COUNTIES];
  }
  if (region && region in REGIONS) {
    result += (county ? ", " : "") + REGIONS[region as keyof typeof REGIONS];
  }
  return result;
};

interface Country {
  COG: string;
  ISO2: string;
  LIB: string;
}
export const DEFAULT_COUNTRY_COG = "99100";
export const COUNTRIES = [
  { COG: "99101", ISO2: "DK", LIB: "DANEMARK" },
  { COG: "99102", ISO2: "IS", LIB: "ISLANDE" },
  { COG: "99103", ISO2: "NO", LIB: "NORVEGE" },
  { COG: "99104", ISO2: "SE", LIB: "SUEDE" },
  { COG: "99105", ISO2: "FI", LIB: "FINLANDE" },
  { COG: "99106", ISO2: "EE", LIB: "ESTONIE" },
  { COG: "99107", ISO2: "LV", LIB: "LETTONIE" },
  { COG: "99108", ISO2: "LT", LIB: "LITUANIE" },
  { COG: "99109", ISO2: "DE", LIB: "ALLEMAGNE" },
  { COG: "99110", ISO2: "AT", LIB: "AUTRICHE" },
  { COG: "99111", ISO2: "BG", LIB: "BULGARIE" },
  { COG: "99112", ISO2: "HU", LIB: "HONGRIE" },
  { COG: "99113", ISO2: "LI", LIB: "LIECHTENSTEIN" },
  { COG: "99114", ISO2: "RO", LIB: "ROUMANIE" },
  { COG: "99116", ISO2: "CZ", LIB: "TCHEQUIE" },
  { COG: "99117", ISO2: "SK", LIB: "SLOVAQUIE" },
  { COG: "99118", ISO2: "BA", LIB: "BOSNIE-HERZEGOVINE" },
  { COG: "99119", ISO2: "HR", LIB: "CROATIE" },
  { COG: "99120", ISO2: "ME", LIB: "MONTENEGRO" },
  { COG: "99121", ISO2: "RS", LIB: "SERBIE" },
  { COG: "99122", ISO2: "PL", LIB: "POLOGNE" },
  { COG: "99123", ISO2: "RU", LIB: "RUSSIE" },
  { COG: "99125", ISO2: "AL", LIB: "ALBANIE" },
  { COG: "99126", ISO2: "GR", LIB: "GRECE" },
  { COG: "99127", ISO2: "IT", LIB: "ITALIE" },
  { COG: "99128", ISO2: "SM", LIB: "SAINT-MARIN" },
  { COG: "99129", ISO2: "VA", LIB: "VATICAN, ou SAINT-SIEGE" },
  { COG: "99130", ISO2: "AD", LIB: "ANDORRE" },
  { COG: "99131", ISO2: "BE", LIB: "BELGIQUE" },
  { COG: "99132", ISO2: "GB", LIB: "ROYAUME-UNI" },
  { COG: "99134", ISO2: "ES", LIB: "ESPAGNE" },
  { COG: "99135", ISO2: "NL", LIB: "PAYS-BAS" },
  { COG: "99136", ISO2: "IE", LIB: "IRLANDE, ou EIRE" },
  { COG: "99137", ISO2: "LU", LIB: "LUXEMBOURG" },
  { COG: "99138", ISO2: "MC", LIB: "MONACO" },
  { COG: "99139", ISO2: "PT", LIB: "PORTUGAL" },
  { COG: "99140", ISO2: "CH", LIB: "SUISSE" },
  { COG: "99144", ISO2: "MT", LIB: "MALTE" },
  { COG: "99145", ISO2: "SI", LIB: "SLOVENIE" },
  { COG: "99148", ISO2: "BY", LIB: "BIELORUSSIE" },
  { COG: "99151", ISO2: "MD", LIB: "MOLDAVIE" },
  { COG: "99155", ISO2: "UA", LIB: "UKRAINE" },
  { COG: "99156", ISO2: "MK", LIB: "MACEDOINE DU NORD" },
  { COG: "99157", ISO2: "XK", LIB: "KOSOVO" },
  { COG: "99201", ISO2: "SA", LIB: "ARABIE SAOUDITE" },
  { COG: "99203", ISO2: "IQ", LIB: "IRAQ" },
  { COG: "99204", ISO2: "IR", LIB: "IRAN" },
  { COG: "99205", ISO2: "LB", LIB: "LIBAN" },
  { COG: "99206", ISO2: "SY", LIB: "SYRIE" },
  { COG: "99207", ISO2: "IL", LIB: "ISRAEL" },
  { COG: "99208", ISO2: "TR", LIB: "TURQUIE" },
  { COG: "99212", ISO2: "AF", LIB: "AFGHANISTAN" },
  { COG: "99213", ISO2: "PK", LIB: "PAKISTAN" },
  { COG: "99214", ISO2: "BT", LIB: "BHOUTAN" },
  { COG: "99215", ISO2: "NP", LIB: "NEPAL" },
  { COG: "99216", ISO2: "CN", LIB: "CHINE" },
  { COG: "99217", ISO2: "JP", LIB: "JAPON" },
  { COG: "99219", ISO2: "TH", LIB: "THAILANDE" },
  { COG: "99220", ISO2: "PH", LIB: "PHILIPPINES" },
  { COG: "99222", ISO2: "JO", LIB: "JORDANIE" },
  { COG: "99223", ISO2: "IN", LIB: "INDE" },
  { COG: "99224", ISO2: "MM", LIB: "BIRMANIE" },
  { COG: "99225", ISO2: "BN", LIB: "BRUNEI" },
  { COG: "99226", ISO2: "SG", LIB: "SINGAPOUR" },
  { COG: "99227", ISO2: "MY", LIB: "MALAISIE" },
  { COG: "99229", ISO2: "MV", LIB: "MALDIVES" },
  { COG: "99231", ISO2: "ID", LIB: "INDONESIE" },
  { COG: "99234", ISO2: "KH", LIB: "CAMBODGE" },
  { COG: "99235", ISO2: "LK", LIB: "SRI LANKA" },
  {
    COG: "99238",
    ISO2: "KP",
    LIB: "COREE (REPUBLIQUE POPULAIRE DEMOCRATIQUE DE)",
  },
  { COG: "99239", ISO2: "KR", LIB: "COREE (REPUBLIQUE DE)" },
  { COG: "99240", ISO2: "KW", LIB: "KOWEIT" },
  { COG: "99241", ISO2: "LA", LIB: "LAOS" },
  { COG: "99242", ISO2: "MN", LIB: "MONGOLIE" },
  { COG: "99243", ISO2: "VN", LIB: "VIET NAM" },
  { COG: "99246", ISO2: "BD", LIB: "BANGLADESH" },
  { COG: "99247", ISO2: "AE", LIB: "EMIRATS ARABES UNIS" },
  { COG: "99248", ISO2: "QA", LIB: "QATAR" },
  { COG: "99249", ISO2: "BH", LIB: "BAHREIN" },
  { COG: "99250", ISO2: "OM", LIB: "OMAN" },
  { COG: "99251", ISO2: "YE", LIB: "YEMEN" },
  { COG: "99252", ISO2: "AM", LIB: "ARMENIE" },
  { COG: "99253", ISO2: "AZ", LIB: "AZERBAIDJAN" },
  { COG: "99254", ISO2: "CY", LIB: "CHYPRE" },
  { COG: "99255", ISO2: "GE", LIB: "GEORGIE" },
  { COG: "99256", ISO2: "KZ", LIB: "KAZAKHSTAN" },
  { COG: "99257", ISO2: "KG", LIB: "KIRGHIZISTAN" },
  { COG: "99258", ISO2: "UZ", LIB: "OUZBEKISTAN" },
  { COG: "99259", ISO2: "TJ", LIB: "TADJIKISTAN" },
  { COG: "99260", ISO2: "TM", LIB: "TURKMENISTAN" },
  { COG: "99261", ISO2: "PS", LIB: "PALESTINE (Etat de)" },
  { COG: "99262", ISO2: "TL", LIB: "TIMOR ORIENTAL" },
  { COG: "99301", ISO2: "EG", LIB: "EGYPTE" },
  { COG: "99302", ISO2: "LR", LIB: "LIBERIA" },
  { COG: "99303", ISO2: "ZA", LIB: "AFRIQUE DU SUD" },
  { COG: "99304", ISO2: "GM", LIB: "GAMBIE" },
  { COG: "99309", ISO2: "TZ", LIB: "TANZANIE" },
  { COG: "99310", ISO2: "ZW", LIB: "ZIMBABWE" },
  { COG: "99311", ISO2: "NA", LIB: "NAMIBIE" },
  { COG: "99312", ISO2: "CD", LIB: "CONGO (REPUBLIQUE DEMOCRATIQUE)" },
  { COG: "99314", ISO2: "GQ", LIB: "GUINEE EQUATORIALE" },
  { COG: "99315", ISO2: "ET", LIB: "ETHIOPIE" },
  { COG: "99316", ISO2: "LY", LIB: "LIBYE" },
  { COG: "99317", ISO2: "ER", LIB: "ERYTHREE" },
  { COG: "99318", ISO2: "SO", LIB: "SOMALIE" },
  { COG: "99321", ISO2: "BI", LIB: "BURUNDI" },
  { COG: "99322", ISO2: "CM", LIB: "CAMEROUN" },
  { COG: "99323", ISO2: "CF", LIB: "CENTRAFRICAINE (REPUBLIQUE)" },
  { COG: "99324", ISO2: "CG", LIB: "CONGO" },
  { COG: "99326", ISO2: "CI", LIB: "COTE D'IVOIRE" },
  { COG: "99327", ISO2: "BJ", LIB: "BENIN" },
  { COG: "99328", ISO2: "GA", LIB: "GABON" },
  { COG: "99329", ISO2: "GH", LIB: "GHANA" },
  { COG: "99330", ISO2: "GN", LIB: "GUINEE" },
  { COG: "99331", ISO2: "BF", LIB: "BURKINA" },
  { COG: "99332", ISO2: "KE", LIB: "KENYA" },
  { COG: "99333", ISO2: "MG", LIB: "MADAGASCAR" },
  { COG: "99334", ISO2: "MW", LIB: "MALAWI" },
  { COG: "99335", ISO2: "ML", LIB: "MALI" },
  { COG: "99336", ISO2: "MR", LIB: "MAURITANIE" },
  { COG: "99337", ISO2: "NE", LIB: "NIGER" },
  { COG: "99338", ISO2: "NG", LIB: "NIGERIA" },
  { COG: "99339", ISO2: "UG", LIB: "OUGANDA" },
  { COG: "99340", ISO2: "RW", LIB: "RWANDA" },
  { COG: "99341", ISO2: "SN", LIB: "SENEGAL" },
  { COG: "99342", ISO2: "SL", LIB: "SIERRA LEONE" },
  { COG: "99343", ISO2: "SD", LIB: "SOUDAN" },
  { COG: "99344", ISO2: "TD", LIB: "TCHAD" },
  { COG: "99345", ISO2: "TG", LIB: "TOGO" },
  { COG: "99346", ISO2: "ZM", LIB: "ZAMBIE" },
  { COG: "99347", ISO2: "BW", LIB: "BOTSWANA" },
  { COG: "99348", ISO2: "LS", LIB: "LESOTHO" },
  { COG: "99349", ISO2: "SS", LIB: "SOUDAN DU SUD" },
  { COG: "99350", ISO2: "MA", LIB: "MAROC" },
  { COG: "99351", ISO2: "TN", LIB: "TUNISIE" },
  { COG: "99352", ISO2: "DZ", LIB: "ALGERIE" },
  { COG: "99390", ISO2: "MU", LIB: "MAURICE" },
  { COG: "99391", ISO2: "SZ", LIB: "ESWATINI" },
  { COG: "99392", ISO2: "GW", LIB: "GUINEE-BISSAU" },
  { COG: "99393", ISO2: "MZ", LIB: "MOZAMBIQUE" },
  { COG: "99394", ISO2: "ST", LIB: "SAO TOME-ET-PRINCIPE" },
  { COG: "99395", ISO2: "AO", LIB: "ANGOLA" },
  { COG: "99396", ISO2: "CV", LIB: "CAP-VERT" },
  { COG: "99397", ISO2: "KM", LIB: "COMORES" },
  { COG: "99398", ISO2: "SC", LIB: "SEYCHELLES" },
  { COG: "99399", ISO2: "DJ", LIB: "DJIBOUTI" },
  { COG: "99401", ISO2: "CA", LIB: "CANADA" },
  { COG: "99404", ISO2: "US", LIB: "ETATS-UNIS" },
  { COG: "99405", ISO2: "MX", LIB: "MEXIQUE" },
  { COG: "99406", ISO2: "CR", LIB: "COSTA RICA" },
  { COG: "99407", ISO2: "CU", LIB: "CUBA" },
  { COG: "99408", ISO2: "DO", LIB: "DOMINICAINE (REPUBLIQUE)" },
  { COG: "99409", ISO2: "GT", LIB: "GUATEMALA" },
  { COG: "99410", ISO2: "HT", LIB: "HAITI" },
  { COG: "99411", ISO2: "HN", LIB: "HONDURAS" },
  { COG: "99412", ISO2: "NI", LIB: "NICARAGUA" },
  { COG: "99413", ISO2: "PA", LIB: "PANAMA" },
  { COG: "99414", ISO2: "SV", LIB: "EL SALVADOR" },
  { COG: "99415", ISO2: "AR", LIB: "ARGENTINE" },
  { COG: "99416", ISO2: "BR", LIB: "BRESIL" },
  { COG: "99417", ISO2: "CL", LIB: "CHILI" },
  { COG: "99418", ISO2: "BO", LIB: "BOLIVIE" },
  { COG: "99419", ISO2: "CO", LIB: "COLOMBIE" },
  { COG: "99420", ISO2: "EC", LIB: "EQUATEUR" },
  { COG: "99421", ISO2: "PY", LIB: "PARAGUAY" },
  { COG: "99422", ISO2: "PE", LIB: "PEROU" },
  { COG: "99423", ISO2: "UY", LIB: "URUGUAY" },
  { COG: "99424", ISO2: "VE", LIB: "VENEZUELA" },
  { COG: "99426", ISO2: "JM", LIB: "JAMAIQUE" },
  { COG: "99428", ISO2: "GY", LIB: "GUYANA" },
  { COG: "99429", ISO2: "BZ", LIB: "BELIZE" },
  { COG: "99433", ISO2: "TT", LIB: "TRINITE-ET-TOBAGO" },
  { COG: "99434", ISO2: "BB", LIB: "BARBADE" },
  { COG: "99435", ISO2: "GD", LIB: "GRENADE" },
  { COG: "99436", ISO2: "BS", LIB: "BAHAMAS" },
  { COG: "99437", ISO2: "SR", LIB: "SURINAME" },
  { COG: "99438", ISO2: "DM", LIB: "DOMINIQUE" },
  { COG: "99439", ISO2: "LC", LIB: "SAINTE-LUCIE" },
  { COG: "99440", ISO2: "VC", LIB: "SAINT-VINCENT-ET-LES GRENADINES" },
  { COG: "99441", ISO2: "AG", LIB: "ANTIGUA-ET-BARBUDA" },
  { COG: "99442", ISO2: "KN", LIB: "SAINT-CHRISTOPHE-ET-NIEVES" },
  { COG: "99443", ISO2: "BQ", LIB: "BONAIRE, SAINT EUSTACHE ET SABA" },
  { COG: "99444", ISO2: "CW", LIB: "CURAÇAO" },
  { COG: "99445", ISO2: "SX", LIB: "SAINT-MARTIN (PARTIE NEERLANDAISE)" },
  { COG: "99501", ISO2: "AU", LIB: "AUSTRALIE" },
  { COG: "99502", ISO2: "NZ", LIB: "NOUVELLE-ZELANDE" },
  { COG: "99506", ISO2: "WS", LIB: "SAMOA OCCIDENTALES" },
  { COG: "99507", ISO2: "NR", LIB: "NAURU" },
  { COG: "99508", ISO2: "FJ", LIB: "FIDJI" },
  { COG: "99509", ISO2: "TO", LIB: "TONGA" },
  { COG: "99510", ISO2: "PG", LIB: "PAPOUASIE-NOUVELLE-GUINEE" },
  { COG: "99511", ISO2: "TV", LIB: "TUVALU" },
  { COG: "99512", ISO2: "SB", LIB: "SALOMON (ILES)" },
  { COG: "99513", ISO2: "KI", LIB: "KIRIBATI" },
  { COG: "99514", ISO2: "VU", LIB: "VANUATU" },
  { COG: "99515", ISO2: "MH", LIB: "MARSHALL (ILES)" },
  { COG: "99516", ISO2: "FM", LIB: "MICRONESIE (ETATS FEDERES DE)" },
  { COG: "99517", ISO2: "PW", LIB: "PALAOS (ILES)" },
  { COG: DEFAULT_COUNTRY_COG, ISO2: "FR", LIB: "FRANCE" },
] as const satisfies readonly Country[];

export type CountryIsoCode = (typeof COUNTRIES)[number]["ISO2"];

export const COUNTRIES_COG_TO_ISO: SimpleObject<CountryIsoCode> = COUNTRIES.reduce(
  (acc, country) => ({ ...acc, [country.COG]: country.ISO2 }),
  {},
);

export const COUNTRIES_COG_TO_LIB: SimpleObject<string> = COUNTRIES.reduce(
  (acc, country) => ({ ...acc, [country.COG]: country.LIB }),
  {},
);

export const COUNTRIES_ISO_TO_LIB: SimpleObject<string> = COUNTRIES.reduce(
  (acc, country) => ({ ...acc, [country.ISO2]: country.LIB }),
  {},
);

export { NAF, NAF_SECTIONS };

const sort = (dict: SimpleObject<string>) => Object.entries(dict).sort((a, b) => a[1].localeCompare(b[1]));
export const SORTED_COUNTIES = sort(COUNTIES);
export const SORTED_REGIONS = sort(REGIONS);
export const SORTED_NAF_SECTIONS = sort(NAF_SECTIONS);

export const FULL_SORTED_REGIONS_TO_COUNTIES = Object.fromEntries(
  Object.entries(REGIONS_TO_COUNTIES).map(([regionId, counties]) => [
    regionId,
    SORTED_COUNTIES.filter(([countyId]) => counties.includes(countyId as (typeof COUNTIES_IDS)[number])),
  ]),
) as Record<(typeof REGIONS_IDS)[number], Array<[string, string]>>;
