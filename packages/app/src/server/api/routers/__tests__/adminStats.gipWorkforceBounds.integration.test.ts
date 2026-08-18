import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { env } from "~/env.js";
import type { CompanySizeRange } from "~/modules/domain";
import {
	COMPANY_SIZE_RANGES,
	floorWorkforce,
	getObligationWorkforce,
	getOptionalCompanySizeRange,
	isCseRequired,
	parseGipWorkforce,
} from "~/modules/domain";
import {
	assembleDeclaration,
	fetchSubmittedDeclarations,
} from "~/modules/export";
import { adminStatsRouter } from "~/server/api/routers/adminStats";
import { db } from "~/server/db";

// The workforce predicates of `adminStats` are SQL mirrors of domain rules, and
// a unit test that mocks the driver can only assert the SQL text. What the fix
// relies on are properties of the engine itself: that `floor(x) >= 100` and
// `x >= 100` agree on the decimals a `numeric(9,2)` column carries, and that a
// NULL coming out of the LEFT JOIN drops the row from the bucket filters
// without dropping it from the unfiltered totals.
describe("adminStats — GIP workforce bounds (real Postgres, #4185)", () => {
	let sql!: ReturnType<typeof postgres>;

	const USER_ID = "t4185-declarant";
	const DATE_IN_WINDOW = "2091-05-01T00:00:00Z";
	const EXPORT_WINDOW = { begin: "2091-05-01", end: "2091-05-02" };

	type Fixture = {
		label: string;
		siren: string;
		year: number;
		weezWorkforce: number;
		workforceEma: string | null;
		hasGipRow: boolean;
	};

	// Every fixture carries a Weez headcount that contradicts its GIP one, so a
	// predicate still reading `company.workforce` lands on the other verdict.
	const PARITY_UNDER: Fixture = {
		label: "a headcount under the CSE threshold",
		siren: "900000001",
		year: 2091,
		weezWorkforce: 500,
		workforceEma: "99.00",
		hasGipRow: true,
	};
	const PARITY_FLOORS_UNDER: Fixture = {
		label: "a decimal headcount that floors under the threshold",
		siren: "900000002",
		year: 2092,
		weezWorkforce: 500,
		workforceEma: "99.97",
		hasGipRow: true,
	};
	const PARITY_AT: Fixture = {
		label: "a headcount exactly at the threshold",
		siren: "900000003",
		year: 2093,
		weezWorkforce: 10,
		workforceEma: "100.00",
		hasGipRow: true,
	};
	const PARITY_OVER: Fixture = {
		label: "a decimal headcount over the threshold",
		siren: "900000004",
		year: 2094,
		weezWorkforce: 10,
		workforceEma: "100.50",
		hasGipRow: true,
	};
	const PARITY_NULL_EMA: Fixture = {
		label: "a GIP row carrying no headcount",
		siren: "900000005",
		year: 2095,
		weezWorkforce: 500,
		workforceEma: null,
		hasGipRow: true,
	};
	const PARITY_NO_GIP_ROW: Fixture = {
		label: "no GIP row at all",
		siren: "900000006",
		year: 2096,
		weezWorkforce: 500,
		workforceEma: null,
		hasGipRow: false,
	};

	// One campaign year each, so a single `getCompletionFunnel` call isolates one
	// fixture and the parity is asserted line by line rather than in aggregate.
	const PARITY_FIXTURES = [
		PARITY_UNDER,
		PARITY_FLOORS_UNDER,
		PARITY_AT,
		PARITY_OVER,
		PARITY_NULL_EMA,
		PARITY_NO_GIP_ROW,
	];

	const BUCKET_YEAR = 2097;
	const BUCKET_FIXTURES: Fixture[] = [
		{
			label: "GIP 49,99 against a Weez 300",
			siren: "900000011",
			year: BUCKET_YEAR,
			weezWorkforce: 300,
			workforceEma: "49.99",
			hasGipRow: true,
		},
		{
			label: "GIP 80 against a Weez 120",
			siren: "900000012",
			year: BUCKET_YEAR,
			weezWorkforce: 120,
			workforceEma: "80.00",
			hasGipRow: true,
		},
		{
			label: "GIP 130 against a Weez 40",
			siren: "900000013",
			year: BUCKET_YEAR,
			weezWorkforce: 40,
			workforceEma: "130.00",
			hasGipRow: true,
		},
		{
			label: "GIP 150 against a Weez 60",
			siren: "900000014",
			year: BUCKET_YEAR,
			weezWorkforce: 60,
			workforceEma: "150.00",
			hasGipRow: true,
		},
		{
			label: "GIP 250 against a Weez 40",
			siren: "900000015",
			year: BUCKET_YEAR,
			weezWorkforce: 40,
			workforceEma: "250.00",
			hasGipRow: true,
		},
		{
			label: "absent from the GIP file with a Weez 30",
			siren: "900000016",
			year: BUCKET_YEAR,
			weezWorkforce: 30,
			workforceEma: null,
			hasGipRow: false,
		},
	];

	const ALL_FIXTURES = [...PARITY_FIXTURES, ...BUCKET_FIXTURES];
	const ALL_SIRENS = ALL_FIXTURES.map((fixture) => fixture.siren);
	const ALL_YEARS = [...new Set(ALL_FIXTURES.map((fixture) => fixture.year))];
	const SIZE_RANGE_KEYS = Object.keys(
		COMPANY_SIZE_RANGES,
	) as CompanySizeRange[];

	function declarationId(fixture: Fixture): string {
		return `t4185-decl-${fixture.siren}`;
	}

	// The rule as TypeScript states it, applied to the very value the LEFT JOIN
	// hands the export: `getObligationWorkforce` fabricates a 0 for an absence,
	// where SQL lets the NULL sink the row out of the WHERE.
	function isSubjectInTypeScript(fixture: Fixture): boolean {
		return isCseRequired(
			getObligationWorkforce(parseGipWorkforce(fixture.workforceEma)),
		);
	}

	function bucketInTypeScript(fixture: Fixture): CompanySizeRange | undefined {
		return getOptionalCompanySizeRange(
			floorWorkforce(parseGipWorkforce(fixture.workforceEma)),
		);
	}

	function createCaller() {
		return adminStatsRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: "t4185-agent@example.fr",
					siret: `${PARITY_UNDER.siren}00015`,
					isAdmin: true,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	async function funnelCounts(
		year: number,
		sizeRange?: CompanySizeRange,
	): Promise<{ total: number; cse: number }> {
		const result = await createCaller().getCompletionFunnel(
			sizeRange === undefined ? { year } : { year, sizeRange },
		);
		return {
			total: result.mainFunnel[0]?.count ?? 0,
			cse: result.cseFunnel[0]?.count ?? 0,
		};
	}

	async function cleanup() {
		await sql`DELETE FROM app_declaration WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	async function seed() {
		await sql`
			INSERT INTO app_user (id, email)
			VALUES (${USER_ID}, 't4185-declarant@example.fr')
		`;
		for (const fixture of ALL_FIXTURES) {
			await sql`
				INSERT INTO app_company (siren, name, workforce, has_cse)
				VALUES (${fixture.siren}, ${`Société Démo ${fixture.siren}`}, ${fixture.weezWorkforce}, true)
			`;
			if (fixture.hasGipRow) {
				await sql`
					INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
					VALUES (${fixture.siren}, ${fixture.year}, ${fixture.workforceEma})
				`;
			}
			await sql`
				INSERT INTO app_declaration (id, siren, year, declarant_id, status, created_at, updated_at)
				VALUES (${declarationId(fixture)}, ${fixture.siren}, ${fixture.year}, ${USER_ID}, 'demarche_completed', ${DATE_IN_WINDOW}, ${DATE_IN_WINDOW})
			`;
			await sql`
				INSERT INTO app_declaration_status_history (id, declaration_id, event_type, round, created_at)
				VALUES (${`${declarationId(fixture)}-start`}, ${declarationId(fixture)}, 'step_change', 0, ${DATE_IN_WINDOW})
			`;
		}
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
		await seed();
	});

	// Anti-drift lock: the CSE bound now exists twice, as `isCseRequired` in the
	// domain and as a floored SQL predicate in the funnel. Nothing but this test
	// makes the second follow the first the day the threshold moves.
	describe("CSE bound parity — SQL predicate ↔ isCseRequired", () => {
		it.each(
			PARITY_FIXTURES,
		)("classifies $label like the domain rule does", async (fixture) => {
			const { cse } = await funnelCounts(fixture.year);

			expect(cse).toBe(isSubjectInTypeScript(fixture) ? 1 : 0);
		});

		it("exercises both verdicts, so the parity cases cannot all agree vacuously", () => {
			const verdicts = new Set(PARITY_FIXTURES.map(isSubjectInTypeScript));

			expect(verdicts).toEqual(new Set([true, false]));
		});

		// The two sides reach "not subject" by different instructions: TypeScript
		// fabricates a 0 out of the absence, SQL lets the NULL sink the row out of
		// the WHERE. Nothing in either implementation says they must coincide.
		it("agrees on both absences, though one fabricates a 0 and the other propagates a NULL", async () => {
			expect(getObligationWorkforce(parseGipWorkforce(null))).toBe(0);

			expect((await funnelCounts(PARITY_NULL_EMA.year)).cse).toBe(0);
			expect((await funnelCounts(PARITY_NO_GIP_ROW.year)).cse).toBe(0);
		});

		// `floor(x) >= 100 ⟺ x >= 100` is what lets the floored funnel and the
		// unfloored export agree; a `round()` would break it on 99,97.
		it("keeps a headcount that floors under the threshold out, and the exact threshold in", async () => {
			expect((await funnelCounts(PARITY_FLOORS_UNDER.year)).cse).toBe(0);
			expect((await funnelCounts(PARITY_AT.year)).cse).toBe(1);
		});
	});

	// Second mirror pair: `gipSizeRangeFilter` against `getOptionalCompanySizeRange`.
	describe("size bucket parity — SQL predicate ↔ getOptionalCompanySizeRange", () => {
		it.each(
			SIZE_RANGE_KEYS,
		)("puts the same declarations in %s as the domain rule does", async (sizeRange) => {
			const expected = BUCKET_FIXTURES.filter(
				(fixture) => bucketInTypeScript(fixture) === sizeRange,
			).length;

			expect((await funnelCounts(BUCKET_YEAR, sizeRange)).total).toBe(expected);
		});

		it("spreads the bucket fixtures over every bucket plus the no-bucket case", () => {
			const buckets = BUCKET_FIXTURES.map(bucketInTypeScript);

			expect(new Set(buckets)).toEqual(
				new Set([...SIZE_RANGE_KEYS, undefined]),
			);
		});
	});

	describe("LEFT JOIN on the GIP file with the NULL propagated", () => {
		it("keeps a company absent from the GIP file in the unfiltered total", async () => {
			expect((await funnelCounts(BUCKET_YEAR)).total).toBe(
				BUCKET_FIXTURES.length,
			);
		});

		// The `coalesce(workforce_ema, 0)` variant answers this one with 2: it
		// turns "headcount unknown" into "small company".
		it("leaves a company absent from the GIP file out of the smallest bucket", async () => {
			expect((await funnelCounts(BUCKET_YEAR, "<50")).total).toBe(1);
		});

		it("buckets on the GIP headcount and not on the Weez one", async () => {
			expect((await funnelCounts(BUCKET_YEAR, "50-99")).total).toBe(1);
			expect((await funnelCounts(BUCKET_YEAR, "100-149")).total).toBe(1);
		});
	});

	describe("the CSE funnel population", () => {
		// The reported symptom: `has_cse = true` alone counts the answers entered
		// before the 100-employee guard, by companies now under the threshold.
		it("drops the legacy CSE answers of companies under the threshold", async () => {
			const { total, cse } = await funnelCounts(BUCKET_YEAR);

			expect(total).toBe(BUCKET_FIXTURES.length);
			expect(cse).toBe(BUCKET_FIXTURES.filter(isSubjectInTypeScript).length);
			expect(cse).toBeLessThan(total);
		});

		// The literal acceptance criterion of the ticket: the funnel and the SUIT
		// export must count the same subject population.
		it("counts exactly the declarations the export gives a CSE_existant", async () => {
			const rows = await fetchSubmittedDeclarations(
				EXPORT_WINDOW.begin,
				EXPORT_WINDOW.end,
			);
			const exportDenominator = rows
				.map((row) => assembleDeclaration(row, [], []))
				.filter((declaration) => declaration.CSE_existant !== null).length;

			let funnelTotal = 0;
			for (const year of ALL_YEARS) {
				funnelTotal += (await funnelCounts(year)).cse;
			}

			expect(exportDenominator).toBe(
				ALL_FIXTURES.filter(isSubjectInTypeScript).length,
			);
			expect(funnelTotal).toBe(exportDenominator);
		});
	});
});
