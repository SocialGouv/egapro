#!/usr/bin/env node
//
// Seed a deterministic public-consultation dataset for the Observatoire.
//
// It covers search filters, multi-year charts, missing/negative/zero values,
// non-diffusible masking, a foreign company, and a single-year company.
// Seeded SIRENs use the reserved 9989 prefix and can be removed with --clean.
//
// Usage from the repository root:
//   pnpm db:seed-observatory
//   pnpm db:seed-observatory -- --year=2025
//   pnpm db:seed-observatory -- --clean

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "..", "package.json"));
const postgres = require("postgres");

const args = Object.fromEntries(
	process.argv
		.slice(2)
		.filter((arg) => arg !== "--")
		.map((arg) => {
			if (arg === "--clean") return ["clean", true];
			const match = arg.match(/^--([^=]+)=(.+)$/);
			return match ? [match[1], match[2]] : [arg, true];
		}),
);

const KNOWN_ARGS = new Set(["year", "clean"]);
for (const key of Object.keys(args)) {
	if (!KNOWN_ARGS.has(key)) {
		console.error(`ERROR: unknown argument --${key}`);
		process.exit(1);
	}
}

const parsedYear = Number(args.year ?? new Date().getUTCFullYear());
if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2200) {
	console.error("ERROR: --year must be an integer between 2000 and 2200");
	process.exit(1);
}

const YEAR = parsedYear;
const CLEAN = args.clean === true;
const SCHEMA_WAIT_SECONDS = Number(
	process.env.OBSERVATORY_SEED_WAIT_FOR_SCHEMA_SECONDS ?? "0",
);
if (!Number.isFinite(SCHEMA_WAIT_SECONDS) || SCHEMA_WAIT_SECONDS < 0) {
	console.error(
		"ERROR: OBSERVATORY_SEED_WAIT_FOR_SCHEMA_SECONDS must be a positive number",
	);
	process.exit(1);
}

function resolveDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
	const host = process.env.POSTGRES_HOST ?? process.env.PGHOST;
	const database =
		process.env.POSTGRES_DB ??
		process.env.POSTGRES_DATABASE ??
		process.env.PGDATABASE;
	if (!host && !database) {
		return "postgresql://postgres:postgres@localhost:5438/egapro";
	}
	if (!host || !database) {
		throw new Error(
			"DATABASE_URL or complete PostgreSQL connection variables must be set",
		);
	}
	const port = process.env.POSTGRES_PORT ?? process.env.PGPORT ?? "5432";
	const user = process.env.POSTGRES_USER ?? process.env.PGUSER ?? "postgres";
	const password = process.env.POSTGRES_PASSWORD ?? process.env.PGPASSWORD;
	const sslmode = process.env.POSTGRES_SSLMODE ?? process.env.PGSSLMODE;
	return `postgresql://${encodeURIComponent(user)}${password ? `:${encodeURIComponent(password)}` : ""}@${host}:${port}/${database}${sslmode ? `?sslmode=${sslmode}` : ""}`;
}

const DATABASE_URL = resolveDatabaseUrl();
const SEED_USER_ID = "00000000-9989-4989-8989-000000009989";
const SEED_USER_EMAIL = "seed-observatory@example.fr";

const PAGINATION_COMPANY_NAMES = [
	"Aquitaine Mobilier Durable",
	"Bureau d’Études Tourangeau",
	"Céramiques de Flandre",
	"Design Industriel Rémois",
	"Éditions de Normandie",
	"Fluides et Énergies Alpines",
	"Génie Civil Atlantique",
	"Horizon Logistique Centre",
	"Industries Textiles du Nord",
	"Jardins et Paysages Champenois",
	"Kiosque Numérique Caennais",
	"Laboratoire des Alpes",
	"Mécanique de Précision Girondine",
	"Nouvelles Technologies de Tours",
	"Optique des Hauts-de-France",
	"Papeteries du Grand Est",
	"Qualité Services Normandie",
	"Réseaux Électriques Isérois",
];

