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

import {
	computeGapRatio,
	computeTotal,
	gapRatioToPercent,
	getObligationWorkforce,
	isComplianceProcessRequired,
	isComplianceProcessRevisionRequired,
	isCseRequired,
	isIndicatorGRequired,
	parseGipWorkforce,
	toDisplayWorkforce,
} from "~/modules/domain";
import type { DeclarationRow } from "./queries";
import {
	INDICATOR_A_GAP_LABELS,
	INDICATOR_A_LABELS,
	INDICATOR_B_GAP_LABELS,
	INDICATOR_B_LABELS,
	INDICATOR_C_GAP_LABELS,
	INDICATOR_C_LABELS,
	INDICATOR_D_GAP_LABELS,
	INDICATOR_D_LABELS,
	INDICATOR_E_LABELS,
	INDICATOR_E_PROPORTION_LABELS,
	INDICATOR_F_ANNUAL_MEN_LABELS,
	INDICATOR_F_ANNUAL_THRESHOLD_LABELS,
	INDICATOR_F_ANNUAL_WOMEN_LABELS,
	INDICATOR_F_HOURLY_MEN_LABELS,
	INDICATOR_F_HOURLY_THRESHOLD_LABELS,
	INDICATOR_F_HOURLY_WOMEN_LABELS,
} from "./shared/apiLabels";
import { getStatusHistoryLabel } from "./shared/statusHistoryLabels";

function deriveExportFlags(
	row: DeclarationRow,
	indicatorGEntries: IndicatorGEntry[],
): {
	complianceProcessRequired: boolean;
	complianceProcessRevisionRequired: boolean;
	indicatorGRequired: boolean;
} {
	const hasIndicatorG = indicatorGEntries.length > 0;
	const globalAnnualMeanGap = gapRatioToPercent(row.globalAnnualMeanGap);
	const variableAnnualMeanGap = gapRatioToPercent(row.variableAnnualMeanGap);
	const workforce = parseGipWorkforce(row.workforceEma);
	const complianceInput = {
		workforce,
		hasIndicatorG,
		gap: globalAnnualMeanGap,
	};
	const complianceProcessRequired =
		isComplianceProcessRequired(complianceInput);
	const complianceProcessRevisionRequired = isComplianceProcessRevisionRequired(
		{
			...complianceInput,
			correctionGap: variableAnnualMeanGap,
			events:
				row.secondDeclarationSubmittedAt === null
					? []
					: [
							{
								eventType: "second_declaration_submit",
								value: null,
								round: null,
								createdAt: row.secondDeclarationSubmittedAt,
								actorUserId: null,
							},
						],
		},
	);
	const indicatorGRequiredFlag = isIndicatorGRequired(
		getObligationWorkforce(workforce),
		row.year,
	);
	return {
		complianceProcessRequired,
		complianceProcessRevisionRequired,
		indicatorGRequired: indicatorGRequiredFlag,
	};
}

// ── Types ────────────────────────────────────────────────────────────

