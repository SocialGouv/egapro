import { COUNTIES, REGIONS } from "~/modules/domain";

/**
 * @typedef {Object} V1Company
 * @property {string} siren
 * @property {string} raison_sociale
 * @property {string} [adresse]
 * @property {string} [code_naf]
 * @property {string} [région]
 * @property {string} [département]
 */

/**
 * @typedef {Object} V1Indicator
 * @property {number} [pourcentage_femmes_cadres]
 * @property {number} [pourcentage_hommes_cadres]
 * @property {string} [motif_non_calculabilité_cadres]
 * @property {number} [pourcentage_femmes_membres]
 * @property {number} [pourcentage_hommes_membres]
 * @property {string} [motif_non_calculabilité_membres]
 */

/**
 * @typedef {Object} V1Publication
 * @property {string} date
 * @property {string} [url]
 * @property {string} [modalités]
 */

/**
 * @typedef {Object} V1Data
 * @property {{ email: string, nom: string, prénom: string, téléphone: string }} déclarant
 * @property {{ année_indicateurs: number, fin_période_référence: string, publication?: V1Publication }} déclaration
 * @property {V1Company} entreprise
 * @property {{ représentation_équilibrée: V1Indicator }} indicateurs
 */

/**
 * @typedef {Object} V1Row
 * @property {string} siren
 * @property {number} year
 * @property {Date} declared_at
 * @property {Date} modified_at
 * @property {V1Data} data
 */

/**
 * @typedef {Object} MappedCompany
 * @property {string} siren
 * @property {string} name
 * @property {string | null} address
 * @property {string | null} nafCode
 * @property {string | null} region
 * @property {string | null} departmentCode
 * @property {string | null} departmentLabel
 */

/**
 * @typedef {Object} MappedDeclaration
 * @property {string} siren
 * @property {number} year
 * @property {{ email: string, lastname: string, firstname: string, phone: string }} legacyDeclarant
 * @property {string} referencePeriodStart
 * @property {string} referencePeriodEnd
 * @property {number | null} executiveWomenPercent
 * @property {number | null} executiveMenPercent
 * @property {string | null} notComputableReasonExecutives
 * @property {number | null} memberWomenPercent
 * @property {number | null} memberMenPercent
 * @property {string | null} notComputableReasonMembers
 * @property {string | null} publishDate
 * @property {string | null} publishUrl
 * @property {string | null} publishModalities
 * @property {Date} submittedAt
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} ImportError
 * @property {string} siren
 * @property {number} year
 * @property {string} cause
 */

/**
 * @typedef {Object} ImportCounters
 * @property {number} total
 * @property {number} imported
 * @property {number} updated
 * @property {number} skippedUpToDate
 * @property {number} skippedNative
 * @property {ImportError[]} errors
 */

const NON_DIFFUSIBLE_NAF = "[NON-DIFFUSIBLE]";

/** @type {Record<string, string>} */
const REGION_LABELS = REGIONS;
/** @type {Record<string, string>} */
const DEPARTMENT_LABELS = COUNTIES;

/**
 * @param {string} referencePeriodEnd
 * @returns {string}
 */
export function computeReferencePeriodStart(referencePeriodEnd) {
	const start = new Date(`${referencePeriodEnd}T00:00:00.000Z`);
	start.setUTCFullYear(start.getUTCFullYear() - 1);
	start.setUTCDate(start.getUTCDate() + 1);
	return start.toISOString().slice(0, 10);
}

/**
 * @param {V1Company} entreprise
 * @returns {MappedCompany}
 */
export function mapCompanyFromV1(entreprise) {
	const regionCode = entreprise.région ?? null;
	const departmentCode = entreprise.département ?? null;
	return {
		siren: entreprise.siren,
		name: entreprise.raison_sociale,
		address: entreprise.adresse ?? null,
		nafCode:
			entreprise.code_naf && entreprise.code_naf !== NON_DIFFUSIBLE_NAF
				? entreprise.code_naf
				: null,
		region: regionCode ? (REGION_LABELS[regionCode] ?? null) : null,
		departmentCode,
		departmentLabel: departmentCode
			? (DEPARTMENT_LABELS[departmentCode] ?? null)
			: null,
	};
}

/**
 * @param {V1Row} row
 * @returns {MappedDeclaration}
 */
export function mapDeclarationFromV1(row) {
	const indicator = row.data.indicateurs.représentation_équilibrée;
	const publication = row.data.déclaration.publication;
	const referencePeriodEnd = row.data.déclaration.fin_période_référence;

	return {
		siren: row.siren,
		year: row.year,
		legacyDeclarant: {
			email: row.data.déclarant.email,
			lastname: row.data.déclarant.nom,
			firstname: row.data.déclarant.prénom,
			phone: row.data.déclarant.téléphone,
		},
		referencePeriodStart: computeReferencePeriodStart(referencePeriodEnd),
		referencePeriodEnd,
		executiveWomenPercent: indicator.motif_non_calculabilité_cadres
			? null
			: (indicator.pourcentage_femmes_cadres ?? null),
		executiveMenPercent: indicator.motif_non_calculabilité_cadres
			? null
			: (indicator.pourcentage_hommes_cadres ?? null),
		notComputableReasonExecutives:
			indicator.motif_non_calculabilité_cadres ?? null,
		memberWomenPercent: indicator.motif_non_calculabilité_membres
			? null
			: (indicator.pourcentage_femmes_membres ?? null),
		memberMenPercent: indicator.motif_non_calculabilité_membres
			? null
			: (indicator.pourcentage_hommes_membres ?? null),
		notComputableReasonMembers:
			indicator.motif_non_calculabilité_membres ?? null,
		publishDate: publication?.date ?? null,
		publishUrl: publication?.url ?? null,
		publishModalities: publication?.modalités ?? null,
		submittedAt: row.declared_at,
		createdAt: row.declared_at,
		updatedAt: row.modified_at,
	};
}