const PAGINATION_LOCATIONS = [
	{
		city: "Bordeaux",
		postalCode: "33000",
		region: "Nouvelle-Aquitaine",
		regionCode: "75",
		departmentCode: "33",
		departmentLabel: "Gironde",
	},
	{
		city: "Tours",
		postalCode: "37000",
		region: "Centre-Val de Loire",
		regionCode: "24",
		departmentCode: "37",
		departmentLabel: "Indre-et-Loire",
	},
	{
		city: "Lille",
		postalCode: "59000",
		region: "Hauts-de-France",
		regionCode: "32",
		departmentCode: "59",
		departmentLabel: "Nord",
	},
	{
		city: "Reims",
		postalCode: "51100",
		region: "Grand Est",
		regionCode: "44",
		departmentCode: "51",
		departmentLabel: "Marne",
	},
	{
		city: "Caen",
		postalCode: "14000",
		region: "Normandie",
		regionCode: "28",
		departmentCode: "14",
		departmentLabel: "Calvados",
	},
	{
		city: "Grenoble",
		postalCode: "38000",
		region: "Auvergne-Rhône-Alpes",
		regionCode: "84",
		departmentCode: "38",
		departmentLabel: "Isère",
	},
];

const PAGINATION_NAFS = [
	{
		code: "16.23Z",
		label: "Fabrication de charpentes et d’autres menuiseries",
	},
	{ code: "41.20B", label: "Construction d’autres bâtiments" },
	{ code: "52.29B", label: "Affrètement et organisation des transports" },
	{ code: "58.11Z", label: "Édition de livres" },
	{ code: "71.12B", label: "Ingénierie et études techniques" },
	{
		code: "72.19Z",
		label: "Recherche-développement en autres sciences physiques",
	},
];

