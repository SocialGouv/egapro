/**
 * Integration test for `scripts/import-v1-representation.mjs` — runs against
 * the real Postgres container booted by `src/test/integration-setup.ts`.
 *
 * Why this exists as an integration test (issue #4156):
 *  The import bypasses the drizzle schema entirely: raw upsert SQL, a jsonb
 *  `legacy_declarant`, two pgEnum columns, `numeric(5,2)` percentages, a
 *  `date` reference period, an `ON CONFLICT DO NOTHING` company insert and a
 *  `sql.begin()` transaction. Only a real database proves the FK to
 *  `app_company`, the enum values are accepted, and the three upsert branches
 *  (insert / update / skip) key correctly off the `(siren, year)` unique
 *  index. A mocked driver would hide all of it.
 *
 * The V1 `representation_equilibree` table is not part of this repo's drizzle
 * schema (it lives in the legacy V1 database), so the suite creates and drops
 * a throwaway copy of it and points the script's `legacySql` client at the
 * same container.
 */

import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runImportV1Representation } from "#scripts/import-v1-representation.mjs";
import { env } from "~/env.js";
import {
	V1_DECLARANT,
	type V1RepresentationCompany,
	type V1RepresentationRow,
	v1Company,
	v1Data,
	v1Indicator,
	v1Row,
} from "~/test/v1RepresentationFixtures";

const SIREN_A = "800000001";
const SIREN_B = "800000002";
const SIREN_C = "800000003";
const SIREN_D = "800000004";
const ALL_SIRENS = [SIREN_A, SIREN_B, SIREN_C, SIREN_D];

const WIDE_FROM = new Date("2020-01-01T00:00:00.000Z");
const WIDE_TO = new Date("2030-01-01T00:00:00.000Z");
const DECLARED_AT = new Date("2023-06-15T09:30:00.000Z");
const MODIFIED_AT = new Date("2023-06-16T14:45:00.000Z");

type DeclarationRow = {
	created_at: Date;
	current_step: number;
	declarant_id: string | null;
	executive_men_percent: string | null;
	executive_women_percent: string | null;
	imported_from_v1_at: Date | null;
	legacy_declarant: Record<string, string> | null;
	member_men_percent: string | null;
	member_women_percent: string | null;
	not_computable_reason_executives: string | null;
	not_computable_reason_members: string | null;
	publish_date: string | null;
	publish_modalities: string | null;
	publish_url: string | null;
	reference_period_end: string | null;
	reference_period_start: string | null;
	siren: string;
	status: string;
	submitted_at: Date | null;
	updated_at: Date | null;
	year: number;
};

type CompanyRow = {
	address: string | null;
	department_code: string | null;
	department_label: string | null;
	naf_code: string | null;
	name: string;
	region: string | null;
	siren: string;
};

