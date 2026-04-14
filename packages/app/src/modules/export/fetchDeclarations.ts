// Types and pure functions for building the declaration JSON response.
// DB queries are in queries.ts (server-only, not unit-testable).

export type { DeclarationRow } from "./queries";
// Re-export queries for route handler convenience
export {
	fetchCseFilesByDeclaration,
	fetchCseOpinionsByDeclaration,
	fetchFileById,
	fetchFileBySiren,
	fetchIndicatorGByDeclaration,
	fetchJointEvaluationFilesByDeclaration,
	fetchSubmittedDeclarations,
} from "./queries";

import type { DeclarationRow } from "./queries";
import {
	INDICATOR_A_LABELS,
	INDICATOR_B_LABELS,
	INDICATOR_C_LABELS,
	INDICATOR_D_LABELS,
	INDICATOR_E_LABELS,
	INDICATOR_F_ANNUAL_MEN_LABELS,
	INDICATOR_F_ANNUAL_THRESHOLD_LABELS,
	INDICATOR_F_ANNUAL_WOMEN_LABELS,
	INDICATOR_F_HOURLY_MEN_LABELS,
	INDICATOR_F_HOURLY_THRESHOLD_LABELS,
	INDICATOR_F_HOURLY_WOMEN_LABELS,
	quartileProportion,
} from "./shared/apiLabels";

// ── Types ────────────────────────────────────────────────────────────

export type IndicatorGEntry = {
	categoryName: string;
	detail: string | null;
	declarationType: string;
	womenCount: number | null;
	menCount: number | null;
	annualBaseWomen: string | null;
	annualBaseMen: string | null;
	annualVariableWomen: string | null;
	annualVariableMen: string | null;
	hourlyBaseWomen: string | null;
	hourlyBaseMen: string | null;
	hourlyVariableWomen: string | null;
	hourlyVariableMen: string | null;
};

