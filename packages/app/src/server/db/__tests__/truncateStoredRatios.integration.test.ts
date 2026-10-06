import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { computeIndicatorPercentages } from "~/modules/declaration-remuneration/shared/computeIndicatorPercentages";
import type { GipMdsRow } from "~/modules/declaration-remuneration/shared/gipMdsMapping";

// `integration-setup.ts` migrates an EMPTY container, so the repair only ever runs here.

const SCRATCH_SCHEMA = "migration_4784";
const MIGRATION_MARKER = "(#4784)";
const YEAR = 2100;

const RATIO_COLUMNS: string[] = [
	"global_annual_mean_gap",
	"global_hourly_mean_gap",
	"variable_annual_mean_gap",
	"variable_hourly_mean_gap",
	"global_annual_median_gap",
	"global_hourly_median_gap",
	"variable_annual_median_gap",
	"variable_hourly_median_gap",
	"variable_proportion_women",
	"variable_proportion_men",
	...["annual", "hourly"].flatMap((basis) =>
		[1, 2, 3, 4].flatMap((quartile) =>
			["women", "men"].map(
				(sex) => `${basis}_quartile${quartile}_proportion_${sex}`,
			),
		),
	),
];

const GAP_BLOCKS = [
	{ indicator: "A", kind: "global", stat: "mean" },
	{ indicator: "B", kind: "variable", stat: "mean" },
	{ indicator: "C", kind: "global", stat: "median" },
	{ indicator: "D", kind: "variable", stat: "median" },
] as const;
const BASES = ["Annual", "Hourly"] as const;

type DeclarationRow = Parameters<typeof computeIndicatorPercentages>[0];

type Columns = Record<string, string | number | null>;

