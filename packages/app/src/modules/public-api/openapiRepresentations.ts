import { formatCount } from "~/modules/domain";
import { MAX_EXPORT_ROWS, MAX_XLSX_EXPORT_ROWS } from "./exportLimits";
import {
	buildSearchParameters,
	errorResponse,
	serverErrorResponse,
} from "./openapiShared";

const REPRESENTATION_CSV_COLUMNS =
	"`Annee_declaration`, `SIREN`, `Raison_sociale`, `Adresse`, `Region`, `Code_departement`, `Departement`, `Pays`, `Code_NAF`, `Libelle_NAF`, `Effectif_annuel_moyen`, `Cadres_pourcentage_F`, `Cadres_pourcentage_H`, `Membres_pourcentage_F`, `Membres_pourcentage_H`";

function representationExportFilterParameters() {
	return buildSearchParameters({
		description:
			"Année de campagne de la représentation équilibrée (par exemple `2027` pour la déclaration portant sur l'année de référence 2026). Sans `year`, l'export couvre les 10 campagnes publiées les plus récentes.",
		example: 2027,
	}).filter(
		(parameter) => parameter.name !== "limit" && parameter.name !== "offset",
	);
}

const exportHeaders = {
	"Access-Control-Allow-Origin": {
		description: "Toutes les origines sont autorisées (`*`).",
		schema: { type: "string", example: "*" },
	},
} as const;

export const representationsPaths = {
	"/api/public/representations/export": {
		get: {
			operationId: "exportPublicRepresentations",
			summary:
				"Exporter les déclarations de représentation équilibrée publiées",
			description:
				"Retourne les déclarations de représentation équilibrée publiées, en CSV (`;` comme séparateur) ou en Excel. Aucun JSON n'est servi : `csv` est le format par défaut. Les filtres de la recherche de l'observatoire peuvent être repris. Le CSV avec `year` se télécharge sous `Indicateurs_representation_<annee>.csv`, sans `year` sous `indicateurs-representation.csv`. Seul l'export complet, sans filtre, en CSV est mis en cache 1 heure côté serveur.",
			parameters: [
				{
					name: "format",
					in: "query",
					required: false,
					description:
						"Format de sortie : `csv` (défaut) ou `xlsx`. Tout autre format renvoie `400`.",
					example: "csv",
					schema: {
						type: "string",
						enum: ["csv", "xlsx"],
						default: "csv",
					},
				},
				...representationExportFilterParameters(),
			],
			responses: {
				"200": {
					description:
						"Export des déclarations publiées. Le `Content-Type` dépend du format demandé.",
					headers: {
						...exportHeaders,
						"Content-Disposition": {
							description:
								"Nom du fichier téléchargé : `indicateurs-representation.csv` sans `year`, `Indicateurs_representation_<annee>.csv` avec, et `index-egapro-representations-equilibrees.xlsx` en Excel.",
							schema: { type: "string" },
						},
					},
					content: {
						"text/csv": {
							schema: {
								type: "string",
								description: `Fichier CSV avec en-tête et 15 colonnes DGT ordonnées : ${REPRESENTATION_CSV_COLUMNS}. \`Annee_declaration\` porte l'année de campagne, l'année de référence de la déclaration plus un. \`Effectif_annuel_moyen\` est l'effectif EMA du GIP-MDS pour l'année de référence, et reste vide s'il est inconnu. Les quatre pourcentages sont exprimés en pourcentage — tronqués à 2 décimales, point décimal, sans symbole \`%\` — et restent vides quand l'indicateur n'est pas calculable. Une donnée inconnue donne une cellule vide ; une identité masquée donne \`Non-diffusible\` sur la raison sociale, l'adresse, la région, le département, le pays et le NAF, tandis que le SIREN et les pourcentages restent visibles. Les colonnes de publication et les motifs de non-calculabilité ne figurent pas dans le fichier.`,
							},
						},
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
							{
								schema: { type: "string", format: "binary" },
							},
					},
				},
				"400": errorResponse("Paramètre `format` invalide."),
				"413": errorResponse(
					`Export trop volumineux : plus de ${formatCount(MAX_XLSX_EXPORT_ROWS)} lignes en Excel, ou plus de ${formatCount(MAX_EXPORT_ROWS)} lignes en CSV. Ajoutez des filtres, par exemple une année avec le paramètre \`year\`.`,
				),
				"500": serverErrorResponse,
				"503": errorResponse(
					"Trop d'exports en cours de calcul sur le serveur : réessayez après le délai indiqué par l'en-tête `Retry-After`.",
				),
			},
		},
	},
} as const;
