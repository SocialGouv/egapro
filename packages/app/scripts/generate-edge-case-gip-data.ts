/**
 * Generate a mock GIP MDS CSV file with edge case data for testing.
 *
 * Usage:
 *   npx tsx scripts/generate-edge-case-gip-data.ts
 *
 * Each row targets a specific edge case identified from the DGT Excel spec.
 * SIRENs are hardcoded fakes (not from companies.json) to avoid conflicts
 * with the main mock file.
 *
 * Output: data/mock-gip-mds-edge-cases.csv
 */

// ── Formatting helpers ────────────────────────────────────────────

function fmt2(n: number): string {
	return n.toFixed(2).replace(".", ",");
}

function fmt4(n: number): string {
	return n.toFixed(4).replace(".", ",");
}

/** Empty string = null in CSV (field present but empty). */
const NULL = "";

// ── CSV structure ─────────────────────────────────────────────────

const HEADERS = [
	"SIREN",
	"Effectif_RCD",
	"Effectif_H_rem_annuelle_globale",
	"Effectif_F_rem_annuelle_globale",
	"Effectif_H_taux_horaire_global",
	"Effectif_F_taux_horaire_global",
	"Effectif_H_rem_annuelle_variable",
	"Effectif_F_rem_annuelle_variable",
	"Rem_globale_annuelle_moyenne_ecart",
	"Rem_globale_annuelle_moyenne_F",
	"Rem_globale_annuelle_moyenne_H",
	"Taux_horaire_global_moyen_ecart",
	"Taux_horaire_global_moyen_F",
	"Taux_horaire_global_moyen_H",
	"Rem_variable_annuelle_moyenne_ecart",
	"Rem_variable_annuelle_moyenne_F",
	"Rem_variable_annuelle_moyenne_H",
	"Taux_horaire_variable_moyen_ecart",
	"Taux_horaire_variable_moyen_F",
	"Taux_horaire_variable_moyen_H",
	"Rem_globale_annuelle_médiane_ecart",
	"Rem_globale_annuelle_médiane_F",
	"Rem_globale_annuelle_médiane_H",
	"Taux_horaire_global_médian_ecart",
	"Taux_globale_annuelle_médiane_F",
	"Taux_globale_annuelle_médiane_H",
	"Rem_variable_annuelle_médiane_ecart",
	"Rem_variable_annuelle_médiane_F",
	"Rem_variable_annuelle_médiane_H",
	"Taux_horaire_variable_médian_ecart",
	"Taux_horaire_variable_médian_F ",
	"Taux_horaire_variable_médian_H",
	"Proportion_variable_F",
	"Proportion_variable_H",
	"Seuil_Q1_Rem_globale",
	"Seuil_Q2_Rem_globale",
	"Seuil_Q3_Rem_globale",
	"Seuil_Q4_Rem_globale",
	"Quartile1_Rem_globale_annuelle_proportion_F",
	"Quartile2_Rem_globale_annuelle_proportion_F",
	"Quartile3_Rem_globale_annuelle_proportion_F",
	"Quartile4_Rem_globale_annuelle_proportion_F",
	"Quartile1_Rem_globale_annuelle_proportion_H",
	"Quartile2_Rem_globale_annuelle_proportion_H",
	"Quartile3_Rem_globale_annuelle_proportion_H",
	"Quartile4_Rem_globale_annuelle_proportion_H",
	"Seuil_Q1_Taux_horaire_global",
	"Seuil_Q2_Taux_horaire_global",
	"Seuil_Q3_Taux_horaire_global",
	"Seuil_Q4_Taux_horaire_global",
	"Quartile1_Taux_horaire_global_proportion_F",
	"Quartile2_Taux_horaire_global_proportion_F",
	"Quartile3_Taux_horaire_global_proportion_F",
	"Quartile4_Taux_horaire_global_proportion_F",
	"Quartile1_Taux_horaire_global_proportion_H",
	"Quartile2_Taux_horaire_global_proportion_H",
	"Quartile3_Taux_horaire_global_proportion_H",
	"Quartile4_Taux_horaire_global_proportion_H",
	"indice",
	"indice_nature_exo",
	"indice_unite",
	"indice_ratio_suspensions",
	"indice_suspensions_longues",
	"indice_suspensions_sans_fin",
	"indice_ratio_arrets",
	"indice_arrets_longs",
	"indice_arrets_0",
	"indice_quotite250",
	"indice_quotite0",
	"indice_sup_annee_civile",
	"indice_ratio_FP",
	"indice_rem_extremes",
	"indice_taux_extremes",
];

// ── Reusable row builder ──────────────────────────────────────────

