import {
	DATA_GOUV_REMUNERATION_DATASET_URL,
	DATA_GOUV_REPRESENTATION_DATASET_URL,
} from "./constants";
import {
	declarationsPaths,
	publicDeclarationSchema,
} from "./openapiDeclarations";
import { errorSchema } from "./openapiShared";

export const publicOpenApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "EGAPRO — API publique",
		description: `API publique limitée à l'export des indicateurs de rémunération A à F des déclarations d'index égalité professionnelle.

**Données publiques complètes** : les jeux de données publiés sur data.gouv.fr couvrent l'index égalité professionnelle ([Index égalité professionnelle F/H des entreprises de 50 salariés ou plus](${DATA_GOUV_REMUNERATION_DATASET_URL})) et la représentation équilibrée ([Représentation équilibrée F/H dans les postes de direction des grandes entreprises](${DATA_GOUV_REPRESENTATION_DATASET_URL})).

**Modèle de données brutes** : cette API expose uniquement les données brutes calculées par le GIP-MDS à partir des DSN (écarts de rémunération, proportions, répartitions par quartile, effectifs). Aucun score ni indice global /100 n'est exposé.

**Indicateur G exclu** : l'indicateur G (écart de rémunération déclaré par l'entreprise par catégorie socio-professionnelle) n'est pas exposé par cette API.

**Identité des entreprises non diffusibles masquée** : pour les entreprises dont le statut de diffusion est non diffusible (\`statutDiffusion === 'N'\`), tous les champs d'identité, de localisation et d'activité valent \`Non-diffusible\`. Le SIREN, l'effectif EMA et les indicateurs restent disponibles.

**Accès et quotas** : l'API est accessible anonymement (120 appels/minute). Un jeton Bearer optionnel configuré par EgaPro porte le quota à 1 200 appels/minute.

**Gate par date de rendu public** : seules les déclarations dont l'année correspond à une campagne dont la date de rendu public est atteinte sont servies. Les données d'une campagne en cours ou dont la date de publication n'est pas encore passée ne sont pas exposées.`,
		version: "2.0.0",
		contact: {
			name: "Équipe EGAPRO — DNUM",
		},
		license: {
			name: "Etalab 2.0",
			url: "https://www.etalab.gouv.fr/licence-ouverte-open-licence",
		},
	},
	servers: [{ url: "/" }],
	components: {
		securitySchemes: {
			optionalBearer: { type: "http", scheme: "bearer" },
		},
		schemas: {
			PublicDeclaration: publicDeclarationSchema,
			Error: errorSchema,
		},
	},
	paths: declarationsPaths,
	security: [{}, { optionalBearer: [] }],
} as const;