const COMPANIES = [
	{
		siren: "998900001",
		name: "Atelier Horizon Numérique",
		address: "12 avenue de la République, 75011 Paris",
		city: "Paris",
		region: "Île-de-France",
		regionCode: "11",
		departmentCode: "75",
		departmentLabel: "Paris",
		countryCode: null,
		countryLabel: null,
		nafCode: "62.01Z",
		nafLabel: "Programmation informatique",
		workforce: 248,
		statutDiffusion: "O",
		history: [
			{ offset: -3, annual: 0.08, hourly: 0.055, variable: 0.1 },
			{ offset: -2, annual: 0.045, hourly: 0.03, variable: 0 },
			{ offset: -1, annual: 0.012, hourly: -0.02, variable: null },
			{ offset: 0, annual: -0.008, hourly: -0.025, variable: -0.015 },
		],
	},
	{
		siren: "998900002",
		name: "Manufactures du Rhône",
		address: "8 quai Perrache, 69002 Lyon",
		city: "Lyon",
		region: "Auvergne-Rhône-Alpes",
		regionCode: "84",
		departmentCode: "69",
		departmentLabel: "Rhône",
		countryCode: null,
		countryLabel: null,
		nafCode: "25.11Z",
		nafLabel: "Fabrication de structures métalliques",
		workforce: 820,
		statutDiffusion: "O",
		history: [
			{ offset: -2, annual: 0.12, hourly: 0.095, variable: 0.14 },
			{ offset: -1, annual: 0.09, hourly: 0.07, variable: 0.11 },
			{ offset: 0, annual: 0.065, hourly: 0.04, variable: 0.08 },
		],
	},
	{
		siren: "998900003",
		name: "Société confidentielle de démonstration",
		address: "Adresse volontairement masquée",
		city: "Lille",
		region: "Hauts-de-France",
		regionCode: "32",
		departmentCode: "59",
		departmentLabel: "Nord",
		countryCode: null,
		countryLabel: null,
		nafCode: "47.11D",
		nafLabel: "Supermarchés",
		workforce: 62,
		statutDiffusion: "N",
		history: [
			{ offset: -1, annual: 0.03, hourly: 0.02, variable: 0.05 },
			{ offset: 0, annual: 0.015, hourly: 0.005, variable: 0.025 },
		],
	},
	{
		siren: "998900004",
		name: "Brussels Equality Lab",
		address: "Rue de la Loi 16, Bruxelles",
		city: "Bruxelles",
		region: null,
		regionCode: null,
		departmentCode: null,
		departmentLabel: null,
		countryCode: "BE",
		countryLabel: "Belgique",
		nafCode: "70.22Z",
		nafLabel: "Conseil pour les affaires",
		workforce: 1350,
		statutDiffusion: "O",
		history: [
			{ offset: -1, annual: -0.025, hourly: -0.01, variable: -0.04 },
			{ offset: 0, annual: -0.01, hourly: 0, variable: -0.02 },
		],
	},
	{
		siren: "998900005",
		name: "Coopérative Méditerranée",
		address: "4 boulevard National, 13001 Marseille",
		city: "Marseille",
		region: "Provence-Alpes-Côte d’Azur",
		regionCode: "93",
		departmentCode: "13",
		departmentLabel: "Bouches-du-Rhône",
		countryCode: null,
		countryLabel: null,
		nafCode: "10.71C",
		nafLabel: "Boulangerie et boulangerie-pâtisserie",
		workforce: 34,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: 0, hourly: 0, variable: null }],
	},
	{
		siren: "998900006",
		name: "Chantiers de l’Iroise",
		address: "6 rue de Siam, 29200 Brest",
		city: "Brest",
		region: "Bretagne",
		regionCode: "53",
		departmentCode: "29",
		departmentLabel: "Finistère",
		countryCode: null,
		countryLabel: null,
		nafCode: "30.11Z",
		nafLabel: "Construction de navires et de structures flottantes",
		workforce: 55,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: 0.04, hourly: 0.03, variable: 0.02 }],
	},
	{
		siren: "998900007",
		name: "Énergies de Loire",
		address: "18 quai de la Fosse, 44000 Nantes",
		city: "Nantes",
		region: "Pays de la Loire",
		regionCode: "52",
		departmentCode: "44",
		departmentLabel: "Loire-Atlantique",
		countryCode: null,
		countryLabel: null,
		nafCode: "35.11Z",
		nafLabel: "Production d’électricité",
		workforce: 110,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: -0.03, hourly: -0.01, variable: 0.01 }],
	},
	{
		siren: "998900008",
		name: "Aéro Occitanie Services",
		address: "2 avenue Didier Daurat, 31700 Blagnac",
		city: "Blagnac",
		region: "Occitanie",
		regionCode: "76",
		departmentCode: "31",
		departmentLabel: "Haute-Garonne",
		countryCode: null,
		countryLabel: null,
		nafCode: "33.16Z",
		nafLabel: "Réparation et maintenance d’aéronefs",
		workforce: 410,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: 0.07, hourly: 0.05, variable: 0.06 }],
	},
	{
		siren: "998900009",
		name: "Laboratoires du Rhin",
		address: "5 place de l’Hôpital, 67000 Strasbourg",
		city: "Strasbourg",
		region: "Grand Est",
		regionCode: "44",
		departmentCode: "67",
		departmentLabel: "Bas-Rhin",
		countryCode: null,
		countryLabel: null,
		nafCode: "21.20Z",
		nafLabel: "Fabrication de préparations pharmaceutiques",
		workforce: 1600,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: 0.02, hourly: 0.01, variable: 0.03 }],
	},
	{
		siren: "998900010",
		name: "Mobilités Normandes",
		address: "14 rue Jeanne-d’Arc, 76000 Rouen",
		city: "Rouen",
		region: "Normandie",
		regionCode: "28",
		departmentCode: "76",
		departmentLabel: "Seine-Maritime",
		countryCode: null,
		countryLabel: null,
		nafCode: "49.31Z",
		nafLabel: "Transports urbains et suburbains de voyageurs",
		workforce: 88,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: 0.01, hourly: -0.01, variable: null }],
	},
	{
		siren: "998900011",
		name: "Agro Bourgogne Conseil",
		address: "3 place Darcy, 21000 Dijon",
		city: "Dijon",
		region: "Bourgogne-Franche-Comté",
		regionCode: "27",
		departmentCode: "21",
		departmentLabel: "Côte-d’Or",
		countryCode: null,
		countryLabel: null,
		nafCode: "01.61Z",
		nafLabel: "Activités de soutien aux cultures",
		workforce: 275,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: 0.09, hourly: 0.06, variable: 0.08 }],
	},
	{
		siren: "998900012",
		name: "Atelier Insulaire",
		address: "9 cours Napoléon, 20000 Ajaccio",
		city: "Ajaccio",
		region: "Corse",
		regionCode: "94",
		departmentCode: "2A",
		departmentLabel: "Corse-du-Sud",
		countryCode: null,
		countryLabel: null,
		nafCode: "31.09B",
		nafLabel: "Fabrication d’autres meubles",
		workforce: 47,
		statutDiffusion: "O",
		history: [{ offset: 0, annual: -0.02, hourly: -0.03, variable: -0.01 }],
	},
	...PAGINATION_COMPANY_NAMES.map((name, index) => {
		const companyNumber = index + 13;
		const location = PAGINATION_LOCATIONS[index % PAGINATION_LOCATIONS.length];
		const naf = PAGINATION_NAFS[index % PAGINATION_NAFS.length];
		const currentGap = ((index % 9) - 4) / 100;

		return {
			siren: `998900${String(companyNumber).padStart(3, "0")}`,
			name,
			address: `${companyNumber} rue de la Démonstration, ${location.postalCode} ${location.city}`,
			city: location.city,
			region: location.region,
			regionCode: location.regionCode,
			departmentCode: location.departmentCode,
			departmentLabel: location.departmentLabel,
			countryCode: null,
			countryLabel: null,
			nafCode: naf.code,
			nafLabel: naf.label,
			workforce: 60 + index * 87,
			statutDiffusion: "O",
			history: [
				{
					offset: -1,
					annual: currentGap + 0.02,
					hourly: currentGap + 0.01,
					variable: currentGap + 0.03,
				},
				{
					offset: 0,
					annual: currentGap,
					hourly: currentGap - 0.01,
					variable: index % 4 === 0 ? null : currentGap + 0.01,
				},
			],
		};
	}),
];

