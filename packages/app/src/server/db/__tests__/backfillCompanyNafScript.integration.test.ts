/**
 * Integration test for `scripts/backfill-company-naf.mjs` (issue #4087) — runs
 * against the real Postgres container booted by `src/test/integration-setup.ts`.
 *
 * Why this exists as an integration test: the optimistic lock compares
 * `naf_code`/`naf_label` rather than `updated_at` precisely because
 * `app_company.updated_at` is `timestamp with time zone` (microsecond
 * precision in Postgres) while postgres.js round-trips it through a JS `Date`
 * (millisecond precision). A row stamped by raw SQL `NOW()` — as
 * `backfill-company-region-department.mjs` does on the same table on every
 * deploy — proves the difference only against a real server; a test that
 * mocks the driver would happily accept a millisecond-truncated value on both
 * sides and hide the bug.
 */
import postgres from "postgres";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	applyRegistryPair,
	formatReport,
	runBackfillCompanyNaf,
} from "#scripts/backfill-company-naf.mjs";
import { env } from "~/env.js";

describe("backfill-company-naf.mjs (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;
	const fetchSpy = vi.fn();

	const SIREN = "700000030";

	async function cleanup() {
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
	}

	async function seedCompany(nafCode: string | null, nafLabel: string | null) {
		await sql`
			INSERT INTO app_company (siren, name, naf_code, naf_label, updated_at)
			VALUES (${SIREN}, 'Alpha Solutions', ${nafCode}, ${nafLabel}, NOW())
		`;
	}

	async function storedNaf() {
		const [row] = await sql`
			SELECT naf_code, naf_label FROM app_company WHERE siren = ${SIREN}
		`;
		return row;
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
		fetchSpy.mockReset();
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("repairs a row stamped by raw SQL NOW() — an updated_at lock could never match it", async () => {
		await seedCompany("65.12Y", null);

		const result = await applyRegistryPair({
			sql,
			row: { siren: SIREN, naf_code: "65.12Y", naf_label: null },
			registry: { nafCode: "65.12Z", nafLabel: "Autres assurances" },
			dryRun: false,
		});

		expect(result).toBe("updated");
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Z",
			naf_label: "Autres assurances",
		});
	});

	it("drops the write when the row changed since it was read, and does not clobber the concurrent write", async () => {
		await seedCompany("65.12Y", null);
		await sql`
			UPDATE app_company
			SET naf_code = '65.12Z', naf_label = 'Autres assurances', updated_at = NOW()
			WHERE siren = ${SIREN}
		`;

		const result = await applyRegistryPair({
			sql,
			row: { siren: SIREN, naf_code: "65.12Y", naf_label: null },
			registry: { nafCode: "65.12Z", nafLabel: "Autres assurances" },
			dryRun: false,
		});

		expect(result).toBe("skipped");
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Z",
			naf_label: "Autres assurances",
		});
	});

	it("leaves an already-aligned row untouched", async () => {
		await seedCompany("65.12Z", "Autres assurances");

		const result = await applyRegistryPair({
			sql,
			row: { siren: SIREN, naf_code: "65.12Z", naf_label: "Autres assurances" },
			registry: { nafCode: "65.12Z", nafLabel: "Autres assurances" },
			dryRun: false,
		});

		expect(result).toBe("unchanged");
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Z",
			naf_label: "Autres assurances",
		});
	});

	it("counts a registry failure separately from a skip, with the reason attached", async () => {
		await seedCompany("65.12Y", null);
		fetchSpy.mockResolvedValue({ ok: false, status: 503 });

		const counters = await runBackfillCompanyNaf({
			sql,
			weezApiUrl: "https://weez.example.fr",
			dryRun: false,
		});

		expect(counters.failed).toBeGreaterThanOrEqual(1);
		expect(
			counters.errors.some(
				(error) => error.siren === SIREN && /503/.test(error.cause),
			),
		).toBe(true);
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Y",
			naf_label: null,
		});
	});

	it("leaves the row untouched on a dry run and still reports it as updated", async () => {
		await seedCompany("65.12Y", null);

		const result = await applyRegistryPair({
			sql,
			row: { siren: SIREN, naf_code: "65.12Y", naf_label: null },
			registry: { nafCode: "65.12Z", nafLabel: "Autres assurances" },
			dryRun: true,
		});

		expect(result).toBe("updated");
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Y",
			naf_label: null,
		});
	});

	it("formats a report that lists each failure's siren and cause", () => {
		const report = formatReport(
			{
				updated: 1,
				unchanged: 2,
				skipped: 3,
				failed: 1,
				errors: [{ siren: SIREN, cause: "Weez API error: 503" }],
			},
			false,
		);

		expect(report).toContain("1 updated");
		expect(report).toContain("2 already aligned");
		expect(report).toContain("3 skipped");
		expect(report).toContain("1 failed");
		expect(report).toContain(`siren=${SIREN}`);
		expect(report).toContain("Weez API error: 503");
	});
});
