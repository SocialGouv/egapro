//
// Pure helpers shared by the Observatoire fixture scripts
// (seed-demo-observatory.ts, seed-rgaa-observatory-history.ts).
//
// Importing this module must never parse argv or call `process.exit` — unlike
// the scripts themselves, which do that at their own module top level.
//

import { truncateRatio } from "~/modules/domain";

export type GapProfile = {
	annual: number | null;
	hourly: number | null;
	variable: number | null;
};

function ratioOrNull(ratio: number | null): number | null {
	return ratio === null ? null : truncateRatio(ratio);
}

// `companyIndex` only shifts the women/quartile split, so two companies with the same profile still render differently.
export function indicatorValues(
	companyIndex: number,
	profile: GapProfile,
	workforce: number,
) {
	const { annual, hourly, variable } = profile;
	const womenShare = 46 + (companyIndex % 10) * 2;
	const quartileShift = (companyIndex % 7) - 2;
	const women = (percent: number) =>
		truncateRatio((percent + quartileShift) / 100);
	const complement = (ratio: number) => truncateRatio(1 - ratio);

	// The headcount split must add up to the company's workforce: the company
	// page shows both, and a fixture that contradicts itself reads as a bug.
	const totalWomen = Math.round((workforce * womenShare) / 100);

	return {
		totalWomen,
		totalMen: workforce - totalWomen,
		globalAnnualMeanGap: ratioOrNull(annual),
		globalHourlyMeanGap: ratioOrNull(hourly),
		variableAnnualMeanGap: ratioOrNull(variable),
		variableHourlyMeanGap: ratioOrNull(
			variable === null ? null : variable - 0.008,
		),
		globalAnnualMedianGap: ratioOrNull(annual === null ? null : annual - 0.006),
		globalHourlyMedianGap: ratioOrNull(hourly === null ? null : hourly - 0.004),
		variableAnnualMedianGap: ratioOrNull(
			variable === null ? null : variable - 0.005,
		),
		variableHourlyMedianGap: ratioOrNull(
			variable === null ? null : variable - 0.01,
		),
		variableProportionWomen: truncateRatio(womenShare / 100),
		variableProportionMen: truncateRatio((womenShare + 5) / 100),
		annualQuartile1Women: women(58),
		annualQuartile1Men: complement(women(58)),
		annualQuartile2Women: women(54),
		annualQuartile2Men: complement(women(54)),
		annualQuartile3Women: women(49),
		annualQuartile3Men: complement(women(49)),
		annualQuartile4Women: women(43),
		annualQuartile4Men: complement(women(43)),
		hourlyQuartile1Women: women(57),
		hourlyQuartile1Men: complement(women(57)),
		hourlyQuartile2Women: women(53),
		hourlyQuartile2Men: complement(women(53)),
		hourlyQuartile3Women: women(48),
		hourlyQuartile3Men: complement(women(48)),
		hourlyQuartile4Women: women(42),
		hourlyQuartile4Men: complement(women(42)),
	};
}

export function resolveDatabaseUrl(): string {
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

// Other scripts probe this user to confirm the demo fixture is loaded before writing fictitious data next to it.
export const DEMO_SEED_USER_ID = "00000000-9989-4989-8989-000000009989";
export const DEMO_SEED_USER_EMAIL = "seed-observatory@example.fr";

export const DEMO_PUBLIC_RELEASE_DATE = "2000-01-01";
