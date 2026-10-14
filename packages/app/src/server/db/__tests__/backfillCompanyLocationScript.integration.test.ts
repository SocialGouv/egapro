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
	applyLocation,
	assertSchema,
	type CompanyLocationRow,
	formatReport,
	processRow,
	runBackfillCompanyLocation,
} from "#scripts/backfill-company-region-department";
import { env } from "~/env.js";

const WEEZ_API_URL = "https://weez.example.fr";

const SIREN_FRENCH_NO_COUNTRY = "710000001";
const SIREN_BARE = "710000002";
const SIREN_BELGIAN_HEAD_OFFICE = "710000003";
const SIREN_SILENT_HEAD_OFFICE = "710000004";
const SIREN_FAILING_HEAD_OFFICE = "710000005";
const SIREN_KNOWN_FOREIGN = "710000006";
const SIREN_KNOWN_FRENCH = "710000007";
const SIREN_ALIGNED = "710000008";
const SIREN_DECLARED_FOREIGN = "710000009";
const SIREN_UNRESOLVED_POSTAL = "710000010";
const SIREN_NOT_FOUND = "710000011";
const SIREN_FAILING_LEGAL_UNIT = "710000012";
const ALL_SIRENS = [
	SIREN_FRENCH_NO_COUNTRY,
	SIREN_BARE,
	SIREN_BELGIAN_HEAD_OFFICE,
	SIREN_SILENT_HEAD_OFFICE,
	SIREN_FAILING_HEAD_OFFICE,
	SIREN_KNOWN_FOREIGN,
	SIREN_KNOWN_FRENCH,
	SIREN_ALIGNED,
	SIREN_DECLARED_FOREIGN,
	SIREN_UNRESOLVED_POSTAL,
	SIREN_NOT_FOUND,
	SIREN_FAILING_LEGAL_UNIT,
];

const PARIS = {
	city: "PARIS",
	region_code: "11",
	region: "Île-de-France",
	department_code: "75",
	department_label: "Paris",
};

const NO_GEOGRAPHY = {
	region_code: null,
	region: null,
	department_code: null,
	department_label: null,
};

type LegalUnit = {
	codepostal?: string | null;
	libellecommune?: string | null;
	codepaysetrangeretablissement?: string | null;
	libellepaysetrangeretablissement?: string | null;
};

type RegistryAnswer = { status: number; body?: unknown };

const legalUnits: Record<string, RegistryAnswer> = {
	[SIREN_FRENCH_NO_COUNTRY]: {
		status: 200,
		body: { content: [{ codepostal: "75002", libellecommune: "PARIS" }] },
	},
	[SIREN_BARE]: {
		status: 200,
		body: { content: [{ codepostal: "69003", libellecommune: "LYON" }] },
	},
	[SIREN_ALIGNED]: {
		status: 200,
		body: { content: [{ codepostal: "75002", libellecommune: null }] },
	},
	[SIREN_DECLARED_FOREIGN]: {
		status: 200,
		body: {
			content: [
				{
					codepostal: "10001",
					libellecommune: "NEW YORK",
					codepaysetrangeretablissement: "99404",
					libellepaysetrangeretablissement: "ETATS-UNIS",
				} satisfies LegalUnit,
			],
		},
	},
	[SIREN_UNRESOLVED_POSTAL]: {
		status: 200,
		body: { content: [{ codepostal: "00100", libellecommune: "NULLEPART" }] },
	},
	[SIREN_NOT_FOUND]: { status: 200, body: { content: [] } },
	[SIREN_FAILING_LEGAL_UNIT]: { status: 503 },
};

const headOffices: Record<string, RegistryAnswer> = {
	[SIREN_BELGIAN_HEAD_OFFICE]: {
		status: 200,
		body: {
			content: [
				{
					codepaysetrangeretablissement: "99131",
					libellepaysetrangeretablissement: "BELGIQUE",
				},
			],
		},
	},
	[SIREN_SILENT_HEAD_OFFICE]: {
		status: 200,
		body: {
			codepaysetrangeretablissement: null,
			libellepaysetrangeretablissement: null,
		},
	},
	[SIREN_FAILING_HEAD_OFFICE]: { status: 503 },
	[SIREN_KNOWN_FRENCH]: { status: 200, body: {} },
};