export type IndicatorGEntry = {
	categoryName: string;
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
	const annualQuartile = {
		[INDICATOR_F_ANNUAL_THRESHOLD_LABELS[0]]:
			row.indicatorFAnnualThreshold1 ?? null,
		[INDICATOR_F_ANNUAL_WOMEN_LABELS[0]]:
			row.annualQuartile1ProportionWomen ?? null,
		[INDICATOR_F_ANNUAL_MEN_LABELS[0]]:
			row.annualQuartile1ProportionMen ?? null,
		[INDICATOR_F_ANNUAL_THRESHOLD_LABELS[1]]:
			row.indicatorFAnnualThreshold2 ?? null,
		[INDICATOR_F_ANNUAL_WOMEN_LABELS[1]]:
			row.annualQuartile2ProportionWomen ?? null,
		[INDICATOR_F_ANNUAL_MEN_LABELS[1]]:
			row.annualQuartile2ProportionMen ?? null,
		[INDICATOR_F_ANNUAL_THRESHOLD_LABELS[2]]:
			row.indicatorFAnnualThreshold3 ?? null,
		[INDICATOR_F_ANNUAL_WOMEN_LABELS[2]]:
			row.annualQuartile3ProportionWomen ?? null,
		[INDICATOR_F_ANNUAL_MEN_LABELS[2]]:
			row.annualQuartile3ProportionMen ?? null,
		[INDICATOR_F_ANNUAL_WOMEN_LABELS[3]]:
			row.annualQuartile4ProportionWomen ?? null,
		[INDICATOR_F_ANNUAL_MEN_LABELS[3]]:
			row.annualQuartile4ProportionMen ?? null,
	};

	const hourlyQuartile = {
		[INDICATOR_F_HOURLY_THRESHOLD_LABELS[0]]:
			row.indicatorFHourlyThreshold1 ?? null,
		[INDICATOR_F_HOURLY_WOMEN_LABELS[0]]:
			row.hourlyQuartile1ProportionWomen ?? null,
		[INDICATOR_F_HOURLY_MEN_LABELS[0]]:
			row.hourlyQuartile1ProportionMen ?? null,
		[INDICATOR_F_HOURLY_THRESHOLD_LABELS[1]]:
			row.indicatorFHourlyThreshold2 ?? null,
		[INDICATOR_F_HOURLY_WOMEN_LABELS[1]]:
			row.hourlyQuartile2ProportionWomen ?? null,
		[INDICATOR_F_HOURLY_MEN_LABELS[1]]:
			row.hourlyQuartile2ProportionMen ?? null,
		[INDICATOR_F_HOURLY_THRESHOLD_LABELS[2]]:
			row.indicatorFHourlyThreshold3 ?? null,
		[INDICATOR_F_HOURLY_WOMEN_LABELS[2]]:
			row.hourlyQuartile3ProportionWomen ?? null,
		[INDICATOR_F_HOURLY_MEN_LABELS[2]]:
			row.hourlyQuartile3ProportionMen ?? null,
		[INDICATOR_F_HOURLY_WOMEN_LABELS[3]]:
			row.hourlyQuartile4ProportionWomen ?? null,
		[INDICATOR_F_HOURLY_MEN_LABELS[3]]:
			row.hourlyQuartile4ProportionMen ?? null,
	};

	return {
		A: {
			[INDICATOR_A_LABELS.annualWomen]: row.indicatorAAnnualWomen,
			[INDICATOR_A_LABELS.annualMen]: row.indicatorAAnnualMen,
			[INDICATOR_A_LABELS.hourlyWomen]: row.indicatorAHourlyWomen,
			[INDICATOR_A_LABELS.hourlyMen]: row.indicatorAHourlyMen,
			[INDICATOR_A_GAP_LABELS.annual]: row.globalAnnualMeanGap,
			[INDICATOR_A_GAP_LABELS.hourly]: row.globalHourlyMeanGap,
		},
		B: {
			[INDICATOR_B_LABELS.annualWomen]: row.indicatorBAnnualWomen,
			[INDICATOR_B_LABELS.annualMen]: row.indicatorBAnnualMen,
			[INDICATOR_B_LABELS.hourlyWomen]: row.indicatorBHourlyWomen,
			[INDICATOR_B_LABELS.hourlyMen]: row.indicatorBHourlyMen,
			[INDICATOR_B_GAP_LABELS.annual]: row.variableAnnualMeanGap,
			[INDICATOR_B_GAP_LABELS.hourly]: row.variableHourlyMeanGap,
		},
		C: {
			[INDICATOR_C_LABELS.annualWomen]: row.indicatorCAnnualWomen,
			[INDICATOR_C_LABELS.annualMen]: row.indicatorCAnnualMen,
			[INDICATOR_C_LABELS.hourlyWomen]: row.indicatorCHourlyWomen,
			[INDICATOR_C_LABELS.hourlyMen]: row.indicatorCHourlyMen,
			[INDICATOR_C_GAP_LABELS.annual]: row.globalAnnualMedianGap,
			[INDICATOR_C_GAP_LABELS.hourly]: row.globalHourlyMedianGap,
		},
		D: {
			[INDICATOR_D_LABELS.annualWomen]: row.indicatorDAnnualWomen,
			[INDICATOR_D_LABELS.annualMen]: row.indicatorDAnnualMen,
			[INDICATOR_D_LABELS.hourlyWomen]: row.indicatorDHourlyWomen,
			[INDICATOR_D_LABELS.hourlyMen]: row.indicatorDHourlyMen,
			[INDICATOR_D_GAP_LABELS.annual]: row.variableAnnualMedianGap,
			[INDICATOR_D_GAP_LABELS.hourly]: row.variableHourlyMedianGap,
		},
		E: {
			[INDICATOR_E_LABELS.women]: row.indicatorEWomen,
			[INDICATOR_E_LABELS.men]: row.indicatorEMen,
			[INDICATOR_E_PROPORTION_LABELS.women]: row.variableProportionWomen,
			[INDICATOR_E_PROPORTION_LABELS.men]: row.variableProportionMen,
		},
		F: {
			annuel: annualQuartile,
			horaire: hourlyQuartile,
		},
	};
}

// ── Indicator G entries ─────────────────────────────────────────────

function roundRatio(r: number | null): number | null {
	return r === null ? null : Math.round(r * 10000) / 10000;
}

