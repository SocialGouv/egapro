import { COUNTIES, REGIONS } from "~/modules/domain";

export type V1Company = {
	siren: string;
	raison_sociale: string;
	adresse?: string;
	code_naf?: string;
	région?: string;
	département?: string;
};

export type V1Indicator = {
	pourcentage_femmes_cadres?: number;
	pourcentage_hommes_cadres?: number;
	motif_non_calculabilité_cadres?: string;
	pourcentage_femmes_membres?: number;
	pourcentage_hommes_membres?: number;
	motif_non_calculabilité_membres?: string;
};

export type V1Publication = {
	date: string;
	url?: string;
	modalités?: string;
};

export type V1Data = {
	déclarant: { email: string; nom: string; prénom: string; téléphone: string };
	déclaration: {
		année_indicateurs: number;
		fin_période_référence: string;
		publication?: V1Publication;
	};
	entreprise: V1Company;
	indicateurs: { représentation_équilibrée: V1Indicator };
};

export type V1Row = {
	siren: string;
	year: number;
	declared_at: Date;
	modified_at: Date;
	data: V1Data;
};

export type MappedCompany = {
	siren: string;
	name: string;
	address: string | null;
	nafCode: string | null;
	region: string | null;
	regionCode: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	statutDiffusion: string | null;
};

export type MappedDeclaration = {
	siren: string;
	year: number;
	legacyDeclarant: {
		email: string;
		lastname: string;
		firstname: string;
		phone: string;
	};
	referencePeriodStart: string;
	referencePeriodEnd: string;
	executiveWomenPercent: number | null;
	executiveMenPercent: number | null;
	notComputableReasonExecutives: string | null;
	memberWomenPercent: number | null;
	memberMenPercent: number | null;
	notComputableReasonMembers: string | null;
	publishDate: string | null;
	publishUrl: string | null;
	publishModalities: string | null;
	submittedAt: Date;
	createdAt: Date;
	updatedAt: Date;
};

export type ImportError = {
	siren: string;
	year: number;
	cause: string;
};

export type ImportCounters = {
	total: number;
	imported: number;
	updated: number;
	skippedUpToDate: number;
	skippedNative: number;
	errors: ImportError[];
};

const NON_DIFFUSIBLE_MARKER = "[NON-DIFFUSIBLE]";

const REGION_LABELS: Record<string, string> = REGIONS;
const DEPARTMENT_LABELS: Record<string, string> = COUNTIES;

export function computeReferencePeriodStart(
	referencePeriodEnd: string,
): string {
	const start = new Date(`${referencePeriodEnd}T00:00:00.000Z`);
	if (referencePeriodEnd.endsWith("-02-29")) {
		return `${start.getUTCFullYear() - 1}-03-01`;
	}
	start.setUTCFullYear(start.getUTCFullYear() - 1);
	start.setUTCDate(start.getUTCDate() + 1);
	return start.toISOString().slice(0, 10);
}

export function mapCompanyFromV1(entreprise: V1Company): MappedCompany {
	const regionCode = entreprise.région ?? null;
	const departmentCode = entreprise.département ?? null;
	return {
		siren: entreprise.siren,
		name: entreprise.raison_sociale,
		address:
			entreprise.adresse === NON_DIFFUSIBLE_MARKER
				? null
				: (entreprise.adresse ?? null),
		nafCode:
			entreprise.code_naf && entreprise.code_naf !== NON_DIFFUSIBLE_MARKER
				? entreprise.code_naf
				: null,
		region: regionCode ? (REGION_LABELS[regionCode] ?? null) : null,
		regionCode: regionCode && REGION_LABELS[regionCode] ? regionCode : null,
		departmentCode,
		departmentLabel: departmentCode
			? (DEPARTMENT_LABELS[departmentCode] ?? null)
			: null,
		statutDiffusion:
			entreprise.raison_sociale === NON_DIFFUSIBLE_MARKER ? "N" : null,
	};
}

export function mapDeclarationFromV1(row: V1Row): MappedDeclaration {
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
