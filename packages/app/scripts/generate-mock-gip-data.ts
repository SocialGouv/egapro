/**
 * Generate a realistic mock GIP MDS CSV file from real company data.
 *
 * Prerequisites:
 *   npx tsx scripts/fetch-large-companies.ts   # generates data/companies.json
 *
 * Usage:
 *   npx tsx scripts/generate-mock-gip-data.ts
 *
 * Reads real SIRENs from data/companies.json (fetched from API Recherche
 * d'Entreprises) and generates mock GIP-MDS indicator data for each.
 *
 * The generated CSV follows the exact GIP MDS format:
 * - Line 1: metadata headers
 * - Line 2: metadata values
 * - Line 3: column headers (75 columns)
 * - Lines 4+: data rows (one per SIREN)
 */

// ── Types ──────────────────────────────────────────────────────────

type CompanyProfile =
	| "balanced"
	| "women_disfavored_low"
	| "women_disfavored_high"
	| "men_disfavored"
	| "tech_high_pay"
	| "industry_moderate"
	| "services_low_pay"
	| "finance_high_gap";

type CompanyData = {
	siren: string;
	workforce: number;
	profile: CompanyProfile;
};

// ── Deterministic PRNG (Mulberry32) ────────────────────────────────

function mulberry32(seed: number) {
	let s = seed;
	return () => {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const rand = mulberry32(42);

function randBetween(min: number, max: number): number {
	return min + rand() * (max - min);
}

function randInt(min: number, max: number): number {
	return Math.round(randBetween(min, max));
}

function pick<T>(arr: T[]): T {
	return arr[Math.floor(rand() * arr.length)] as T;
}

function fmt2(n: number): string {
	return n.toFixed(2).replace(".", ",");
}

function fmt4(n: number): string {
	return n.toFixed(4).replace(".", ",");
}

// ── Company loading ────────────────────────────────────────────────

type InputCompany = {
	siren: string;
	name: string;
	workforce: number | null;
};

async function loadCompanies(): Promise<InputCompany[]> {
	const fs = await import("node:fs");
	const path = await import("node:path");
	const filePath = path.join(
		import.meta.dirname,
		"..",
		"data",
		"companies.json",
	);

	if (!fs.existsSync(filePath)) {
		console.error("Error: data/companies.json not found.");
		console.error("Run first: npx tsx scripts/fetch-large-companies.ts");
		process.exit(1);
	}

	return JSON.parse(fs.readFileSync(filePath, "utf-8")) as InputCompany[];
}

const PROFILES: CompanyProfile[] = [
	"balanced",
	"women_disfavored_low",
	"women_disfavored_high",
	"men_disfavored",
	"tech_high_pay",
	"industry_moderate",
	"services_low_pay",
	"finance_high_gap",
];

function toCompanyData(input: InputCompany): CompanyData {
	return {
		siren: input.siren,
		// Use real workforce estimate if available, otherwise generate one (large)
		workforce: input.workforce ?? randInt(250, 5000),
		profile: pick(PROFILES),
	};
}

// ── Data generation per profile ────────────────────────────────────

function generateRow(company: CompanyData): string[] {
	const { siren, workforce, profile } = company;

	// Gender split ratio (proportion of women in workforce)
	let womenRatio: number;
	let baseSalaryWomen: number;
	let baseSalaryMen: number;
	let variablePayRatio: number; // % of workforce with variable pay
	let variableAmountWomen: number;
	let variableAmountMen: number;

	switch (profile) {
		case "balanced":
			womenRatio = randBetween(0.45, 0.55);
			baseSalaryMen = randBetween(32000, 48000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.97, 1.03);
			variablePayRatio = randBetween(0.3, 0.7);
			variableAmountMen = randBetween(300, 800);
			variableAmountWomen = variableAmountMen * randBetween(0.95, 1.05);
			break;

		case "women_disfavored_low":
			womenRatio = randBetween(0.35, 0.5);
			baseSalaryMen = randBetween(30000, 42000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.88, 0.95);
			variablePayRatio = randBetween(0.2, 0.5);
			variableAmountMen = randBetween(400, 1200);
			variableAmountWomen = variableAmountMen * randBetween(0.7, 0.9);
			break;

		case "women_disfavored_high":
			womenRatio = randBetween(0.25, 0.45);
			baseSalaryMen = randBetween(45000, 80000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.8, 0.92);
			variablePayRatio = randBetween(0.5, 0.9);
			variableAmountMen = randBetween(2000, 8000);
			variableAmountWomen = variableAmountMen * randBetween(0.6, 0.85);
			break;

		case "men_disfavored":
			womenRatio = randBetween(0.5, 0.7);
			baseSalaryWomen = randBetween(35000, 50000);
			baseSalaryMen = baseSalaryWomen * randBetween(0.88, 0.96);
			variablePayRatio = randBetween(0.3, 0.6);
			variableAmountWomen = randBetween(500, 1500);
			variableAmountMen = variableAmountWomen * randBetween(0.75, 0.92);
			break;

		case "tech_high_pay":
			womenRatio = randBetween(0.2, 0.35);
			baseSalaryMen = randBetween(55000, 95000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.85, 0.97);
			variablePayRatio = randBetween(0.6, 0.95);
			variableAmountMen = randBetween(3000, 15000);
			variableAmountWomen = variableAmountMen * randBetween(0.7, 0.95);
			break;

		case "industry_moderate":
			womenRatio = randBetween(0.15, 0.35);
			baseSalaryMen = randBetween(28000, 40000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.9, 1.0);
			variablePayRatio = randBetween(0.1, 0.4);
			variableAmountMen = randBetween(200, 600);
			variableAmountWomen = variableAmountMen * randBetween(0.85, 1.0);
			break;

		case "services_low_pay":
			womenRatio = randBetween(0.55, 0.75);
			baseSalaryMen = randBetween(22000, 32000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.92, 1.02);
			variablePayRatio = randBetween(0.05, 0.25);
			variableAmountMen = randBetween(100, 400);
			variableAmountWomen = variableAmountMen * randBetween(0.8, 1.0);
			break;

		case "finance_high_gap":
			womenRatio = randBetween(0.35, 0.5);
			baseSalaryMen = randBetween(60000, 120000);
			baseSalaryWomen = baseSalaryMen * randBetween(0.72, 0.88);
			variablePayRatio = randBetween(0.7, 0.95);
			variableAmountMen = randBetween(5000, 30000);
			variableAmountWomen = variableAmountMen * randBetween(0.5, 0.8);
			break;
	}

	// Workforce breakdown
	const totalWomen = Math.round(workforce * womenRatio);
	const totalMen = workforce - totalWomen;
	const hourlyWomen = Math.round(totalWomen * randBetween(0.85, 1.0));
	const hourlyMen = Math.round(totalMen * randBetween(0.85, 1.0));
	const variableWomen = Math.round(
		totalWomen * variablePayRatio * randBetween(0.8, 1.0),
	);
	const variableMen = Math.round(
		totalMen * variablePayRatio * randBetween(0.9, 1.1),
	);

	// Hourly rates (annual / 1820 hours standard)
	const hourlyWomenRate = baseSalaryWomen / 1820;
	const hourlyMenRate = baseSalaryMen / 1820;

	// Gaps (as proportion: (men - women) / men)
	const annualMeanGap = (baseSalaryMen - baseSalaryWomen) / baseSalaryMen;
	const hourlyMeanGap = (hourlyMenRate - hourlyWomenRate) / hourlyMenRate;

	// Median: slight deviation from mean
	const medianFactor = randBetween(0.92, 1.08);
	const annualMedianWomen = baseSalaryWomen * medianFactor;
	const annualMedianMen =
		baseSalaryMen * medianFactor * randBetween(0.98, 1.02);
	const annualMedianGap =
		(annualMedianMen - annualMedianWomen) / annualMedianMen;

	const hourlyMedianWomen = hourlyWomenRate * medianFactor;
	const hourlyMedianMen =
		hourlyMenRate * medianFactor * randBetween(0.98, 1.02);
	const hourlyMedianGap =
		(hourlyMedianMen - hourlyMedianWomen) / hourlyMedianMen;

	// Variable pay gaps
	const variableAnnualMeanGap =
		(variableAmountMen - variableAmountWomen) / variableAmountMen;
	const variableHourlyWomen = variableAmountWomen / 1820;
	const variableHourlyMen = variableAmountMen / 1820;
	const variableHourlyMeanGap =
		(variableHourlyMen - variableHourlyWomen) / variableHourlyMen;

	const variableMedianWomen = variableAmountWomen * randBetween(0.85, 1.15);
	const variableMedianMen = variableAmountMen * randBetween(0.85, 1.15);
	const variableAnnualMedianGap =
		(variableMedianMen - variableMedianWomen) / variableMedianMen;
	const variableHourlyMedianWomen = variableMedianWomen / 1820;
	const variableHourlyMedianMen = variableMedianMen / 1820;
	const variableHourlyMedianGap =
		(variableHourlyMedianMen - variableHourlyMedianWomen) /
		variableHourlyMedianMen;

	// Variable pay proportions
	const proportionVariableWomen =
		totalWomen > 0 ? variableWomen / totalWomen : 0;
	const proportionVariableMen = totalMen > 0 ? variableMen / totalMen : 0;

	// Quartile distribution (annual)
	const q1Threshold = baseSalaryMen * randBetween(0.5, 0.7);
	const q2Threshold = baseSalaryMen * randBetween(0.7, 0.9);
	const q3Threshold = baseSalaryMen * randBetween(0.9, 1.1);
	const q4Threshold = baseSalaryMen * randBetween(1.1, 1.5);

	// Women proportion tends to decrease in higher quartiles for disfavored profiles
	const q1WomenProp = Math.min(
		1,
		Math.max(0, womenRatio + randBetween(-0.05, 0.15)),
	);
	const q2WomenProp = Math.min(
		1,
		Math.max(0, womenRatio + randBetween(-0.08, 0.08)),
	);
	const q3WomenProp = Math.min(
		1,
		Math.max(0, womenRatio + randBetween(-0.12, 0.05)),
	);
	const q4WomenProp = Math.min(
		1,
		Math.max(
			0,
			profile.includes("women_disfavored")
				? womenRatio * randBetween(0.4, 0.7)
				: profile === "men_disfavored"
					? womenRatio + randBetween(0.05, 0.2)
					: womenRatio + randBetween(-0.1, 0.05),
		),
	);

	// Hourly quartile thresholds
	const hq1 = q1Threshold / 1820;
	const hq2 = q2Threshold / 1820;
	const hq3 = q3Threshold / 1820;
	const hq4 = q4Threshold / 1820;

	// Hourly quartile proportions (slight variation from annual)
	const hq1WomenProp = Math.min(
		1,
		Math.max(0, q1WomenProp + randBetween(-0.03, 0.03)),
	);
	const hq2WomenProp = Math.min(
		1,
		Math.max(0, q2WomenProp + randBetween(-0.03, 0.03)),
	);
	const hq3WomenProp = Math.min(
		1,
		Math.max(0, q3WomenProp + randBetween(-0.03, 0.03)),
	);
	const hq4WomenProp = Math.min(
		1,
		Math.max(0, q4WomenProp + randBetween(-0.03, 0.03)),
	);

	// Confidence index
	const confidenceIndex = randBetween(0.5, 0.99);
	const confExo = randBetween(0, 0.5);
	const confUnit = randBetween(0, 0.3);
	const confSuspRatio = randBetween(0, 0.3);
	const confLongSusp = randBetween(0, 0.1);
	const confNoEndSusp = randBetween(0, 0.05);
	const confSickRatio = randBetween(0, 0.2);
	const confLongSick = randBetween(0, 0.95);
	const confNoSick = randBetween(0, 0.05);
	const confQuota250 = randBetween(0, 0.3);
	const confQuota0 = randBetween(0, 0.2);
	const confMultiYear = randBetween(0, 0.2);
	const confFpRatio = randBetween(0, 0.95);
	const confExtRem = randBetween(0, 0.95);
	const confExtRate = randBetween(0, 0.05);

	// Build the row (75 fields in CSV order)
	return [
		siren,
		fmt2(workforce),
		String(totalMen),
		String(totalWomen),
		String(hourlyMen),
		String(hourlyWomen),
		String(variableMen),
		String(variableWomen),
		// Indicator A — Global mean
		fmt4(annualMeanGap),
		fmt2(baseSalaryWomen),
		fmt2(baseSalaryMen),
		fmt4(hourlyMeanGap),
		fmt2(hourlyWomenRate),
		fmt2(hourlyMenRate),
		// Indicator B — Variable mean
		fmt4(variableAnnualMeanGap),
		fmt2(variableAmountWomen),
		fmt2(variableAmountMen),
		fmt4(variableHourlyMeanGap),
		fmt2(variableHourlyWomen),
		fmt2(variableHourlyMen),
		// Indicator C — Global median
		fmt4(annualMedianGap),
		fmt2(annualMedianWomen),
		fmt2(annualMedianMen),
		fmt4(hourlyMedianGap),
		fmt2(hourlyMedianWomen),
		fmt2(hourlyMedianMen),
		// Indicator D — Variable median
		fmt4(variableAnnualMedianGap),
		fmt2(variableMedianWomen),
		fmt2(variableMedianMen),
		fmt4(variableHourlyMedianGap),
		fmt2(variableHourlyMedianWomen),
		fmt2(variableHourlyMedianMen),
		// Indicator E — Variable pay proportions
		fmt4(proportionVariableWomen),
		fmt4(proportionVariableMen),
		// Indicator F — Annual quartile thresholds
		fmt2(q1Threshold),
		fmt2(q2Threshold),
		fmt2(q3Threshold),
		fmt2(q4Threshold),
		// Annual quartile proportions (women)
		fmt4(q1WomenProp),
		fmt4(q2WomenProp),
		fmt4(q3WomenProp),
		fmt4(q4WomenProp),
		// Annual quartile proportions (men = 1 - women)
		fmt4(1 - q1WomenProp),
		fmt4(1 - q2WomenProp),
		fmt4(1 - q3WomenProp),
		fmt4(1 - q4WomenProp),
		// Hourly quartile thresholds
		fmt2(hq1),
		fmt2(hq2),
		fmt2(hq3),
		fmt2(hq4),
		// Hourly quartile proportions (women)
		fmt4(hq1WomenProp),
		fmt4(hq2WomenProp),
		fmt4(hq3WomenProp),
		fmt4(hq4WomenProp),
		// Hourly quartile proportions (men)
		fmt4(1 - hq1WomenProp),
		fmt4(1 - hq2WomenProp),
		fmt4(1 - hq3WomenProp),
		fmt4(1 - hq4WomenProp),
		// Confidence indices
		fmt4(confidenceIndex),
		fmt4(confExo),
		fmt4(confUnit),
		fmt4(confSuspRatio),
		fmt4(confLongSusp),
		fmt4(confNoEndSusp),
		fmt4(confSickRatio),
		fmt4(confLongSick),
		fmt4(confNoSick),
		fmt4(confQuota250),
		fmt4(confQuota0),
		fmt4(confMultiYear),
		fmt4(confFpRatio),
		fmt4(confExtRem),
		fmt4(confExtRate),
	];
}

// ── CSV generation ─────────────────────────────────────────────────

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

function generateCsv(companies: CompanyData[]): string {
	const now = new Date().toISOString().slice(0, 19);
	const lines: string[] = [
		"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
		`DGT;DTS;${now};2026-01-01;2026-12-31;${companies.length}`,
		HEADERS.join(";"),
	];

	for (const company of companies) {
		const row = generateRow(company);
		lines.push(row.join(";"));
	}

	return lines.join("\n");
}

// ── Main ───────────────────────────────────────────────────────────

const inputCompanies = await loadCompanies();
const companies = inputCompanies.map(toCompanyData);

const csv = generateCsv(companies);

// Write to data/ directory
const fs = await import("node:fs");
const path = await import("node:path");

const dataDir = path.join(import.meta.dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const outputPath = path.join(dataDir, "mock-gip-mds.csv");
fs.writeFileSync(outputPath, csv, "utf-8");

console.error(
	`Generated ${companies.length} mock companies → ${outputPath} (${(csv.length / 1024).toFixed(1)} KB)`,
);

// Print profile distribution
const profileCounts: Record<string, number> = {};
for (const c of companies) {
	profileCounts[c.profile] = (profileCounts[c.profile] ?? 0) + 1;
}
console.error("\nProfile distribution:");
for (const [p, n] of Object.entries(profileCounts).sort(
	(a, b) => b[1] - a[1],
)) {
	console.error(`  ${p}: ${n} (${((n / companies.length) * 100).toFixed(0)}%)`);
}