const SIRENS = COMPANIES.map((company) => company.siren);
const YEARS = [
	...new Set(
		COMPANIES.flatMap((company) =>
			company.history.map((point) => YEAR + point.offset),
		),
	),
].sort((left, right) => left - right);

function indicatorValues(companyIndex, point, workforce) {
	const annual = point.annual;
	const hourly = point.hourly;
	const variable = point.variable;
	const womenShare = 46 + (companyIndex % 10) * 2;
	const quartileShift = (companyIndex % 7) - 2;

	// The headcount split must add up to the company's workforce: the company
	// page shows both, and a demo that contradicts itself reads as a bug.
	const totalWomen = Math.round((workforce * womenShare) / 100);

	return {
		totalWomen,
		totalMen: workforce - totalWomen,
		globalAnnualMeanGap: annual,
		globalHourlyMeanGap: hourly,
		variableAnnualMeanGap: variable,
		variableHourlyMeanGap: variable === null ? null : variable - 0.008,
		globalAnnualMedianGap: annual === null ? null : annual - 0.006,
		globalHourlyMedianGap: hourly === null ? null : hourly - 0.004,
		variableAnnualMedianGap: variable === null ? null : variable - 0.005,
		variableHourlyMedianGap: variable === null ? null : variable - 0.01,
		variableProportionWomen: womenShare / 100,
		variableProportionMen: (womenShare + 5) / 100,
		annualQuartile1Women: (58 + quartileShift) / 100,
		annualQuartile2Women: (54 + quartileShift) / 100,
		annualQuartile3Women: (49 + quartileShift) / 100,
		annualQuartile4Women: (43 + quartileShift) / 100,
		hourlyQuartile1Women: (57 + quartileShift) / 100,
		hourlyQuartile2Women: (53 + quartileShift) / 100,
		hourlyQuartile3Women: (48 + quartileShift) / 100,
		hourlyQuartile4Women: (42 + quartileShift) / 100,
	};
}

function workforceForPoint(company, companyIndex, point) {
	return Math.max(1, company.workforce + point.offset * (companyIndex + 4));
}

async function assertSchema(sql) {
	const rows = await sql`
		SELECT column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'app_company'
			AND column_name IN ('city', 'region_code', 'country_code', 'country_label')
	`;
	if (rows.length !== 4) {
		throw new Error(
			"Observatory columns are missing. Run `pnpm db:migrate` (or `pnpm db:push` on a disposable local database) first.",
		);
	}
}

