import {
	declarationsPaths,
	publicDeclarationSchema,
	publicSearchResultSchema,
} from "./openapiDeclarations";
import {
	publicRepresentationSchema,
	publicRepresentationSearchResultSchema,
	representationsPaths,
} from "./openapiRepresentations";
import { errorSchema } from "./openapiShared";

export const publicOpenApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "EGAPRO — API publique",
		description: `API publique de consultation des déclarations d'index égalité professionnelle.

**Modèle de données brutes** : cette API expose uniquement les données brutes calculées par le GIP-MDS à partir des DSN (écarts de rémunération, proportions, répartitions par quartile, effectifs). Aucun score ni indice global /100 n'est exposé.

**Indicateur G exclu** : l'indicateur G (écart de rémunération déclaré par l'entreprise par catégorie socio-professionnelle) n'est pas exposé par cette API.

**Identité des entreprises non diffusibles masquée** : pour les entreprises dont le statut de diffusion est non diffusible (\`statutDiffusion === 'N'\`), les champs d'identité (\`name\`, \`address\`, \`region\`, \`departmentCode\`, \`departmentLabel\`, \`nafCode\`, \`nafLabel\`) sont retournés à \`null\`. Le SIREN, l'effectif EMA et les indicateurs A–F restent disponibles.

**Gate par date de rendu public** : seules les déclarations dont l'année correspond à une campagne dont la date de rendu public est atteinte sont servies. Les données d'une campagne en cours ou dont la date de publication n'est pas encore passée ne sont pas exposées.`,
		version: "1.0.0",
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
		schemas: {
			PublicDeclaration: publicDeclarationSchema,
			PublicSearchResult: publicSearchResultSchema,
			PublicRepresentation: publicRepresentationSchema,
			PublicRepresentationSearchResult: publicRepresentationSearchResultSchema,
			Error: errorSchema,
		},
	},
	paths: {
		...declarationsPaths,
		...representationsPaths,
	},
} as const;