function toSnakeCase(name: string): string {
	return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toSnakeColumns(columns: Columns): Columns {
	return Object.fromEntries(
		Object.entries(columns).map(([key, value]) => [toSnakeCase(key), value]),
	);
}

function toCamelCase(name: string): string {
	return name.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function ratiosSetTo(value: string | null): Columns {
	return Object.fromEntries(
		RATIO_COLUMNS.map((column) => [toCamelCase(column), value]),
	);
}

function nullRatios(): Columns {
	return ratiosSetTo(null);
}

describe("#4784 stored ratios truncated — migration replayed on pre-existing rows (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;
	let statements: string[] = [];

	async function readMigrationStatements(): Promise<string[]> {
		const dir = path.join(process.cwd(), "drizzle");
		const files = (await readdir(dir)).filter((name) => name.endsWith(".sql"));
		const contents = await Promise.all(
			files.map(async (name) => await readFile(path.join(dir, name), "utf8")),
		);
		const matches = contents.filter((content) =>
			content.includes(MIGRATION_MARKER),
		);
		const migration = matches[0];
		if (!migration || matches.length > 1) {
			throw new Error(
				`Expected exactly one migration marked "${MIGRATION_MARKER}", found ${matches.length}.`,
			);
		}
		return migration
			.split("--> statement-breakpoint")
			.map((statement) => statement.trim())
			.filter((statement) => statement.length > 0);
	}

	async function seedScratchTables() {
		await sql.unsafe(`DROP SCHEMA IF EXISTS ${SCRATCH_SCHEMA} CASCADE`);
		await sql.unsafe(`CREATE SCHEMA ${SCRATCH_SCHEMA}`);
		for (const table of ["app_declaration", "app_gip_mds_data"]) {
			await sql.unsafe(`
				CREATE TABLE ${SCRATCH_SCHEMA}.${table}
				(LIKE public.${table} INCLUDING ALL)
			`);
		}
	}

	async function insertDeclaration(
		id: string,
		siren: string,
		columns: Columns,
		year = YEAR,
	) {
		const row = {
			id,
			siren,
			year,
			declarant_id: "declarant",
			...toSnakeColumns(columns),
		};
		await sql`INSERT INTO ${sql(SCRATCH_SCHEMA)}.app_declaration ${sql(row)}`;
	}

	async function insertGip(siren: string, columns: Columns, year = YEAR) {
		const row = { siren, year, ...toSnakeColumns(columns) };
		await sql`INSERT INTO ${sql(SCRATCH_SCHEMA)}.app_gip_mds_data ${sql(row)}`;
	}

	async function applyMigration() {
		// `search_path` points the migration's unqualified table names at the scratch copies.
		await sql.unsafe(`SET search_path TO ${SCRATCH_SCHEMA}`);
		try {
			for (const statement of statements) {
				await sql.unsafe(statement);
			}
		} finally {
			await sql.unsafe("SET search_path TO public");
		}
	}

	async function readRow(id: string): Promise<Record<string, string | null>> {
		const rows = await sql<Record<string, string | null>[]>`
			SELECT ${sql(RATIO_COLUMNS)}
			FROM ${sql(SCRATCH_SCHEMA)}.app_declaration
			WHERE id = ${id}
		`;
		const row = rows[0];
		if (!row) throw new Error(`Declaration ${id} not found`);
		return row;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		statements = await readMigrationStatements();
	});

	afterAll(async () => {
		if (!sql) return;
		await sql.unsafe(`DROP SCHEMA IF EXISTS ${SCRATCH_SCHEMA} CASCADE`);
		await sql.end();
	});

	beforeEach(async () => {
		await seedScratchTables();
	});

	it("reads a migration file made of the proportions statement then the gaps statement", () => {
		expect(statements).toHaveLength(2);
		expect(statements[0]).toContain("variable_proportion_women");
		expect(statements[1]).toContain("global_annual_mean_gap");
	});

	it("truncates the proportions and the gap that the numeric cast used to round", async () => {
		await insertDeclaration("legacy", "123456789", {
			...nullRatios(),
			totalWomen: 35,
			totalMen: 20,
			indicatorFAnnualWomen1: 18,
			indicatorFAnnualMen1: 17,
			indicatorFAnnualWomen2: 2,
			indicatorFAnnualMen2: 1,
			indicatorEWomen: "18",
			indicatorAAnnualWomen: "9500.02",
			indicatorAAnnualMen: "10000",
			annualQuartile1ProportionWomen: "0.5143",
			annualQuartile1ProportionMen: "0.4857",
			annualQuartile2ProportionWomen: "0.6667",
			variableProportionWomen: "0.5143",
			globalAnnualMeanGap: "0.0500",
		});

		await applyMigration();

		const row = await readRow("legacy");
		expect(row.annual_quartile1_proportion_women).toBe("0.5142");
		expect(row.annual_quartile1_proportion_men).toBe("0.4857");
		expect(row.annual_quartile2_proportion_women).toBe("0.6666");
		expect(row.annual_quartile2_proportion_men).toBe("0.3333");
		expect(row.variable_proportion_women).toBe("0.5142");
		expect(row.global_annual_mean_gap).toBe("0.0499");
	});

	it("leaves a row that carries ratios but no operand untouched (observatory demo seed shape)", async () => {
		const seedLike = {
			...nullRatios(),
			totalWomen: 120,
			totalMen: 80,
			annualQuartile1ProportionWomen: "0.5800",
			annualQuartile1ProportionMen: "0.4200",
			variableProportionWomen: "0.4600",
			globalAnnualMeanGap: "0.0440",
			variableHourlyMedianGap: "0.0330",
		};
		await insertDeclaration("seed-like", "998900001", seedLike);
		const before = await readRow("seed-like");

		await applyMigration();

		expect(await readRow("seed-like")).toStrictEqual(before);
		expect((await readRow("seed-like")).global_annual_mean_gap).toBe("0.0440");
	});

	it("clears a ratio whose denominator is zero, as the writer does", async () => {
		await insertDeclaration("zero", "123456780", {
			...nullRatios(),
			totalWomen: 0,
			indicatorEWomen: "0",
			indicatorFAnnualWomen1: 0,
			indicatorFAnnualMen1: 0,
			indicatorAAnnualWomen: "10",
			indicatorAAnnualMen: "0",
			annualQuartile1ProportionWomen: "0.5000",
			variableProportionWomen: "0.5000",
			globalAnnualMeanGap: "0.5000",
		});

		await applyMigration();

		const row = await readRow("zero");
		expect(row.annual_quartile1_proportion_women).toBeNull();
		expect(row.variable_proportion_women).toBeNull();
		expect(row.global_annual_mean_gap).toBeNull();
	});

	it("keeps the stored ratio when only one of its two operands is present", async () => {
		await insertDeclaration("half", "123456781", {
			...ratiosSetTo("0.1234"),
			indicatorFAnnualWomen1: 5,
			indicatorFAnnualMen1: null,
			indicatorAAnnualWomen: null,
			indicatorAAnnualMen: "100",
		});

		await applyMigration();

		const row = await readRow("half");
		expect(row.annual_quartile1_proportion_women).toBe("0.1234");
		expect(row.annual_quartile1_proportion_men).toBe("0.1234");
		expect(row.global_annual_mean_gap).toBe("0.1234");
	});

	it("recomputes the gap when the GIP row exists but publishes no gap", async () => {
		await insertGip("111111111", {
			globalAnnualMeanWomen: "1000.00",
			globalAnnualMeanMen: "1100.00",
			globalAnnualMeanGap: null,
		});
		await insertDeclaration("gip-no-gap", "111111111", {
			...nullRatios(),
			indicatorAAnnualWomen: "1000",
			indicatorAAnnualMen: "1100",
		});

		await applyMigration();

		expect((await readRow("gip-no-gap")).global_annual_mean_gap).toBe("0.0909");
	});

	it("keeps the GIP gap while both operands still equal the GIP ones, and recomputes it once one was edited", async () => {
		const gipOperands = {
			globalAnnualMeanWomen: "1000.00",
			globalAnnualMeanMen: "1100.00",
			globalAnnualMeanGap: "0.0912",
			globalHourlyMeanWomen: "10.00",
			globalHourlyMeanMen: "11.00",
			globalHourlyMeanGap: "0.0877",
		};
		await insertGip("111111111", gipOperands);
		await insertDeclaration("gip", "111111111", {
			...nullRatios(),
			indicatorAAnnualWomen: "1000",
			indicatorAAnnualMen: "1100",
			indicatorAHourlyWomen: "10.5",
			indicatorAHourlyMen: "11",
			globalAnnualMeanGap: "0.0909",
			globalHourlyMeanGap: "0.0877",
		});

		await applyMigration();

		const row = await readRow("gip");
		expect(row.global_annual_mean_gap).toBe("0.0912");
		expect(row.global_hourly_mean_gap).toBe("0.0454");
	});

	it("does not borrow the GIP row of another SIREN or another year", async () => {
		await insertGip("111111111", {
			globalAnnualMeanWomen: "1000.00",
			globalAnnualMeanMen: "1100.00",
			globalAnnualMeanGap: "0.9999",
		});
		await insertDeclaration("other-siren", "222222222", {
			...nullRatios(),
			indicatorAAnnualWomen: "1000",
			indicatorAAnnualMen: "1100",
		});
		await insertDeclaration(
			"other-year",
			"111111111",
			{
				...nullRatios(),
				indicatorAAnnualWomen: "1000",
				indicatorAAnnualMen: "1100",
			},
			YEAR + 1,
		);

		await applyMigration();

		expect((await readRow("other-siren")).global_annual_mean_gap).toBe(
			"0.0909",
		);
		expect((await readRow("other-year")).global_annual_mean_gap).toBe("0.0909");
	});

	it("is idempotent: a second pass changes nothing", async () => {
		await insertDeclaration("legacy", "123456789", {
			...nullRatios(),
			indicatorFAnnualWomen1: 18,
			indicatorFAnnualMen1: 17,
			indicatorAAnnualWomen: "9500.02",
			indicatorAAnnualMen: "10000",
			annualQuartile1ProportionWomen: "0.5143",
			globalAnnualMeanGap: "0.0500",
		});
		await applyMigration();
		const afterFirst = await readRow("legacy");

		await applyMigration();

		expect(await readRow("legacy")).toStrictEqual(afterFirst);
		expect(afterFirst.annual_quartile1_proportion_women).toBe("0.5142");
	});

	it("writes, on every one of the 26 columns, exactly what computeIndicatorPercentages computes", async () => {
		let seed = 4784;
		const next = (limit: number) => {
			seed = (seed * 48_271) % 2_147_483_647;
			return seed % limit;
		};
		const amount = () =>
			`${next(500_000)}.${String(next(100)).padStart(2, "0")}`;

		const fixtures = [] as {
			id: string;
			row: Columns;
			gip: GipMdsRow | null;
		}[];

		for (let index = 0; index < 150; index++) {
			const siren = String(300_000_000 + index);
			const row: Columns = {
				totalWomen: next(2000),
				totalMen: next(2000),
				indicatorEWomen: String(next(2000)),
				indicatorEMen: String(next(2000)),
			};
			for (const basis of ["Annual", "Hourly"]) {
				for (const quartile of [1, 2, 3, 4]) {
					row[`indicatorF${basis}Women${quartile}`] = next(600);
					row[`indicatorF${basis}Men${quartile}`] = next(600);
				}
			}
			const gipColumns: Columns = {};
			for (const { indicator, kind, stat } of GAP_BLOCKS) {
				for (const basis of BASES) {
					const women = amount();
					const men = next(20) === 0 ? "0" : amount();
					row[`indicator${indicator}${basis}Women`] = women;
					row[`indicator${indicator}${basis}Men`] = men;
					const gipKey = `${kind}${basis}${toTitle(stat)}`;
					gipColumns[`${gipKey}Women`] = next(2) === 0 ? women : amount();
					gipColumns[`${gipKey}Men`] = next(2) === 0 ? men : amount();
					gipColumns[`${gipKey}Gap`] =
						`0.${String(next(10_000)).padStart(4, "0")}`;
				}
			}
			const hasGip = index % 3 === 0;
			if (hasGip) await insertGip(siren, gipColumns);
			await insertDeclaration(`random-${index}`, siren, {
				...row,
				...ratiosSetTo("0.1234"),
			});
			fixtures.push({
				id: `random-${index}`,
				row,
				gip: hasGip ? (gipColumns as GipMdsRow) : null,
			});
		}

		await applyMigration();

		for (const { id, row, gip } of fixtures) {
			const expected = computeIndicatorPercentages(row as DeclarationRow, gip);
			const stored = await readRow(id);
			for (const [camel, value] of Object.entries(expected)) {
				const column = toSnakeCase(camel);
				expect(
					stored[column] === null ? null : Number(stored[column]),
					`${id} ${column}`,
				).toBe(value);
			}
		}
	}, 120_000);
});

function toTitle(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