async function waitForSchema(sql) {
	const deadline = Date.now() + SCHEMA_WAIT_SECONDS * 1000;
	for (;;) {
		try {
			await assertSchema(sql);
			return;
		} catch (error) {
			if (Date.now() >= deadline) throw error;
			console.log("[seed-observatory] waiting for database migrations...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
}

async function cleanRows(sql) {
	await sql`DELETE FROM app_representation_declaration WHERE siren = ANY(${SIRENS})`;
	await sql`
		DELETE FROM app_declaration_status_history
		WHERE declaration_id IN (
			SELECT id FROM app_declaration WHERE siren = ANY(${SIRENS})
		)
	`;
	await sql`DELETE FROM app_declaration WHERE siren = ANY(${SIRENS})`;
	await sql`DELETE FROM app_gip_mds_data WHERE siren = ANY(${SIRENS})`;
	await sql`DELETE FROM app_user_company WHERE siren = ANY(${SIRENS})`;
	await sql`DELETE FROM app_company WHERE siren = ANY(${SIRENS})`;
	await sql`DELETE FROM app_user WHERE id = ${SEED_USER_ID}`;
}

async function clean(sql) {
	await sql.begin(cleanRows);
}

async function main() {
	const sql = postgres(DATABASE_URL, { max: 1 });
	try {
		await waitForSchema(sql);
		if (CLEAN) {
			await clean(sql);
			console.log(`[seed-observatory] cleaned ${SIRENS.length} companies.`);
			return;
		}

		await sql.begin(async (tx) => {
			await cleanRows(tx);
			await tx`
				INSERT INTO app_user (id, email, first_name, last_name, is_admin)
				VALUES (${SEED_USER_ID}, ${SEED_USER_EMAIL}, 'Seed', 'Observatoire', false)
			`;

			for (const year of YEARS) {
				const deadline = `${year}-01-01`;
				const publicReleaseDate = "2000-01-01";
				await tx`
					INSERT INTO app_campaign_deadline (
						year, public_data_release_date,
						decl1_modification_deadline, decl1_justification_deadline,
						decl1_joint_evaluation_deadline, decl2_modification_deadline,
						decl2_justification_deadline, decl2_joint_evaluation_deadline,
						decl2_cse_opinion_deadline
					) VALUES (
						${year}, ${publicReleaseDate}, ${deadline}, ${deadline},
						${deadline}, ${deadline}, ${deadline}, ${deadline}, ${deadline}
					)
					ON CONFLICT (year) DO UPDATE SET
						public_data_release_date = EXCLUDED.public_data_release_date
				`;
			}

			for (const [companyIndex, company] of COMPANIES.entries()) {
				await tx`
					INSERT INTO app_company (
						siren, name, address, city, region, region_code,
						department_code, department_label, country_code, country_label,
						naf_code, naf_label, workforce, has_cse, statut_diffusion,
						created_at, updated_at
					) VALUES (
						${company.siren}, ${company.name}, ${company.address}, ${company.city},
						${company.region}, ${company.regionCode}, ${company.departmentCode},
						${company.departmentLabel}, ${company.countryCode}, ${company.countryLabel},
						${company.nafCode}, ${company.nafLabel}, ${company.workforce}, false,
						${company.statutDiffusion}, NOW(), NOW()
					)
				`;

				for (const point of company.history) {
					const year = YEAR + point.offset;
					const workforce = workforceForPoint(company, companyIndex, point);
					const values = indicatorValues(companyIndex, point, workforce);
					await tx`
						INSERT INTO app_gip_mds_data (siren, year, workforce_ema, imported_at)
						VALUES (${company.siren}, ${year}, ${workforce}, NOW())
					`;
					await tx`
						INSERT INTO app_declaration (
							id, siren, year, declarant_id, status, total_women, total_men,
							global_annual_mean_gap, global_hourly_mean_gap,
							variable_annual_mean_gap, variable_hourly_mean_gap,
							global_annual_median_gap, global_hourly_median_gap,
							variable_annual_median_gap, variable_hourly_median_gap,
							variable_proportion_women, variable_proportion_men,
							annual_quartile1_proportion_women, annual_quartile1_proportion_men,
							annual_quartile2_proportion_women, annual_quartile2_proportion_men,
							annual_quartile3_proportion_women, annual_quartile3_proportion_men,
							annual_quartile4_proportion_women, annual_quartile4_proportion_men,
							hourly_quartile1_proportion_women, hourly_quartile1_proportion_men,
							hourly_quartile2_proportion_women, hourly_quartile2_proportion_men,
							hourly_quartile3_proportion_women, hourly_quartile3_proportion_men,
							hourly_quartile4_proportion_women, hourly_quartile4_proportion_men,
							created_at, updated_at
						) VALUES (
							${`seed-observatory-${company.siren}-${year}`}, ${company.siren}, ${year},
							${SEED_USER_ID}, 'demarche_completed', ${values.totalWomen}, ${values.totalMen},
							${values.globalAnnualMeanGap}, ${values.globalHourlyMeanGap},
							${values.variableAnnualMeanGap}, ${values.variableHourlyMeanGap},
							${values.globalAnnualMedianGap}, ${values.globalHourlyMedianGap},
							${values.variableAnnualMedianGap}, ${values.variableHourlyMedianGap},
							${values.variableProportionWomen}, ${values.variableProportionMen},
							${values.annualQuartile1Women}, ${1 - values.annualQuartile1Women},
							${values.annualQuartile2Women}, ${1 - values.annualQuartile2Women},
							${values.annualQuartile3Women}, ${1 - values.annualQuartile3Women},
							${values.annualQuartile4Women}, ${1 - values.annualQuartile4Women},
							${values.hourlyQuartile1Women}, ${1 - values.hourlyQuartile1Women},
							${values.hourlyQuartile2Women}, ${1 - values.hourlyQuartile2Women},
							${values.hourlyQuartile3Women}, ${1 - values.hourlyQuartile3Women},
							${values.hourlyQuartile4Women}, ${1 - values.hourlyQuartile4Women},
							NOW(), NOW()
						)
					`;
				}

				const representationIsComputable = companyIndex !== 4;
				const executiveWomenPercent = representationIsComputable
					? 30 + companyIndex
					: null;
				const memberWomenPercent = representationIsComputable
					? 40 + companyIndex
					: null;
				await tx`
					INSERT INTO app_representation_declaration (
						id, siren, year, declarant_id,
						reference_period_start, reference_period_end,
						executive_women_percent, executive_men_percent,
						not_computable_reason_executives,
						member_women_percent, member_men_percent,
						not_computable_reason_members,
						publish_date, publish_modalities, status, submitted_at,
						created_at, updated_at
					) VALUES (
						${`seed-observatory-representation-${company.siren}-${YEAR}`},
						${company.siren}, ${YEAR}, ${SEED_USER_ID},
						${`${YEAR - 1}-01-01`}, ${`${YEAR - 1}-12-31`},
						${executiveWomenPercent},
						${executiveWomenPercent === null ? null : 100 - executiveWomenPercent},
						${representationIsComputable ? null : "aucun_cadre_dirigeant"},
						${memberWomenPercent},
						${memberWomenPercent === null ? null : 100 - memberWomenPercent},
						${representationIsComputable ? null : "aucune_instance_dirigeante"},
						${`${YEAR}-03-01`}, 'Publication de démonstration', 'submitted', NOW(),
						NOW(), NOW()
					)
				`;
			}
		});

		const declarationCount = COMPANIES.reduce(
			(total, company) => total + company.history.length,
			0,
		);
		console.log(
			`[seed-observatory] seeded ${COMPANIES.length} companies and ${declarationCount} declarations (${YEARS[0]}–${YEARS.at(-1)}).`,
		);
		console.log(
			"[seed-observatory] open http://localhost:3000/index-egapro/recherche",
		);
		console.log(
			"[seed-observatory] multi-year chart: http://localhost:3000/index-egapro/entreprise/998900001",
		);
		console.log(
			"[seed-observatory] privacy case: http://localhost:3000/index-egapro/entreprise/998900003",
		);
	} finally {
		await sql.end();
	}
}

main().catch((error) => {
	console.error("[seed-observatory] FAILED:", error);
	process.exit(1);
});