const LEGAL_UNIT_WITHOUT_LOCATION: RegistryAnswer = {
	status: 200,
	body: { content: [{ codepostal: null, libellecommune: null }] },
};

function registryResponse(url: URL): RegistryAnswer {
	const siren = url.searchParams.get("siren") ?? "";
	if (url.pathname.endsWith("/findbysiren")) {
		return (
			legalUnits[siren] ??
			(ALL_SIRENS.includes(siren)
				? LEGAL_UNIT_WITHOUT_LOCATION
				: { status: 200, body: { content: [] } })
		);
	}
	return headOffices[siren] ?? { status: 404 };
}

describe("backfill-company-region-department (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;
	const fetchSpy = vi.fn();

	async function cleanup() {
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
	}

	async function seedCompany(
		siren: string,
		location: Partial<Omit<CompanyLocationRow, "siren">> = {},
	) {
		await sql`
			INSERT INTO app_company (
				siren, name, city, region_code, region, department_code,
				department_label, country_code, country_label, updated_at
			) VALUES (
				${siren}, 'Société Démo', ${location.city ?? null},
				${location.region_code ?? null}, ${location.region ?? null},
				${location.department_code ?? null}, ${location.department_label ?? null},
				${location.country_code ?? null}, ${location.country_label ?? null}, NOW()
			)
		`;
	}

	async function readCompany(siren: string) {
		const [row] = await sql<(CompanyLocationRow & { updated_at: string })[]>`
			SELECT siren, city, region_code, region, department_code, department_label,
				country_code, country_label, updated_at::text AS updated_at
			FROM app_company WHERE siren = ${siren}
		`;
		if (!row) throw new Error(`company ${siren} is not seeded`);
		return row;
	}

	function registryCallsFor(siren: string, endpoint: string) {
		return fetchSpy.mock.calls
			.map(([url]) => url as URL)
			.filter(
				(url) =>
					url.pathname.endsWith(endpoint) &&
					url.searchParams.get("siren") === siren,
			);
	}

	function runJob(dryRun = false) {
		return runBackfillCompanyLocation({
			sql,
			weezApiUrl: WEEZ_API_URL,
			dryRun,
		});
	}

	async function processStoredRow(siren: string, dryRun = false) {
		const { updated_at: _updatedAt, ...row } = await readCompany(siren);
		return processRow({ sql, weezApiUrl: WEEZ_API_URL, row, dryRun });
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
		fetchSpy.mockImplementation(async (url: URL) => {
			const answer = registryResponse(url);
			return {
				ok: answer.status >= 200 && answer.status < 300,
				status: answer.status,
				json: async () => answer.body,
			};
		});
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("finds the location columns it rewrites", async () => {
		await expect(assertSchema(sql)).resolves.toBeUndefined();
	});

	it("sets France on a located row stamped by SQL NOW(), which an updated_at lock could never match", async () => {
		await seedCompany(SIREN_FRENCH_NO_COUNTRY, PARIS);

		await runJob();

		expect(await readCompany(SIREN_FRENCH_NO_COUNTRY)).toMatchObject({
			...PARIS,
			country_code: null,
			country_label: "FRANCE",
		});
	});

	it("fills France, geography and commune on a row reduced to its SIREN and name", async () => {
		await seedCompany(SIREN_BARE);

		await runJob();

		expect(await readCompany(SIREN_BARE)).toMatchObject({
			city: "LYON",
			region_code: "84",
			region: "Auvergne-Rhône-Alpes",
			department_code: "69",
			department_label: "Rhône",
			country_code: null,
			country_label: "FRANCE",
		});
	});

	it("sets the head-office country and clears the geography when the legal unit has no postal code", async () => {
		await seedCompany(SIREN_BELGIAN_HEAD_OFFICE, PARIS);

		await runJob();

		expect(await readCompany(SIREN_BELGIAN_HEAD_OFFICE)).toMatchObject({
			city: "PARIS",
			...NO_GEOGRAPHY,
			country_code: "99131",
			country_label: "BELGIQUE",
		});
	});

	it("keeps the declared foreign country of the legal unit over a French-looking postal code", async () => {
		await seedCompany(SIREN_DECLARED_FOREIGN);

		expect(await processStoredRow(SIREN_DECLARED_FOREIGN)).toEqual({
			siren: SIREN_DECLARED_FOREIGN,
			outcome: "updated",
		});
		expect(await readCompany(SIREN_DECLARED_FOREIGN)).toMatchObject({
			city: "NEW YORK",
			...NO_GEOGRAPHY,
			country_code: "99404",
			country_label: "ETATS-UNIS",
		});
		expect(
			registryCallsFor(SIREN_DECLARED_FOREIGN, "/etablissementsiege"),
		).toHaveLength(0);
	});

	it("never writes an unknown country, and asks the registry again on the next run", async () => {
		await seedCompany(SIREN_SILENT_HEAD_OFFICE);
		await seedCompany(SIREN_FAILING_HEAD_OFFICE);
		const before = {
			silent: await readCompany(SIREN_SILENT_HEAD_OFFICE),
			failing: await readCompany(SIREN_FAILING_HEAD_OFFICE),
		};

		const first = await runJob();
		const second = await runJob();

		expect(await readCompany(SIREN_SILENT_HEAD_OFFICE)).toEqual(before.silent);
		expect(await readCompany(SIREN_FAILING_HEAD_OFFICE)).toEqual(
			before.failing,
		);
		expect(
			registryCallsFor(SIREN_SILENT_HEAD_OFFICE, "/findbysiren"),
		).toHaveLength(2);
		expect(
			registryCallsFor(SIREN_FAILING_HEAD_OFFICE, "/findbysiren"),
		).toHaveLength(2);
		for (const counters of [first, second]) {
			expect(counters.unresolved).toBeGreaterThanOrEqual(1);
			expect(counters.errors).toContainEqual({
				siren: SIREN_FAILING_HEAD_OFFICE,
				cause: `Weez API error: 503 ${SIREN_FAILING_HEAD_OFFICE}`,
			});
		}
	});

	it("reports a silent head office as unresolved and a failing one as failed", async () => {
		await seedCompany(SIREN_SILENT_HEAD_OFFICE);
		await seedCompany(SIREN_FAILING_HEAD_OFFICE);

		expect(await processStoredRow(SIREN_SILENT_HEAD_OFFICE)).toEqual({
			siren: SIREN_SILENT_HEAD_OFFICE,
			outcome: "unresolved",
		});
		expect(await processStoredRow(SIREN_FAILING_HEAD_OFFICE)).toMatchObject({
			siren: SIREN_FAILING_HEAD_OFFICE,
			outcome: "failed",
		});
	});

	it("reports a legal unit the registry does not know as unresolved", async () => {
		await seedCompany(SIREN_NOT_FOUND);

		expect(await processStoredRow(SIREN_NOT_FOUND)).toEqual({
			siren: SIREN_NOT_FOUND,
			outcome: "unresolved",
		});
	});

	it("reports a failing legal-unit lookup as failed without writing", async () => {
		await seedCompany(SIREN_FAILING_LEGAL_UNIT);
		const before = await readCompany(SIREN_FAILING_LEGAL_UNIT);

		expect(await processStoredRow(SIREN_FAILING_LEGAL_UNIT)).toEqual({
			siren: SIREN_FAILING_LEGAL_UNIT,
			outcome: "failed",
			cause: `Weez API error: 503 ${SIREN_FAILING_LEGAL_UNIT}`,
		});
		expect(await readCompany(SIREN_FAILING_LEGAL_UNIT)).toEqual(before);
	});

	it("does not select a known foreign company that has no commune", async () => {
		await seedCompany(SIREN_KNOWN_FOREIGN, {
			country_code: "99131",
			country_label: "BELGIQUE",
		});

		await runJob();

		expect(registryCallsFor(SIREN_KNOWN_FOREIGN, "/findbysiren")).toHaveLength(
			0,
		);
	});

	it("keeps France on a known French company when the registry has neither postal code nor head-office country", async () => {
		await seedCompany(SIREN_KNOWN_FRENCH, {
			...PARIS,
			city: null,
			country_label: "FRANCE",
		});

		await runJob();

		expect(registryCallsFor(SIREN_KNOWN_FRENCH, "/findbysiren")).toHaveLength(
			1,
		);
		expect(await readCompany(SIREN_KNOWN_FRENCH)).toMatchObject({
			...PARIS,
			city: null,
			country_label: "FRANCE",
		});
	});

	it("keeps the stored geography when the postal code resolves no department", async () => {
		await seedCompany(SIREN_UNRESOLVED_POSTAL, PARIS);

		await runJob();

		expect(await readCompany(SIREN_UNRESOLVED_POSTAL)).toMatchObject({
			...PARIS,
			city: "NULLEPART",
			country_label: "FRANCE",
		});
	});

	it("drops the write when the row changed since it was read, and keeps the concurrent write", async () => {
		await seedCompany(SIREN_FRENCH_NO_COUNTRY);
		const { updated_at: _updatedAt, ...staleRow } = await readCompany(
			SIREN_FRENCH_NO_COUNTRY,
		);
		await sql`
			UPDATE app_company SET city = 'MARSEILLE', updated_at = NOW()
			WHERE siren = ${SIREN_FRENCH_NO_COUNTRY}
		`;

		const outcome = await applyLocation({
			sql,
			row: staleRow,
			target: { ...PARIS, country_code: null, country_label: "FRANCE" },
			dryRun: false,
		});

		expect(outcome).toBe("skipped");
		expect(await readCompany(SIREN_FRENCH_NO_COUNTRY)).toMatchObject({
			city: "MARSEILLE",
			country_label: null,
		});
	});

	it("does not rewrite a row already aligned with the registry", async () => {
		await seedCompany(SIREN_ALIGNED, {
			...PARIS,
			city: null,
			country_label: "FRANCE",
		});
		const before = await readCompany(SIREN_ALIGNED);

		expect(await processStoredRow(SIREN_ALIGNED)).toEqual({
			siren: SIREN_ALIGNED,
			outcome: "unchanged",
		});
		expect(await readCompany(SIREN_ALIGNED)).toEqual(before);
	});

	it("leaves a repaired row untouched on the next run", async () => {
		await seedCompany(SIREN_BARE);
		await runJob();
		const repaired = await readCompany(SIREN_BARE);

		await runJob();

		expect(await readCompany(SIREN_BARE)).toEqual(repaired);
	});

	it("requests ceased and non-diffusible legal units from the registry", async () => {
		await seedCompany(SIREN_BARE);

		await runJob();

		const [url] = registryCallsFor(SIREN_BARE, "/findbysiren");
		expect(url?.searchParams.get("inclure_cesse")).toBe("true");
		expect(url?.searchParams.get("inclure_non_diffusibles")).toBe("true");
		expect(url?.searchParams.get("page")).toBe("0");
	});

	it("asks the head office with a JSON Accept header", async () => {
		await seedCompany(SIREN_BELGIAN_HEAD_OFFICE);

		await processStoredRow(SIREN_BELGIAN_HEAD_OFFICE);

		const call = fetchSpy.mock.calls.find(([url]) =>
			(url as URL).pathname.endsWith("/etablissementsiege"),
		);
		expect(call?.[1]).toMatchObject({
			headers: { Accept: "application/json" },
		});
	});

	it("writes nothing on a dry run and still counts the row as updated", async () => {
		await seedCompany(SIREN_BARE);
		const before = await readCompany(SIREN_BARE);

		const counters = await runJob(true);

		expect(counters.updated).toBeGreaterThanOrEqual(1);
		expect(await readCompany(SIREN_BARE)).toEqual(before);
	});

	it("formats a report that counts each outcome and lists every failure", () => {
		const counters = {
			updated: 1,
			unchanged: 2,
			unresolved: 3,
			skipped: 4,
			failed: 1,
			errors: [
				{
					siren: SIREN_FAILING_HEAD_OFFICE,
					cause: "Weez API error: 503",
				},
			],
		};

		expect(formatReport(counters, false)).toBe(
			[
				"Backfill done: 1 updated, 2 already aligned, 3 unresolved, 4 skipped, 1 failed",
				`siren=${SIREN_FAILING_HEAD_OFFICE} cause=Weez API error: 503`,
			].join("\n"),
		);
		expect(formatReport(counters, true)).toMatch(/^\[dry-run\] Backfill done:/);
	});
});