function computeTotalGapRatio(
	baseW: string | null,
	varW: string | null,
	baseM: string | null,
	varM: string | null,
): number | null {
	const w = computeTotal(baseW ?? "", varW ?? "");
	const m = computeTotal(baseM ?? "", varM ?? "");
	if (w === null || m === null || m === 0) return null;
	return (m - w) / m;
}

function toIndicatorGCategory(entry: IndicatorGEntry) {
	const {
		annualBaseWomen: abW,
		annualBaseMen: abM,
		annualVariableWomen: avW,
		annualVariableMen: avM,
		hourlyBaseWomen: hbW,
		hourlyBaseMen: hbM,
		hourlyVariableWomen: hvW,
		hourlyVariableMen: hvM,
	} = entry;
	return {
		Nom_categorie: entry.categoryName,
		Effectif_F: entry.womenCount,
		Effectif_H: entry.menCount,
		Rem_annuelle_base_F: abW,
		Rem_annuelle_base_H: abM,
		Rem_annuelle_variable_F: avW,
		Rem_annuelle_variable_H: avM,
		Taux_horaire_base_F: hbW,
		Taux_horaire_base_H: hbM,
		Taux_horaire_variable_F: hvW,
		Taux_horaire_variable_H: hvM,
		Rem_annuelle_base_ecart: roundRatio(computeGapRatio(abW ?? "", abM ?? "")),
		Rem_annuelle_variable_ecart: roundRatio(
			computeGapRatio(avW ?? "", avM ?? ""),
		),
		Rem_annuelle_total_ecart: roundRatio(
			computeTotalGapRatio(abW, avW, abM, avM),
		),
		Taux_horaire_base_ecart: roundRatio(computeGapRatio(hbW ?? "", hbM ?? "")),
		Taux_horaire_variable_ecart: roundRatio(
			computeGapRatio(hvW ?? "", hvM ?? ""),
		),
		Taux_horaire_total_ecart: roundRatio(
			computeTotalGapRatio(hbW, hvW, hbM, hvM),
		),
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

	const flags = deriveExportFlags(row, indicatorGEntries);

	return {
		id: row.declarationId,
		SIREN: row.siren,
		Raison_sociale: row.companyName,
		Effectif: toDisplayWorkforce(parseGipWorkforce(row.workforceEma)),
		Code_NAF: row.nafCode,
		Adresse: row.address,
		// The CSE field only exists for companies at or above the CSE threshold; legacy sub-100 values are not exported.
		CSE_existant: isCseRequired(
			getObligationWorkforce(parseGipWorkforce(row.workforceEma)),
		)
			? row.hasCse
			: null,
		Annee: row.year,
		Statut: row.status,
		Parcours_apres_declaration_1: row.firstDeclarationPathChoice,
		Parcours_apres_declaration_2: row.secondDeclarationPathChoice,
		Parcours_de_conformite_requis: flags.complianceProcessRequired,
		Parcours_de_conformite_revision_requis:
			flags.complianceProcessRevisionRequired,
		Avis_CSE_requis: row.cseRequired,
		Indicateur_G_requis: flags.indicatorGRequired,
		Version_regles: row.rulesVersion,
		Date_creation: row.createdAt?.toISOString() ?? null,
		Date_modification: row.updatedAt?.toISOString() ?? null,
		Date_soumission: row.submittedAt?.toISOString() ?? null,
		Date_parcours_apres_declaration_1:
			row.firstDeclarationPathChoiceAt?.toISOString() ?? null,
		Date_parcours_apres_declaration_2:
			row.secondDeclarationPathChoiceAt?.toISOString() ?? null,
		Date_seconde_declaration:
			row.secondDeclarationSubmittedAt?.toISOString() ?? null,
		Date_evaluation_conjointe:
			row.jointEvaluationSubmittedAt?.toISOString() ?? null,
		Date_avis_CSE: row.cseOpinionCompletedAt?.toISOString() ?? null,
		Date_fin_demarche: row.demarcheCompletedAt?.toISOString() ?? null,
		Date_annulation: row.cancelledAt?.toISOString() ?? null,
		Historique_statuts: row.statusHistoryArray.map((entry) => {
			const base = {
				Statut: entry.eventType,
				Libelle_statut: getStatusHistoryLabel(entry.eventType, entry.value),
				Date: entry.createdAt,
			};
			return entry.eventType === "path_choice" && entry.round !== null
				? { ...base, Numero_declaration: entry.round }
				: base;
		}),
		Effectif_F_rem_annuelle_globale: row.totalWomen,
		Effectif_H_rem_annuelle_globale: row.totalMen,
		Indicateurs: {
			...buildIndicators(row),
			G: initial.length > 0 ? initial : null,
		},
		Seconde_declaration: {
			Statut: row.secondDeclarationSubmittedAt !== null,
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