/** Default "normal" row values — can be selectively overridden per edge case. */
function baseRow(siren: string, ema: string): Record<string, string> {
	return {
		SIREN: siren,
		Effectif_RCD: ema,
		Effectif_H_rem_annuelle_globale: "100",
		Effectif_F_rem_annuelle_globale: "80",
		Effectif_H_taux_horaire_global: "95",
		Effectif_F_taux_horaire_global: "75",
		Effectif_H_rem_annuelle_variable: "60",
		Effectif_F_rem_annuelle_variable: "45",
		// Indicator A — Global mean
		Rem_globale_annuelle_moyenne_ecart: fmt4(0.05),
		Rem_globale_annuelle_moyenne_F: fmt2(35000),
		Rem_globale_annuelle_moyenne_H: fmt2(36842.11),
		Taux_horaire_global_moyen_ecart: fmt4(0.05),
		Taux_horaire_global_moyen_F: fmt2(19.23),
		Taux_horaire_global_moyen_H: fmt2(20.24),
		// Indicator B — Variable mean
		Rem_variable_annuelle_moyenne_ecart: fmt4(0.1),
		Rem_variable_annuelle_moyenne_F: fmt2(900),
		Rem_variable_annuelle_moyenne_H: fmt2(1000),
		Taux_horaire_variable_moyen_ecart: fmt4(0.1),
		Taux_horaire_variable_moyen_F: fmt2(0.49),
		Taux_horaire_variable_moyen_H: fmt2(0.55),
		// Indicator C — Global median
		Rem_globale_annuelle_médiane_ecart: fmt4(0.04),
		Rem_globale_annuelle_médiane_F: fmt2(34000),
		Rem_globale_annuelle_médiane_H: fmt2(35416.67),
		Taux_horaire_global_médian_ecart: fmt4(0.04),
		Taux_globale_annuelle_médiane_F: fmt2(18.68),
		Taux_globale_annuelle_médiane_H: fmt2(19.46),
		// Indicator D — Variable median
		Rem_variable_annuelle_médiane_ecart: fmt4(0.08),
		Rem_variable_annuelle_médiane_F: fmt2(850),
		Rem_variable_annuelle_médiane_H: fmt2(923.91),
		Taux_horaire_variable_médian_ecart: fmt4(0.08),
		"Taux_horaire_variable_médian_F ": fmt2(0.47),
		Taux_horaire_variable_médian_H: fmt2(0.51),
		// Indicator E
		Proportion_variable_F: fmt4(0.5625),
		Proportion_variable_H: fmt4(0.6),
		// Indicator F — Annual
		Seuil_Q1_Rem_globale: fmt2(25000),
		Seuil_Q2_Rem_globale: fmt2(32000),
		Seuil_Q3_Rem_globale: fmt2(40000),
		Seuil_Q4_Rem_globale: fmt2(55000),
		Quartile1_Rem_globale_annuelle_proportion_F: fmt4(0.55),
		Quartile2_Rem_globale_annuelle_proportion_F: fmt4(0.48),
		Quartile3_Rem_globale_annuelle_proportion_F: fmt4(0.4),
		Quartile4_Rem_globale_annuelle_proportion_F: fmt4(0.35),
		Quartile1_Rem_globale_annuelle_proportion_H: fmt4(0.45),
		Quartile2_Rem_globale_annuelle_proportion_H: fmt4(0.52),
		Quartile3_Rem_globale_annuelle_proportion_H: fmt4(0.6),
		Quartile4_Rem_globale_annuelle_proportion_H: fmt4(0.65),
		// Indicator F — Hourly
		Seuil_Q1_Taux_horaire_global: fmt2(13.74),
		Seuil_Q2_Taux_horaire_global: fmt2(17.58),
		Seuil_Q3_Taux_horaire_global: fmt2(21.98),
		Seuil_Q4_Taux_horaire_global: fmt2(30.22),
		Quartile1_Taux_horaire_global_proportion_F: fmt4(0.54),
		Quartile2_Taux_horaire_global_proportion_F: fmt4(0.47),
		Quartile3_Taux_horaire_global_proportion_F: fmt4(0.39),
		Quartile4_Taux_horaire_global_proportion_F: fmt4(0.34),
		Quartile1_Taux_horaire_global_proportion_H: fmt4(0.46),
		Quartile2_Taux_horaire_global_proportion_H: fmt4(0.53),
		Quartile3_Taux_horaire_global_proportion_H: fmt4(0.61),
		Quartile4_Taux_horaire_global_proportion_H: fmt4(0.66),
		// Confidence
		indice: fmt4(0.75),
		indice_nature_exo: fmt4(0.1),
		indice_unite: fmt4(0.05),
		indice_ratio_suspensions: fmt4(0.08),
		indice_suspensions_longues: fmt4(0.02),
		indice_suspensions_sans_fin: fmt4(0.01),
		indice_ratio_arrets: fmt4(0.06),
		indice_arrets_longs: fmt4(0.03),
		indice_arrets_0: fmt4(0.02),
		indice_quotite250: fmt4(0.04),
		indice_quotite0: fmt4(0.03),
		indice_sup_annee_civile: fmt4(0.05),
		indice_ratio_FP: fmt4(0.07),
		indice_rem_extremes: fmt4(0.02),
		indice_taux_extremes: fmt4(0.01),
	};
}