describe("import-v1-representation.mjs (integration)", () => {
	let sql!: ReturnType<typeof postgres>;
	let legacySql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		legacySql = postgres(env.DATABASE_URL, { max: 1 });
		await legacySql`
			CREATE TABLE IF NOT EXISTS representation_equilibree (
				siren varchar(9) NOT NULL,
				year integer NOT NULL,
				declared_at timestamptz NOT NULL,
				modified_at timestamptz NOT NULL,
				ft text,
				data jsonb NOT NULL,
				PRIMARY KEY (siren, year)
			)
		`;
	});

	afterAll(async () => {
		await cleanup();
		await legacySql`DROP TABLE IF EXISTS representation_equilibree`;
		await sql.end();
		await legacySql.end();
	});

	beforeEach(cleanup);

	async function cleanup() {
		await legacySql`TRUNCATE representation_equilibree`;
		await sql`DELETE FROM app_representation_declaration WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
	}

	async function seedLegacy(overrides: Partial<V1RepresentationRow> = {}) {
		const base = v1Row({
			siren: SIREN_A,
			declared_at: DECLARED_AT,
			modified_at: MODIFIED_AT,
			...overrides,
		});
		// V1 always carries the same siren in the column and in the jsonb payload.
		const row = {
			...base,
			data: {
				...base.data,
				...(base.data.entreprise
					? { entreprise: { ...base.data.entreprise, siren: base.siren } }
					: {}),
			},
		};
		await legacySql`
			INSERT INTO representation_equilibree (siren, year, declared_at, modified_at, ft, data)
			VALUES (
				${row.siren}, ${row.year}, ${row.declared_at}, ${row.modified_at},
				${row.data.entreprise?.raison_sociale ?? null},
				${legacySql.json(row.data)}
			)
		`;
		return row;
	}

	function runImport(
		overrides: { dryRun?: boolean; from?: Date; to?: Date } = {},
	) {
		return runImportV1Representation({
			legacySql,
			sql,
			from: WIDE_FROM,
			to: WIDE_TO,
			dryRun: false,
			...overrides,
		});
	}

	async function readDeclaration(siren: string, year = 2023) {
		const [row] = await sql<DeclarationRow[]>`
			SELECT
				siren, year, declarant_id, legacy_declarant, imported_from_v1_at,
				reference_period_start::text AS reference_period_start,
				reference_period_end::text AS reference_period_end,
				executive_women_percent::text AS executive_women_percent,
				executive_men_percent::text AS executive_men_percent,
				not_computable_reason_executives,
				member_women_percent::text AS member_women_percent,
				member_men_percent::text AS member_men_percent,
				not_computable_reason_members,
				publish_date::text AS publish_date,
				publish_url, publish_modalities,
				current_step, status, submitted_at, created_at, updated_at
			FROM app_representation_declaration
			WHERE siren = ${siren} AND year = ${year}
		`;
		return row;
	}

	async function readCompany(siren: string) {
		const [row] = await sql<CompanyRow[]>`
			SELECT siren, name, address, naf_code, region, department_code, department_label
			FROM app_company WHERE siren = ${siren}
		`;
		return row;
	}

	async function readSirens() {
		const rows = await sql<{ siren: string }[]>`
			SELECT siren FROM app_representation_declaration
			WHERE siren IN ${sql(ALL_SIRENS)} ORDER BY siren
		`;
		return rows.map((row) => row.siren);
	}

	async function seedNativeDeclaration(siren: string) {
		await sql`INSERT INTO app_company (siren, name) VALUES (${siren}, 'Nom Natif V2')`;
		await sql`
			INSERT INTO app_representation_declaration (
				id, siren, year, executive_women_percent, current_step, status
			) VALUES (
				${crypto.randomUUID()}, ${siren}, 2023, 10, 2, 'draft'
			)
		`;
	}

	it("imports only the declarations whose declared_at falls in the range (S31)", async () => {
		await seedLegacy({
			siren: SIREN_A,
			declared_at: new Date("2022-12-31T23:59:59.000Z"),
		});
		await seedLegacy({
			siren: SIREN_B,
			declared_at: new Date("2023-01-01T00:00:00.000Z"),
		});
		await seedLegacy({
			siren: SIREN_C,
			declared_at: new Date("2023-06-15T12:00:00.000Z"),
		});
		await seedLegacy({
			siren: SIREN_D,
			declared_at: new Date("2023-12-31T00:00:00.000Z"),
		});

		const counters = await runImport({
			from: new Date("2023-01-01T00:00:00.000Z"),
			to: new Date("2023-12-31T00:00:00.000Z"),
		});

		expect(counters).toEqual({
			total: 2,
			imported: 2,
			updated: 0,
			skippedUpToDate: 0,
			skippedNative: 0,
			errors: [],
		});
		expect(await readSirens()).toEqual([SIREN_B, SIREN_C]);
	});

	it("persists every mapped column of a computable declaration", async () => {
		await seedLegacy({ siren: SIREN_A });

		await runImport();

		expect(await readDeclaration(SIREN_A)).toMatchObject({
			siren: SIREN_A,
			year: 2023,
			declarant_id: null,
			legacy_declarant: {
				email: V1_DECLARANT.email,
				lastname: V1_DECLARANT.nom,
				firstname: V1_DECLARANT.prénom,
				phone: V1_DECLARANT.téléphone,
			},
			reference_period_start: "2023-01-01",
			reference_period_end: "2023-12-31",
			executive_women_percent: "45.00",
			executive_men_percent: "55.00",
			not_computable_reason_executives: null,
			member_women_percent: "40.00",
			member_men_percent: "60.00",
			not_computable_reason_members: null,
			publish_date: "2024-02-01",
			publish_url: "https://example.fr/representation",
			publish_modalities: null,
			current_step: 5,
			status: "submitted",
			submitted_at: DECLARED_AT,
			created_at: DECLARED_AT,
			updated_at: MODIFIED_AT,
		});
		expect(
			(await readDeclaration(SIREN_A))?.imported_from_v1_at,
		).toBeInstanceOf(Date);
	});

	it("creates the missing company from the V1 payload", async () => {
		await seedLegacy({ siren: SIREN_A });

		await runImport();

		expect(await readCompany(SIREN_A)).toEqual({
			siren: SIREN_A,
			name: "Société Démo",
			address: "1 rue de la Paix",
			naf_code: "62.01Z",
			region: "Île-de-France",
			department_code: "75",
			department_label: "Paris",
		});
	});

	it("never overwrites an existing company", async () => {
		await sql`
			INSERT INTO app_company (siren, name, naf_code)
			VALUES (${SIREN_A}, 'Nom Historique', '01.11Z')
		`;
		await seedLegacy({ siren: SIREN_A });

		const counters = await runImport();

		expect(counters.imported).toBe(1);
		expect(await readCompany(SIREN_A)).toMatchObject({
			name: "Nom Historique",
			naf_code: "01.11Z",
			region: null,
			department_code: null,
		});
	});

	it("persists the not-computable reasons as enum values", async () => {
		await seedLegacy({
			siren: SIREN_A,
			data: v1Data({
				entreprise: v1Company({ siren: SIREN_A }),
				indicateurs: {
					représentation_équilibrée: v1Indicator({
						motif_non_calculabilité_cadres: "un_seul_cadre_dirigeant",
						motif_non_calculabilité_membres: "aucune_instance_dirigeante",
					}),
				},
			}),
		});

		await runImport();

		expect(await readDeclaration(SIREN_A)).toMatchObject({
			executive_women_percent: null,
			executive_men_percent: null,
			not_computable_reason_executives: "un_seul_cadre_dirigeant",
			member_women_percent: null,
			member_men_percent: null,
			not_computable_reason_members: "aucune_instance_dirigeante",
		});
	});

	it("replays the same range without duplicating anything (S32)", async () => {
		await seedLegacy({ siren: SIREN_A });
		await runImport();
		const firstPass = await readDeclaration(SIREN_A);

		const counters = await runImport();

		expect(counters).toMatchObject({
			total: 1,
			imported: 0,
			updated: 0,
			skippedUpToDate: 1,
		});
		expect(await readSirens()).toEqual([SIREN_A]);
		expect(await readDeclaration(SIREN_A)).toStrictEqual(firstPass);
	});

	it("skips an already up-to-date declaration on an overlapping range", async () => {
		await seedLegacy({ siren: SIREN_A });
		await runImport({
			from: new Date("2023-01-01T00:00:00.000Z"),
			to: new Date("2023-07-01T00:00:00.000Z"),
		});

		const counters = await runImport({
			from: new Date("2023-06-01T00:00:00.000Z"),
			to: new Date("2024-01-01T00:00:00.000Z"),
		});

		expect(counters).toMatchObject({
			total: 1,
			imported: 0,
			skippedUpToDate: 1,
		});
		expect(await readSirens()).toEqual([SIREN_A]);
	});

	it("updates an imported declaration modified more recently in V1", async () => {
		await seedLegacy({ siren: SIREN_A });
		await runImport();
		const before = await readDeclaration(SIREN_A);
		const reModifiedAt = new Date("2024-03-01T08:00:00.000Z");
		await legacySql`
			UPDATE representation_equilibree
			SET modified_at = ${reModifiedAt},
				data = ${legacySql.json(
					v1Data({
						entreprise: v1Company({ siren: SIREN_A }),
						indicateurs: {
							représentation_équilibrée: v1Indicator({
								pourcentage_femmes_cadres: 50,
								pourcentage_hommes_cadres: 50,
							}),
						},
					}),
				)}
			WHERE siren = ${SIREN_A}
		`;

		const counters = await runImport();

		expect(counters).toMatchObject({
			total: 1,
			imported: 0,
			updated: 1,
			skippedUpToDate: 0,
		});
		expect(await readDeclaration(SIREN_A)).toMatchObject({
			executive_women_percent: "50.00",
			executive_men_percent: "50.00",
			updated_at: reModifiedAt,
			created_at: before?.created_at,
		});
		expect(await readSirens()).toEqual([SIREN_A]);
	});

	it("never touches a native V2 declaration", async () => {
		await seedNativeDeclaration(SIREN_A);
		const before = await readDeclaration(SIREN_A);
		await seedLegacy({ siren: SIREN_A });

		const counters = await runImport();

		expect(counters).toMatchObject({
			total: 1,
			imported: 0,
			updated: 0,
			skippedNative: 1,
		});
		expect(await readDeclaration(SIREN_A)).toStrictEqual(before);
		expect(await readCompany(SIREN_A)).toMatchObject({ name: "Nom Natif V2" });
	});

	it("writes nothing in dry-run while still counting the import", async () => {
		await seedLegacy({ siren: SIREN_A });

		const counters = await runImport({ dryRun: true });

		expect(counters).toMatchObject({ total: 1, imported: 1, updated: 0 });
		expect(await readSirens()).toEqual([]);
		expect(await readCompany(SIREN_A)).toBeUndefined();
	});

	it("writes nothing in dry-run over an outdated imported declaration", async () => {
		await seedLegacy({ siren: SIREN_A });
		await runImport();
		const before = await readDeclaration(SIREN_A);
		await legacySql`
			UPDATE representation_equilibree
			SET modified_at = ${new Date("2024-03-01T08:00:00.000Z")}
			WHERE siren = ${SIREN_A}
		`;

		const counters = await runImport({ dryRun: true });

		expect(counters).toMatchObject({ total: 1, imported: 0, updated: 1 });
		expect(await readDeclaration(SIREN_A)).toStrictEqual(before);
	});

	it("isolates a malformed row and reports it without any declarant identity", async () => {
		await seedLegacy({
			siren: SIREN_A,
			data: v1Data({
				entreprise: undefined as unknown as V1RepresentationCompany,
			}),
		});
		await seedLegacy({ siren: SIREN_B });

		const counters = await runImport();

		expect(counters).toMatchObject({ total: 2, imported: 1 });
		expect(counters.errors).toHaveLength(1);
		expect(Object.keys(counters.errors[0] ?? {})).toEqual([
			"siren",
			"year",
			"cause",
		]);
		expect(counters.errors[0]).toMatchObject({ siren: SIREN_A, year: 2023 });
		expect(JSON.stringify(counters.errors)).not.toContain(V1_DECLARANT.email);
		expect(await readSirens()).toEqual([SIREN_B]);
	});
});
