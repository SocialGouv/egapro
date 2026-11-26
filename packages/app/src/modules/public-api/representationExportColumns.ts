import type { CsvColumn } from "./publicCsvExport";
import type { PublicRepresentationDTO } from "./schemas";

export type RepresentationExportRow = PublicRepresentationDTO & {
	campaignYear: number;
	workforceEma: number | null;
};

export const REPRESENTATION_EXPORT_COLUMNS: CsvColumn<RepresentationExportRow>[] =
	[
		{ key: "campaignYear", header: "Annee_declaration" },
		{ key: "siren", header: "SIREN" },
		{ key: "name", header: "Raison_sociale" },
		{ key: "address", header: "Adresse" },
		{ key: "region", header: "Region" },
		{ key: "departmentCode", header: "Code_departement" },
		{ key: "departmentLabel", header: "Departement" },
		{ key: "countryLabel", header: "Pays" },
		{ key: "nafCode", header: "Code_NAF" },
		{ key: "nafLabel", header: "Libelle_NAF" },
		{ key: "workforceEma", header: "Effectif_annuel_moyen" },
		{ key: "executiveWomenPercent", header: "Cadres_pourcentage_F" },
		{ key: "executiveMenPercent", header: "Cadres_pourcentage_H" },
		{ key: "memberWomenPercent", header: "Membres_pourcentage_F" },
		{ key: "memberMenPercent", header: "Membres_pourcentage_H" },
	];

export const REPRESENTATION_XLSX_HEADERS: Array<keyof RepresentationExportRow> =
	REPRESENTATION_EXPORT_COLUMNS.map(({ key }) => key);