/** Convert a row record to CSV line in header order. */
function toLine(row: Record<string, string>): string {
	return HEADERS.map((h) => row[h] ?? NULL).join(";");
}

// ── Edge case definitions ─────────────────────────────────────────

type EdgeCase = {
	description: string;
	siren: string;
	overrides: Record<string, string>;
	ema?: string;
};

const edgeCases: EdgeCase[] = [
	// #1 — SIREN starting with 0
	{
		description: "SIREN starting with 0",
		siren: "012345678",
		overrides: {},
		ema: fmt2(200),
	},

	// #2 — All indicators null (only SIREN + EMA filled)
	{
		description: "All indicators null — only SIREN + EMA",
		siren: "098765432",
		ema: fmt2(180),
		overrides: {
			Effectif_H_rem_annuelle_globale: NULL,
			Effectif_F_rem_annuelle_globale: NULL,
			Effectif_H_taux_horaire_global: NULL,
			Effectif_F_taux_horaire_global: NULL,
			Effectif_H_rem_annuelle_variable: NULL,
			Effectif_F_rem_annuelle_variable: NULL,
			Rem_globale_annuelle_moyenne_ecart: NULL,
			Rem_globale_annuelle_moyenne_F: NULL,
			Rem_globale_annuelle_moyenne_H: NULL,
			Taux_horaire_global_moyen_ecart: NULL,
			Taux_horaire_global_moyen_F: NULL,
			Taux_horaire_global_moyen_H: NULL,
			Rem_variable_annuelle_moyenne_ecart: NULL,
			Rem_variable_annuelle_moyenne_F: NULL,
			Rem_variable_annuelle_moyenne_H: NULL,
			Taux_horaire_variable_moyen_ecart: NULL,
			Taux_horaire_variable_moyen_F: NULL,
			Taux_horaire_variable_moyen_H: NULL,
			Rem_globale_annuelle_médiane_ecart: NULL,
			Rem_globale_annuelle_médiane_F: NULL,
			Rem_globale_annuelle_médiane_H: NULL,
			Taux_horaire_global_médian_ecart: NULL,
			Taux_globale_annuelle_médiane_F: NULL,
			Taux_globale_annuelle_médiane_H: NULL,
			Rem_variable_annuelle_médiane_ecart: NULL,
			Rem_variable_annuelle_médiane_F: NULL,
			Rem_variable_annuelle_médiane_H: NULL,
			Taux_horaire_variable_médian_ecart: NULL,
			"Taux_horaire_variable_médian_F ": NULL,
			Taux_horaire_variable_médian_H: NULL,
			Proportion_variable_F: NULL,
			Proportion_variable_H: NULL,
			Seuil_Q1_Rem_globale: NULL,
			Seuil_Q2_Rem_globale: NULL,
			Seuil_Q3_Rem_globale: NULL,
			Seuil_Q4_Rem_globale: NULL,
			Quartile1_Rem_globale_annuelle_proportion_F: NULL,
			Quartile2_Rem_globale_annuelle_proportion_F: NULL,
			Quartile3_Rem_globale_annuelle_proportion_F: NULL,
			Quartile4_Rem_globale_annuelle_proportion_F: NULL,
			Quartile1_Rem_globale_annuelle_proportion_H: NULL,
			Quartile2_Rem_globale_annuelle_proportion_H: NULL,
			Quartile3_Rem_globale_annuelle_proportion_H: NULL,
			Quartile4_Rem_globale_annuelle_proportion_H: NULL,
			Seuil_Q1_Taux_horaire_global: NULL,
			Seuil_Q2_Taux_horaire_global: NULL,
			Seuil_Q3_Taux_horaire_global: NULL,
			Seuil_Q4_Taux_horaire_global: NULL,
			Quartile1_Taux_horaire_global_proportion_F: NULL,
			Quartile2_Taux_horaire_global_proportion_F: NULL,
			Quartile3_Taux_horaire_global_proportion_F: NULL,
			Quartile4_Taux_horaire_global_proportion_F: NULL,
			Quartile1_Taux_horaire_global_proportion_H: NULL,
			Quartile2_Taux_horaire_global_proportion_H: NULL,
			Quartile3_Taux_horaire_global_proportion_H: NULL,
			Quartile4_Taux_horaire_global_proportion_H: NULL,
			indice_nature_exo: NULL,
			indice_unite: NULL,
			indice_ratio_suspensions: NULL,
			indice_suspensions_longues: NULL,
			indice_suspensions_sans_fin: NULL,
			indice_ratio_arrets: NULL,
			indice_arrets_longs: NULL,
			indice_arrets_0: NULL,
			indice_quotite250: NULL,
			indice_quotite0: NULL,
			indice_sup_annee_civile: NULL,
			indice_ratio_FP: NULL,
			indice_rem_extremes: NULL,
			indice_taux_extremes: NULL,
		},
	},

	// #3 — Indicators A-D filled, E-F null (no variable pay distribution)
	{
		description: "Indicators A-D filled, E-F null",
		siren: "111222333",
		ema: fmt2(250),
		overrides: {
			Proportion_variable_F: NULL,
			Proportion_variable_H: NULL,
			Seuil_Q1_Rem_globale: NULL,
			Seuil_Q2_Rem_globale: NULL,
			Seuil_Q3_Rem_globale: NULL,
			Seuil_Q4_Rem_globale: NULL,
			Quartile1_Rem_globale_annuelle_proportion_F: NULL,
			Quartile2_Rem_globale_annuelle_proportion_F: NULL,
			Quartile3_Rem_globale_annuelle_proportion_F: NULL,
			Quartile4_Rem_globale_annuelle_proportion_F: NULL,
			Quartile1_Rem_globale_annuelle_proportion_H: NULL,
			Quartile2_Rem_globale_annuelle_proportion_H: NULL,
			Quartile3_Rem_globale_annuelle_proportion_H: NULL,
			Quartile4_Rem_globale_annuelle_proportion_H: NULL,
			Seuil_Q1_Taux_horaire_global: NULL,
			Seuil_Q2_Taux_horaire_global: NULL,
			Seuil_Q3_Taux_horaire_global: NULL,
			Seuil_Q4_Taux_horaire_global: NULL,
			Quartile1_Taux_horaire_global_proportion_F: NULL,
			Quartile2_Taux_horaire_global_proportion_F: NULL,
			Quartile3_Taux_horaire_global_proportion_F: NULL,
			Quartile4_Taux_horaire_global_proportion_F: NULL,
			Quartile1_Taux_horaire_global_proportion_H: NULL,
			Quartile2_Taux_horaire_global_proportion_H: NULL,
			Quartile3_Taux_horaire_global_proportion_H: NULL,
			Quartile4_Taux_horaire_global_proportion_H: NULL,
		},
	},

	// #4 — Variable workforce H = 0 (like Excel example 2)
	{
		description: "Variable workforce men = 0",
		siren: "222333444",
		ema: fmt2(160),
		overrides: {
			Effectif_H_rem_annuelle_variable: "0",
			Effectif_F_rem_annuelle_variable: "30",
			// Variable pay gaps become meaningless with 0 men
			Rem_variable_annuelle_moyenne_ecart: NULL,
			Rem_variable_annuelle_moyenne_H: NULL,
			Taux_horaire_variable_moyen_ecart: NULL,
			Taux_horaire_variable_moyen_H: NULL,
			Rem_variable_annuelle_médiane_ecart: NULL,
			Rem_variable_annuelle_médiane_H: NULL,
			Taux_horaire_variable_médian_ecart: NULL,
			Taux_horaire_variable_médian_H: NULL,
			Proportion_variable_H: fmt4(0),
		},
	},

	// #5 — Variable workforce F = 0
	{
		description: "Variable workforce women = 0",
		siren: "333444555",
		ema: fmt2(175),
		overrides: {
			Effectif_F_rem_annuelle_variable: "0",
			Effectif_H_rem_annuelle_variable: "55",
			Rem_variable_annuelle_moyenne_ecart: NULL,
			Rem_variable_annuelle_moyenne_F: NULL,
			Taux_horaire_variable_moyen_ecart: NULL,
			Taux_horaire_variable_moyen_F: NULL,
			Rem_variable_annuelle_médiane_ecart: NULL,
			Rem_variable_annuelle_médiane_F: NULL,
			Taux_horaire_variable_médian_ecart: NULL,
			"Taux_horaire_variable_médian_F ": NULL,
			Proportion_variable_F: fmt4(0),
		},
	},

	// #6 — All gaps = 0 (perfect equality)
	{
		description: "All gaps exactly 0 — perfect equality",
		siren: "444555666",
		ema: fmt2(300),
		overrides: {
			Effectif_H_rem_annuelle_globale: "150",
			Effectif_F_rem_annuelle_globale: "150",
			Effectif_H_taux_horaire_global: "145",
			Effectif_F_taux_horaire_global: "145",
			Effectif_H_rem_annuelle_variable: "80",
			Effectif_F_rem_annuelle_variable: "80",
			Rem_globale_annuelle_moyenne_ecart: fmt4(0),
			Rem_globale_annuelle_moyenne_F: fmt2(40000),
			Rem_globale_annuelle_moyenne_H: fmt2(40000),
			Taux_horaire_global_moyen_ecart: fmt4(0),
			Taux_horaire_global_moyen_F: fmt2(21.98),
			Taux_horaire_global_moyen_H: fmt2(21.98),
			Rem_variable_annuelle_moyenne_ecart: fmt4(0),
			Rem_variable_annuelle_moyenne_F: fmt2(1200),
			Rem_variable_annuelle_moyenne_H: fmt2(1200),
			Taux_horaire_variable_moyen_ecart: fmt4(0),
			Taux_horaire_variable_moyen_F: fmt2(0.66),
			Taux_horaire_variable_moyen_H: fmt2(0.66),
			Rem_globale_annuelle_médiane_ecart: fmt4(0),
			Rem_globale_annuelle_médiane_F: fmt2(39000),
			Rem_globale_annuelle_médiane_H: fmt2(39000),
			Taux_horaire_global_médian_ecart: fmt4(0),
			Taux_globale_annuelle_médiane_F: fmt2(21.43),
			Taux_globale_annuelle_médiane_H: fmt2(21.43),
			Rem_variable_annuelle_médiane_ecart: fmt4(0),
			Rem_variable_annuelle_médiane_F: fmt2(1100),
			Rem_variable_annuelle_médiane_H: fmt2(1100),
			Taux_horaire_variable_médian_ecart: fmt4(0),
			"Taux_horaire_variable_médian_F ": fmt2(0.6),
			Taux_horaire_variable_médian_H: fmt2(0.6),
			Proportion_variable_F: fmt4(0.5333),
			Proportion_variable_H: fmt4(0.5333),
			// Quartile proportions: perfect 50/50
			Quartile1_Rem_globale_annuelle_proportion_F: fmt4(0.5),
			Quartile2_Rem_globale_annuelle_proportion_F: fmt4(0.5),
			Quartile3_Rem_globale_annuelle_proportion_F: fmt4(0.5),
			Quartile4_Rem_globale_annuelle_proportion_F: fmt4(0.5),
			Quartile1_Rem_globale_annuelle_proportion_H: fmt4(0.5),
			Quartile2_Rem_globale_annuelle_proportion_H: fmt4(0.5),
			Quartile3_Rem_globale_annuelle_proportion_H: fmt4(0.5),
			Quartile4_Rem_globale_annuelle_proportion_H: fmt4(0.5),
			Quartile1_Taux_horaire_global_proportion_F: fmt4(0.5),
			Quartile2_Taux_horaire_global_proportion_F: fmt4(0.5),
			Quartile3_Taux_horaire_global_proportion_F: fmt4(0.5),
			Quartile4_Taux_horaire_global_proportion_F: fmt4(0.5),
			Quartile1_Taux_horaire_global_proportion_H: fmt4(0.5),
			Quartile2_Taux_horaire_global_proportion_H: fmt4(0.5),
			Quartile3_Taux_horaire_global_proportion_H: fmt4(0.5),
			Quartile4_Taux_horaire_global_proportion_H: fmt4(0.5),
		},
	},

	// #7 — Strongly negative gaps (women earn much more)
	{
		description: "Strongly negative gaps — women earn much more",
		siren: "555666777",
		ema: fmt2(200),
		overrides: {
			Rem_globale_annuelle_moyenne_ecart: fmt4(-0.35),
			Rem_globale_annuelle_moyenne_F: fmt2(52000),
			Rem_globale_annuelle_moyenne_H: fmt2(38518.52),
			Taux_horaire_global_moyen_ecart: fmt4(-0.35),
			Taux_horaire_global_moyen_F: fmt2(28.57),
			Taux_horaire_global_moyen_H: fmt2(21.16),
			Rem_variable_annuelle_moyenne_ecart: fmt4(-0.5),
			Rem_variable_annuelle_moyenne_F: fmt2(3000),
			Rem_variable_annuelle_moyenne_H: fmt2(2000),
			Taux_horaire_variable_moyen_ecart: fmt4(-0.5),
			Taux_horaire_variable_moyen_F: fmt2(1.65),
			Taux_horaire_variable_moyen_H: fmt2(1.1),
			Rem_globale_annuelle_médiane_ecart: fmt4(-0.4),
			Rem_globale_annuelle_médiane_F: fmt2(50000),
			Rem_globale_annuelle_médiane_H: fmt2(35714.29),
			Taux_horaire_global_médian_ecart: fmt4(-0.4),
			Taux_globale_annuelle_médiane_F: fmt2(27.47),
			Taux_globale_annuelle_médiane_H: fmt2(19.62),
			Rem_variable_annuelle_médiane_ecart: fmt4(-0.9999),
			Rem_variable_annuelle_médiane_F: fmt2(2800),
			Rem_variable_annuelle_médiane_H: fmt2(1400.07),
			Taux_horaire_variable_médian_ecart: fmt4(-0.9999),
			"Taux_horaire_variable_médian_F ": fmt2(1.54),
			Taux_horaire_variable_médian_H: fmt2(0.77),
		},
	},

	// #8 — All gaps null (not computable)
	{
		description: "All gap fields null — not computable",
		siren: "666777888",
		ema: fmt2(155),
		overrides: {
			Rem_globale_annuelle_moyenne_ecart: NULL,
			Taux_horaire_global_moyen_ecart: NULL,
			Rem_variable_annuelle_moyenne_ecart: NULL,
			Taux_horaire_variable_moyen_ecart: NULL,
			Rem_globale_annuelle_médiane_ecart: NULL,
			Taux_horaire_global_médian_ecart: NULL,
			Rem_variable_annuelle_médiane_ecart: NULL,
			Taux_horaire_variable_médian_ecart: NULL,
		},
	},

	// #9 — Proportions at boundaries: 0 and 1 (mono-gender quartile)
	{
		description: "Quartile proportions at 0 and 1 — mono-gender quartiles",
		siren: "777888999",
		ema: fmt2(220),
		overrides: {
			// Q1: 100% women, Q4: 0% women
			Quartile1_Rem_globale_annuelle_proportion_F: fmt4(1),
			Quartile1_Rem_globale_annuelle_proportion_H: fmt4(0),
			Quartile4_Rem_globale_annuelle_proportion_F: fmt4(0),
			Quartile4_Rem_globale_annuelle_proportion_H: fmt4(1),
			Quartile1_Taux_horaire_global_proportion_F: fmt4(1),
			Quartile1_Taux_horaire_global_proportion_H: fmt4(0),
			Quartile4_Taux_horaire_global_proportion_F: fmt4(0),
			Quartile4_Taux_horaire_global_proportion_H: fmt4(1),
		},
	},

	// #10 — Proportions F+H don't sum to exactly 1 (floating point)
	{
		description: "Proportions F+H sum to 0.9999 — floating point rounding",
		siren: "888999000",
		ema: fmt2(190),
		overrides: {
			Quartile1_Rem_globale_annuelle_proportion_F: fmt4(0.5347),
			Quartile1_Rem_globale_annuelle_proportion_H: fmt4(0.4652),
			Quartile2_Rem_globale_annuelle_proportion_F: fmt4(0.3333),
			Quartile2_Rem_globale_annuelle_proportion_H: fmt4(0.6668),
			Quartile3_Rem_globale_annuelle_proportion_F: fmt4(0.2501),
			Quartile3_Rem_globale_annuelle_proportion_H: fmt4(0.7501),
			Quartile1_Taux_horaire_global_proportion_F: fmt4(0.5347),
			Quartile1_Taux_horaire_global_proportion_H: fmt4(0.4652),
		},
	},

	// #11 — Quartile proportions all null
	{
		description: "Quartile proportions all null",
		siren: "999000111",
		ema: fmt2(170),
		overrides: {
			Quartile1_Rem_globale_annuelle_proportion_F: NULL,
			Quartile2_Rem_globale_annuelle_proportion_F: NULL,
			Quartile3_Rem_globale_annuelle_proportion_F: NULL,
			Quartile4_Rem_globale_annuelle_proportion_F: NULL,
			Quartile1_Rem_globale_annuelle_proportion_H: NULL,
			Quartile2_Rem_globale_annuelle_proportion_H: NULL,
			Quartile3_Rem_globale_annuelle_proportion_H: NULL,
			Quartile4_Rem_globale_annuelle_proportion_H: NULL,
			Quartile1_Taux_horaire_global_proportion_F: NULL,
			Quartile2_Taux_horaire_global_proportion_F: NULL,
			Quartile3_Taux_horaire_global_proportion_F: NULL,
			Quartile4_Taux_horaire_global_proportion_F: NULL,
			Quartile1_Taux_horaire_global_proportion_H: NULL,
			Quartile2_Taux_horaire_global_proportion_H: NULL,
			Quartile3_Taux_horaire_global_proportion_H: NULL,
			Quartile4_Taux_horaire_global_proportion_H: NULL,
		},
	},

	// #12 — EMA at minimum threshold (50)
	{
		description: "EMA at minimum threshold — 50 (just eligible)",
		siren: "050123456",
		ema: fmt2(50),
		overrides: {
			Effectif_H_rem_annuelle_globale: "30",
			Effectif_F_rem_annuelle_globale: "20",
			Effectif_H_taux_horaire_global: "28",
			Effectif_F_taux_horaire_global: "18",
			Effectif_H_rem_annuelle_variable: "10",
			Effectif_F_rem_annuelle_variable: "8",
		},
	},

	// #13 — EMA between 50-99 (triennial declaration)
	{
		description: "EMA 50-99 — triennial declaration threshold",
		siren: "060234567",
		ema: fmt2(75.5),
		overrides: {
			Effectif_H_rem_annuelle_globale: "45",
			Effectif_F_rem_annuelle_globale: "30",
			Effectif_H_taux_horaire_global: "42",
			Effectif_F_taux_horaire_global: "28",
			Effectif_H_rem_annuelle_variable: "20",
			Effectif_F_rem_annuelle_variable: "12",
		},
	},

	// #14 — EMA at CSE threshold (100)
	{
		description: "EMA at CSE threshold — 100",
		siren: "070345678",
		ema: fmt2(100),
		overrides: {
			Effectif_H_rem_annuelle_globale: "55",
			Effectif_F_rem_annuelle_globale: "45",
			Effectif_H_taux_horaire_global: "52",
			Effectif_F_taux_horaire_global: "42",
			Effectif_H_rem_annuelle_variable: "30",
			Effectif_F_rem_annuelle_variable: "25",
		},
	},

	// #15 — Q4 threshold absent (only Q1-Q3, as per Excel spec)
	{
		description: "Q4 threshold absent — only Q1-Q3 as in Excel spec",
		siren: "080456789",
		ema: fmt2(210),
		overrides: {
			Seuil_Q4_Rem_globale: NULL,
			Seuil_Q4_Taux_horaire_global: NULL,
		},
	},

	// #16 — Confidence index = 0 (zero confidence)
	{
		description: "Confidence index = 0 — zero confidence",
		siren: "090567890",
		ema: fmt2(165),
		overrides: {
			indice: fmt4(0),
			indice_nature_exo: NULL,
			indice_unite: NULL,
			indice_ratio_suspensions: NULL,
			indice_suspensions_longues: NULL,
			indice_suspensions_sans_fin: NULL,
			indice_ratio_arrets: NULL,
			indice_arrets_longs: NULL,
			indice_arrets_0: NULL,
			indice_quotite250: NULL,
			indice_quotite0: NULL,
			indice_sup_annee_civile: NULL,
			indice_ratio_FP: NULL,
			indice_rem_extremes: NULL,
			indice_taux_extremes: NULL,
		},
	},

	// #17 — Mono-gender: only men (women count = 0 everywhere)
	{
		description: "Mono-gender company — only men (F=0)",
		siren: "001567890",
		ema: fmt2(180),
		overrides: {
			Effectif_H_rem_annuelle_globale: "180",
			Effectif_F_rem_annuelle_globale: "0",
			Effectif_H_taux_horaire_global: "170",
			Effectif_F_taux_horaire_global: "0",
			Effectif_H_rem_annuelle_variable: "90",
			Effectif_F_rem_annuelle_variable: "0",
			// All gaps, remunerations for F, and proportions become null
			Rem_globale_annuelle_moyenne_ecart: NULL,
			Rem_globale_annuelle_moyenne_F: NULL,
			Taux_horaire_global_moyen_ecart: NULL,
			Taux_horaire_global_moyen_F: NULL,
			Rem_variable_annuelle_moyenne_ecart: NULL,
			Rem_variable_annuelle_moyenne_F: NULL,
			Taux_horaire_variable_moyen_ecart: NULL,
			Taux_horaire_variable_moyen_F: NULL,
			Rem_globale_annuelle_médiane_ecart: NULL,
			Rem_globale_annuelle_médiane_F: NULL,
			Taux_horaire_global_médian_ecart: NULL,
			Taux_globale_annuelle_médiane_F: NULL,
			Rem_variable_annuelle_médiane_ecart: NULL,
			Rem_variable_annuelle_médiane_F: NULL,
			Taux_horaire_variable_médian_ecart: NULL,
			"Taux_horaire_variable_médian_F ": NULL,
			Proportion_variable_F: fmt4(0),
			// All quartile proportions: 0% women, 100% men
			Quartile1_Rem_globale_annuelle_proportion_F: fmt4(0),
			Quartile2_Rem_globale_annuelle_proportion_F: fmt4(0),
			Quartile3_Rem_globale_annuelle_proportion_F: fmt4(0),
			Quartile4_Rem_globale_annuelle_proportion_F: fmt4(0),
			Quartile1_Rem_globale_annuelle_proportion_H: fmt4(1),
			Quartile2_Rem_globale_annuelle_proportion_H: fmt4(1),
			Quartile3_Rem_globale_annuelle_proportion_H: fmt4(1),
			Quartile4_Rem_globale_annuelle_proportion_H: fmt4(1),
			Quartile1_Taux_horaire_global_proportion_F: fmt4(0),
			Quartile2_Taux_horaire_global_proportion_F: fmt4(0),
			Quartile3_Taux_horaire_global_proportion_F: fmt4(0),
			Quartile4_Taux_horaire_global_proportion_F: fmt4(0),
			Quartile1_Taux_horaire_global_proportion_H: fmt4(1),
			Quartile2_Taux_horaire_global_proportion_H: fmt4(1),
			Quartile3_Taux_horaire_global_proportion_H: fmt4(1),
			Quartile4_Taux_horaire_global_proportion_H: fmt4(1),
		},
	},

	// #18 — EMA near max (399999.99)
	{
		description: "EMA near maximum — 399999.99",
		siren: "002678901",
		ema: fmt2(399999.99),
		overrides: {
			Effectif_H_rem_annuelle_globale: "200000",
			Effectif_F_rem_annuelle_globale: "199999",
			Effectif_H_taux_horaire_global: "195000",
			Effectif_F_taux_horaire_global: "192000",
			Effectif_H_rem_annuelle_variable: "120000",
			Effectif_F_rem_annuelle_variable: "110000",
		},
	},

	// #19 — Quartile thresholds very close (minimal pay dispersion)
	{
		description: "Quartile thresholds very close — minimal dispersion",
		siren: "003789012",
		ema: fmt2(160),
		overrides: {
			Seuil_Q1_Rem_globale: fmt2(30000),
			Seuil_Q2_Rem_globale: fmt2(30100),
			Seuil_Q3_Rem_globale: fmt2(30200),
			Seuil_Q4_Rem_globale: fmt2(30300),
			Seuil_Q1_Taux_horaire_global: fmt2(16.48),
			Seuil_Q2_Taux_horaire_global: fmt2(16.54),
			Seuil_Q3_Taux_horaire_global: fmt2(16.59),
			Seuil_Q4_Taux_horaire_global: fmt2(16.65),
		},
	},

	// #20 — Quartile thresholds extremely spread
	{
		description: "Quartile thresholds extremely spread",
		siren: "004890123",
		ema: fmt2(185),
		overrides: {
			Seuil_Q1_Rem_globale: fmt2(1000),
			Seuil_Q2_Rem_globale: fmt2(25000),
			Seuil_Q3_Rem_globale: fmt2(100000),
			Seuil_Q4_Rem_globale: fmt2(500000),
			Seuil_Q1_Taux_horaire_global: fmt2(0.55),
			Seuil_Q2_Taux_horaire_global: fmt2(13.74),
			Seuil_Q3_Taux_horaire_global: fmt2(54.95),
			Seuil_Q4_Taux_horaire_global: fmt2(274.73),
		},
	},

	// #21 — EMA with decimals (50.01)
	{
		description: "EMA with decimals — 50.01",
		siren: "005901234",
		ema: fmt2(50.01),
		overrides: {
			Effectif_H_rem_annuelle_globale: "28",
			Effectif_F_rem_annuelle_globale: "22",
			Effectif_H_taux_horaire_global: "26",
			Effectif_F_taux_horaire_global: "20",
			Effectif_H_rem_annuelle_variable: "12",
			Effectif_F_rem_annuelle_variable: "8",
		},
	},

	// #22 — Partial effectifs null (some workforce columns empty)
	{
		description: "Partial effectifs null — hourly and variable empty",
		siren: "006012345",
		ema: fmt2(200),
		overrides: {
			Effectif_H_taux_horaire_global: NULL,
			Effectif_F_taux_horaire_global: NULL,
			Effectif_H_rem_annuelle_variable: NULL,
			Effectif_F_rem_annuelle_variable: NULL,
			// Hourly and variable indicators become null too
			Taux_horaire_global_moyen_ecart: NULL,
			Taux_horaire_global_moyen_F: NULL,
			Taux_horaire_global_moyen_H: NULL,
			Taux_horaire_variable_moyen_ecart: NULL,
			Taux_horaire_variable_moyen_F: NULL,
			Taux_horaire_variable_moyen_H: NULL,
			Taux_horaire_global_médian_ecart: NULL,
			Taux_globale_annuelle_médiane_F: NULL,
			Taux_globale_annuelle_médiane_H: NULL,
			Taux_horaire_variable_médian_ecart: NULL,
			"Taux_horaire_variable_médian_F ": NULL,
			Taux_horaire_variable_médian_H: NULL,
			Rem_variable_annuelle_moyenne_ecart: NULL,
			Rem_variable_annuelle_moyenne_F: NULL,
			Rem_variable_annuelle_moyenne_H: NULL,
			Rem_variable_annuelle_médiane_ecart: NULL,
			Rem_variable_annuelle_médiane_F: NULL,
			Rem_variable_annuelle_médiane_H: NULL,
			Proportion_variable_F: NULL,
			Proportion_variable_H: NULL,
		},
	},
];