export type CseRow = {
	declarationNumber: number;
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

export type FileRow = {
	id: string;
	siren: string;
	year: number;
	fileName: string;
	filePath: string;
	uploadedAt: Date;
};

// ── Build indicators from declaration columns ─────────────────────────

export function buildIndicators(row: DeclarationRow) {
	const annualF: [number | null, number | null, number | null, number | null] =
		[
			row.indicatorFAnnualWomen1,
			row.indicatorFAnnualWomen2,
			row.indicatorFAnnualWomen3,
			row.indicatorFAnnualWomen4,
		];
	const annualM: [number | null, number | null, number | null, number | null] =
		[
			row.indicatorFAnnualMen1,
			row.indicatorFAnnualMen2,
			row.indicatorFAnnualMen3,
			row.indicatorFAnnualMen4,
		];
	const hourlyF: [number | null, number | null, number | null, number | null] =
		[
			row.indicatorFHourlyWomen1,
			row.indicatorFHourlyWomen2,
			row.indicatorFHourlyWomen3,
			row.indicatorFHourlyWomen4,
		];
	const hourlyM: [number | null, number | null, number | null, number | null] =
		[
			row.indicatorFHourlyMen1,
			row.indicatorFHourlyMen2,
			row.indicatorFHourlyMen3,
			row.indicatorFHourlyMen4,
		];

	const annualThresholds = [
		row.indicatorFAnnualThreshold1,
		row.indicatorFAnnualThreshold2,
		row.indicatorFAnnualThreshold3,
		row.indicatorFAnnualThreshold4,
	];
	const hourlyThresholds = [
		row.indicatorFHourlyThreshold1,
		row.indicatorFHourlyThreshold2,
		row.indicatorFHourlyThreshold3,
		row.indicatorFHourlyThreshold4,
	];

	const annualQuartile = Object.fromEntries(
		Array.from({ length: 4 }, (_, i) => {
			const women = annualF[i] ?? null;
			const men = annualM[i] ?? null;
			const total =
				women === null && men === null ? null : (women ?? 0) + (men ?? 0);
			return [
				[INDICATOR_F_ANNUAL_THRESHOLD_LABELS[i], annualThresholds[i] ?? null],
				[INDICATOR_F_ANNUAL_WOMEN_LABELS[i], quartileProportion(women, total)],
				[INDICATOR_F_ANNUAL_MEN_LABELS[i], quartileProportion(men, total)],
			];
		}).flat(),
	);

	const hourlyQuartile = Object.fromEntries(
		Array.from({ length: 4 }, (_, i) => {
			const women = hourlyF[i] ?? null;
			const men = hourlyM[i] ?? null;
			const total =
				women === null && men === null ? null : (women ?? 0) + (men ?? 0);
			return [
				[INDICATOR_F_HOURLY_THRESHOLD_LABELS[i], hourlyThresholds[i] ?? null],
				[INDICATOR_F_HOURLY_WOMEN_LABELS[i], quartileProportion(women, total)],
				[INDICATOR_F_HOURLY_MEN_LABELS[i], quartileProportion(men, total)],
			];
		}).flat(),
	);

	return {
		A: {
			[INDICATOR_A_LABELS.annualWomen]: row.indicatorAAnnualWomen,
			[INDICATOR_A_LABELS.annualMen]: row.indicatorAAnnualMen,
			[INDICATOR_A_LABELS.hourlyWomen]: row.indicatorAHourlyWomen,
			[INDICATOR_A_LABELS.hourlyMen]: row.indicatorAHourlyMen,
		},
		B: {
			[INDICATOR_B_LABELS.annualWomen]: row.indicatorBAnnualWomen,
			[INDICATOR_B_LABELS.annualMen]: row.indicatorBAnnualMen,
			[INDICATOR_B_LABELS.hourlyWomen]: row.indicatorBHourlyWomen,
			[INDICATOR_B_LABELS.hourlyMen]: row.indicatorBHourlyMen,
		},
		C: {
			[INDICATOR_C_LABELS.annualWomen]: row.indicatorCAnnualWomen,
			[INDICATOR_C_LABELS.annualMen]: row.indicatorCAnnualMen,
			[INDICATOR_C_LABELS.hourlyWomen]: row.indicatorCHourlyWomen,
			[INDICATOR_C_LABELS.hourlyMen]: row.indicatorCHourlyMen,
		},
		D: {
			[INDICATOR_D_LABELS.annualWomen]: row.indicatorDAnnualWomen,
			[INDICATOR_D_LABELS.annualMen]: row.indicatorDAnnualMen,
			[INDICATOR_D_LABELS.hourlyWomen]: row.indicatorDHourlyWomen,
			[INDICATOR_D_LABELS.hourlyMen]: row.indicatorDHourlyMen,
		},
		E: {
			[INDICATOR_E_LABELS.women]: row.indicatorEWomen,
			[INDICATOR_E_LABELS.men]: row.indicatorEMen,
		},
		F: {
			annuel: annualQuartile,
			horaire: hourlyQuartile,
		},
	};
}

// ── Indicator G entries ─────────────────────────────────────────────

function toIndicatorGCategory(entry: IndicatorGEntry) {
	return {
		Nom_categorie: entry.categoryName,
		Detail_categorie: entry.detail,
		Effectif_F: entry.womenCount,
		Effectif_H: entry.menCount,
		Rem_annuelle_base_F: entry.annualBaseWomen,
		Rem_annuelle_base_H: entry.annualBaseMen,
		Rem_annuelle_variable_F: entry.annualVariableWomen,
		Rem_annuelle_variable_H: entry.annualVariableMen,
		Taux_horaire_base_F: entry.hourlyBaseWomen,
		Taux_horaire_base_H: entry.hourlyBaseMen,
		Taux_horaire_variable_F: entry.hourlyVariableWomen,
		Taux_horaire_variable_H: entry.hourlyVariableMen,
	};
}

export function buildIndicatorG(entries: IndicatorGEntry[]) {
	return {
		initial: entries
			.filter((e) => e.declarationType === "initial")
			.map(toIndicatorGCategory),
		correction: entries
			.filter((e) => e.declarationType === "correction")
			.map(toIndicatorGCategory),
	};
}

// ── File payload helpers ────────────────────────────────────────────

/** English-keyed payload kept for the `/api/v1/files` listing endpoint. */
export function buildCseFilePayload(file: FileRow) {
	return {
		id: file.id,
		type: "cse_opinion" as const,
		fileName: file.fileName,
		uploadedAt: file.uploadedAt.toISOString(),
		downloadUrl: `/api/v1/files/${file.id}`,
	};
}

export function buildJointEvaluationFilePayload(file: FileRow) {
	return {
		id: file.id,
		type: "joint_evaluation" as const,
		fileName: file.fileName,
		uploadedAt: file.uploadedAt.toISOString(),
		downloadUrl: `/api/v1/files/${file.id}`,
	};
}

/** French-keyed payload for the SUIT declarations export. */
function buildFichierPayload(
	file: FileRow,
	type: "cse_opinion" | "joint_evaluation",
) {
	return {
		Id: file.id,
		Type: type,
		Nom_fichier: file.fileName,
		Date_upload: file.uploadedAt.toISOString(),
		URL_telechargement: `/api/v1/files/${file.id}`,
	};
}

function mostRecent(files: FileRow[]): FileRow | undefined {
	if (files.length === 0) return undefined;
	return [...files].sort(
		(a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
	)[0];
}

// ── Assemble declaration response ────────────────────────────────────

export function assembleDeclaration(
	row: DeclarationRow,
	indicatorGEntries: IndicatorGEntry[],
	opinions: CseRow[],
	cseFiles: FileRow[] = [],
	jointEvaluationFiles: FileRow[] = [],
) {
	const { initial, correction } = buildIndicatorG(indicatorGEntries);

	const hasCseFiles = cseFiles.length > 0;
	const jointEvaluationFile = mostRecent(jointEvaluationFiles);

	return {
		SIREN: row.siren,
		Raison_sociale: row.companyName,
		Effectif: row.workforce,
		Code_NAF: row.nafCode,
		Adresse: row.address,
		CSE_existant: row.hasCse,
		Annee: row.year,
		Statut: row.status,
		Parcours_conformite: row.compliancePath,
		Date_creation: row.createdAt?.toISOString() ?? null,
		Date_modification: row.updatedAt?.toISOString() ?? null,
		Effectif_F_rem_annuelle_globale: row.totalWomen,
		Effectif_H_rem_annuelle_globale: row.totalMen,
		Indicateurs: {
			...buildIndicators(row),
			G: initial.length > 0 ? initial : null,
		},
		Seconde_declaration: {
			Statut: row.secondDeclarationStatus,
			Periode_reference_debut: row.secondDeclReferencePeriodStart,
			Periode_reference_fin: row.secondDeclReferencePeriodEnd,
			Correction: correction.length > 0 ? correction : null,
		},
		Declarant: {
			Prenom: row.declarantFirstName,
			Nom: row.declarantLastName,
			Email: row.declarantEmail,
			Telephone: row.declarantPhone,
		},
		// CSE opinions only surface alongside the files they refer to; without
		// files, SUIT should not receive orphan opinion metadata.
		...(hasCseFiles && {
			Avis_CSE: opinions.map((o) => ({
				Numero_declaration: o.declarationNumber,
				Type: o.type,
				Avis: o.opinion,
				Date: o.opinionDate,
			})),
			Fichiers_CSE: cseFiles.map((f) => buildFichierPayload(f, "cse_opinion")),
		}),
		...(jointEvaluationFile && {
			Fichier_evaluation_conjointe: buildFichierPayload(
				jointEvaluationFile,
				"joint_evaluation",
			),
		}),
	};
}