// ── CSV assembly ──────────────────────────────────────────────────

function generateCsv(): string {
	const now = new Date().toISOString().slice(0, 19);
	const lines: string[] = [
		"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
		`DGT;DTS;${now};2026-01-01;2026-12-31;${edgeCases.length}`,
		HEADERS.join(";"),
	];

	for (const ec of edgeCases) {
		const row = baseRow(ec.siren, ec.ema ?? fmt2(200));
		for (const [key, value] of Object.entries(ec.overrides)) {
			row[key] = value;
		}
		lines.push(toLine(row));
	}

	return lines.join("\n");
}

// ── Main ───────────────────────────────────────────────────────────

const csv = generateCsv();

const fs = await import("node:fs");
const path = await import("node:path");

const dataDir = path.join(import.meta.dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const outputPath = path.join(dataDir, "mock-gip-mds-edge-cases.csv");
fs.writeFileSync(outputPath, csv, "utf-8");

console.error(
	`Generated ${edgeCases.length} edge case rows → ${outputPath} (${(csv.length / 1024).toFixed(1)} KB)`,
);

console.error("\nEdge cases:");
for (const [i, ec] of edgeCases.entries()) {
	console.error(
		`  ${String(i + 1).padStart(2)}. [${ec.siren}] ${ec.description}`,
	);
}
