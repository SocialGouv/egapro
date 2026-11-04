// Visibility goes through the Observatoire's own public services: a raw SELECT would miss a release-date or join bug.
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	DEMO_PUBLIC_RELEASE_DATE,
	DEMO_SEED_USER_ID,
} from "#scripts/observatorySeedShared";
import {
	cleanRgaaObservatoryHistory,
	DECLARATION_ID_PREFIX,
	isValidHistoryDepth,
	MAX_HISTORY_YEARS,
	type RgaaHistoryTarget,
	resolveTargets,
	SEED_USER_ID,
	seedRgaaObservatoryHistory,
} from "#scripts/seed-rgaa-observatory-history";
import { env } from "~/env.js";
import {
	formatObservatoryWorkforce,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "~/modules/domain";
import {
	getPublicDeclarationsBySiren,
	getPublicRepresentationsBySiren,
} from "~/modules/public-api";

const CAMPAIGN_YEAR = 2088;
const TARGETS: RgaaHistoryTarget[] = resolveTargets();
const SIRENS = TARGETS.map((target) => target.siren);
const DECLARATION_YEARS = [
	CAMPAIGN_YEAR - 3,
	CAMPAIGN_YEAR - 2,
	CAMPAIGN_YEAR - 1,
];
const REPRESENTATION_YEARS = [CAMPAIGN_YEAR - 3, CAMPAIGN_YEAR - 2];

const FOREIGN_DECLARANT_ID = "rgaa-history-test-foreign-declarant";
const FILLER_DEADLINE = "2001-01-01";

function sortedYears(rows: { year: number }[]): number[] {
	return rows.map((row) => row.year).sort((a, b) => a - b);
}

describe("seedRgaaObservatoryHistory / cleanRgaaObservatoryHistory (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	async function cleanup() {
		await sql`DELETE FROM app_representation_declaration WHERE siren = ANY(${SIRENS})`;
		await sql`
			DELETE FROM app_declaration_status_history
			WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren = ANY(${SIRENS}))
		`;
		await sql`DELETE FROM app_declaration WHERE siren = ANY(${SIRENS})`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren = ANY(${SIRENS})`;
		await sql`DELETE FROM app_company WHERE siren = ANY(${SIRENS})`;
		await sql`DELETE FROM app_user WHERE id = ANY(${[DEMO_SEED_USER_ID, SEED_USER_ID, FOREIGN_DECLARANT_ID]})`;
		await sql`
			DELETE FROM app_campaign_deadline
			WHERE year BETWEEN ${CAMPAIGN_YEAR - MAX_HISTORY_YEARS} AND ${CAMPAIGN_YEAR + 1}
		`;
	}

	async function seedDemoFixtureUser() {
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name, is_admin)
			VALUES (${DEMO_SEED_USER_ID}, 'seed-observatory@example.fr', 'Seed', 'Observatoire', false)
			ON CONFLICT (id) DO NOTHING
		`;
	}

	async function seedTargetCompanies(targets: RgaaHistoryTarget[] = TARGETS) {
		for (const target of targets) {
			await sql`
				INSERT INTO app_company (siren, name, workforce, statut_diffusion, created_at, updated_at)
				VALUES (${target.siren}, ${`Test company ${target.siren}`}, ${target.workforce}, 'O', NOW(), NOW())
				ON CONFLICT (siren) DO NOTHING
			`;
		}
	}

	beforeEach(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup();
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	it("refuses to write anything when the Observatoire demo fixture is absent", async () => {
		await seedTargetCompanies();

		await expect(
			seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR }),
		).rejects.toThrow(/demo fixture/i);

		const rows = await sql`
			SELECT 1 FROM app_declaration WHERE siren = ANY(${SIRENS})
		`;
		expect(rows).toHaveLength(0);
	});

	it("refuses to write anything when a target app_company is missing, naming it", async () => {
		await seedDemoFixtureUser();
		const missingSiren = TARGETS[0];
		if (!missingSiren) throw new Error("no targets resolved from the fixture");
		await seedTargetCompanies(TARGETS.slice(1));

		await expect(
			seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR }),
		).rejects.toThrow(new RegExp(missingSiren.siren));

		const rows = await sql`
			SELECT 1 FROM app_declaration WHERE siren = ANY(${SIRENS})
		`;
		expect(rows).toHaveLength(0);
	});

	describe("with the demo fixture and every target company present", () => {
		beforeEach(async () => {
			await seedDemoFixtureUser();
			await seedTargetCompanies();
		});

		it("exposes C-3, C-2 and C-1 for every target, never C, and representation only for the 6 companies >= 1000 at C-3/C-2", async () => {
			const result = await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR,
			});

			expect(result.declarationYears).toEqual(DECLARATION_YEARS);
			expect(result.representationReferenceYears).toEqual(REPRESENTATION_YEARS);
			expect(result.ignored).toEqual([]);

			for (const target of TARGETS) {
				const declarations = await getPublicDeclarationsBySiren(target.siren);
				expect(sortedYears(declarations)).toEqual(DECLARATION_YEARS);
				expect(declarations.map((d) => d.year)).not.toContain(CAMPAIGN_YEAR);

				const representations = await getPublicRepresentationsBySiren(
					target.siren,
				);
				expect(sortedYears(representations)).toEqual(
					target.subjectToRepresentation ? REPRESENTATION_YEARS : [],
				);
			}
		});

		it("leaves at least one representation non-computable", async () => {
			await seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR });

			const subjectTargets = TARGETS.filter((t) => t.subjectToRepresentation);
			const allRepresentations = await Promise.all(
				subjectTargets.map((target) =>
					getPublicRepresentationsBySiren(target.siren),
				),
			);
			const nonComputable = allRepresentations
				.flat()
				.filter((r) => r.notComputableReasonExecutives !== null);
			expect(nonComputable.length).toBeGreaterThanOrEqual(1);
			for (const representation of nonComputable) {
				expect(representation.executiveWomenPercent).toBeNull();
			}
		});

		it("keeps each target's workforce bracket and representation subjection, even at the deepest history allowed", async () => {
			await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR,
				years: MAX_HISTORY_YEARS,
			});

			for (const target of TARGETS) {
				const declarations = await getPublicDeclarationsBySiren(target.siren);
				expect(declarations).toHaveLength(MAX_HISTORY_YEARS);
				for (const declaration of declarations) {
					const workforce = declaration.workforceEma ?? 0;
					expect(formatObservatoryWorkforce(workforce)).toBe(
						formatObservatoryWorkforce(target.workforce),
					);
					expect(workforce >= REPRESENTATION_SUBJECTION_WORKFORCE_MIN).toBe(
						target.subjectToRepresentation,
					);
				}
			}
		});

		it("rejects a history depth outside its bounds without writing anything", async () => {
			expect(isValidHistoryDepth(0)).toBe(false);
			expect(isValidHistoryDepth(MAX_HISTORY_YEARS + 1)).toBe(false);
			expect(isValidHistoryDepth(2.5)).toBe(false);

			await expect(
				seedRgaaObservatoryHistory(sql, {
					campaignYear: CAMPAIGN_YEAR,
					years: MAX_HISTORY_YEARS + 1,
				}),
			).rejects.toThrow(/between 1 and/);
			const rows = await sql`
				SELECT 1 FROM app_declaration WHERE siren = ANY(${SIRENS})
			`;
			expect(rows).toHaveLength(0);
		});

		it("drops the rows of a previous run made with another campaign year", async () => {
			await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR + 1,
			});
			await seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR });

			const leftovers = await sql`
				SELECT 1 FROM app_declaration
				WHERE siren = ANY(${SIRENS}) AND year >= ${CAMPAIGN_YEAR}
			`;
			expect(leftovers).toHaveLength(0);
			const staleRepresentations = await sql`
				SELECT 1 FROM app_representation_declaration
				WHERE siren = ANY(${SIRENS}) AND year >= ${CAMPAIGN_YEAR - 1}
			`;
			expect(staleRepresentations).toHaveLength(0);
			for (const target of TARGETS) {
				const declarations = await getPublicDeclarationsBySiren(target.siren);
				expect(sortedYears(declarations)).toEqual(DECLARATION_YEARS);
			}
		});

		it("leaves a representation and a GIP row it does not own intact, listing both", async () => {
			const target = TARGETS.find((t) => t.subjectToRepresentation);
			if (!target) throw new Error("no representation target in the fixture");
			const year = CAMPAIGN_YEAR - 2;
			await sql`
				INSERT INTO app_user (id, email, first_name, last_name, is_admin)
				VALUES (${FOREIGN_DECLARANT_ID}, 'foreign-declarant@example.fr', 'Foreign', 'Declarant', false)
			`;
			await sql`
				INSERT INTO app_representation_declaration (
					id, siren, year, declarant_id, status, created_at, updated_at
				) VALUES (
					'legitimate-representation', ${target.siren}, ${year},
					${FOREIGN_DECLARANT_ID}, 'submitted', NOW(), NOW()
				)
			`;
			await sql`
				INSERT INTO app_gip_mds_data (siren, year, workforce_ema, imported_at)
				VALUES (${target.siren}, ${year}, 4242, NOW())
			`;

			const result = await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR,
			});

			expect(result.ignored).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						table: "app_representation_declaration",
						siren: target.siren,
						year,
					}),
					expect.objectContaining({
						table: "app_gip_mds_data",
						siren: target.siren,
						year,
					}),
				]),
			);
			const [representation] = await sql<[{ id: string }]>`
				SELECT id FROM app_representation_declaration
				WHERE siren = ${target.siren} AND year = ${year}
			`;
			expect(representation?.id).toBe("legitimate-representation");
			const [gip] = await sql<[{ workforceEma: string }]>`
				SELECT workforce_ema::text AS "workforceEma" FROM app_gip_mds_data
				WHERE siren = ${target.siren} AND year = ${year}
			`;
			expect(gip?.workforceEma).toBe("4242.00");
		});

		it("brings a future public release date back into the past", async () => {
			const futureYear = CAMPAIGN_YEAR - 1;
			await sql`
				INSERT INTO app_campaign_deadline (
					year, public_data_release_date,
					decl1_modification_deadline, decl1_justification_deadline,
					decl1_joint_evaluation_deadline, decl2_modification_deadline,
					decl2_justification_deadline, decl2_joint_evaluation_deadline,
					decl2_cse_opinion_deadline
				) VALUES (
					${futureYear}, '2999-01-01',
					${FILLER_DEADLINE}, ${FILLER_DEADLINE}, ${FILLER_DEADLINE},
					${FILLER_DEADLINE}, ${FILLER_DEADLINE}, ${FILLER_DEADLINE}, ${FILLER_DEADLINE}
				)
			`;

			const result = await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR,
			});

			expect(result.correctedCampaignYears).toContain(futureYear);
			const declarations = await getPublicDeclarationsBySiren(
				TARGETS[0]?.siren ?? "",
			);
			expect(declarations.map((d) => d.year)).toContain(futureYear);
		});

		it("creates a missing campaign deadline, and releases a null public_data_release_date, listing the corrected year", async () => {
			const nullReleaseYear = CAMPAIGN_YEAR - 2;
			await sql`
				INSERT INTO app_campaign_deadline (
					year, public_data_release_date,
					decl1_modification_deadline, decl1_justification_deadline,
					decl1_joint_evaluation_deadline, decl2_modification_deadline,
					decl2_justification_deadline, decl2_joint_evaluation_deadline,
					decl2_cse_opinion_deadline
				) VALUES (
					${nullReleaseYear}, NULL,
					${FILLER_DEADLINE}, ${FILLER_DEADLINE}, ${FILLER_DEADLINE},
					${FILLER_DEADLINE}, ${FILLER_DEADLINE}, ${FILLER_DEADLINE}, ${FILLER_DEADLINE}
				)
			`;

			const result = await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR,
			});

			expect(result.correctedCampaignYears.sort((a, b) => a - b)).toEqual(
				DECLARATION_YEARS,
			);

			const [row] = await sql<
				[{ publicDataReleaseDate: string; decl1ModificationDeadline: string }]
			>`
				SELECT
					public_data_release_date::text AS "publicDataReleaseDate",
					decl1_modification_deadline::text AS "decl1ModificationDeadline"
				FROM app_campaign_deadline WHERE year = ${nullReleaseYear}
			`;
			expect(row?.publicDataReleaseDate).toBe(DEMO_PUBLIC_RELEASE_DATE);
			// Only the release date is touched: the admin/filler deadline stays put.
			expect(row?.decl1ModificationDeadline).toBe(FILLER_DEADLINE);

			for (const target of TARGETS) {
				const declarations = await getPublicDeclarationsBySiren(target.siren);
				expect(declarations.map((d) => d.year)).toContain(nullReleaseYear);
			}
		});

		it("leaves a declaration it does not own intact, and still writes the other years", async () => {
			const target = TARGETS[0];
			if (!target) throw new Error("no targets resolved from the fixture");
			const foreignYear = CAMPAIGN_YEAR - 1;

			await sql`
				INSERT INTO app_user (id, email, first_name, last_name, is_admin)
				VALUES (${FOREIGN_DECLARANT_ID}, 'foreign-declarant@example.fr', 'Foreign', 'Declarant', false)
			`;
			await sql`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, status, total_women, total_men, created_at, updated_at
				) VALUES (
					'legitimate-history-declaration', ${target.siren}, ${foreignYear},
					${FOREIGN_DECLARANT_ID}, 'demarche_completed', 11, 22, NOW(), NOW()
				)
			`;

			const result = await seedRgaaObservatoryHistory(sql, {
				campaignYear: CAMPAIGN_YEAR,
			});

			expect(result.ignored).toContainEqual(
				expect.objectContaining({
					table: "app_declaration",
					siren: target.siren,
					year: foreignYear,
				}),
			);

			const [row] = await sql<[{ id: string }]>`
				SELECT id FROM app_declaration
				WHERE siren = ${target.siren} AND year = ${foreignYear}
			`;
			expect(row?.id).toBe("legitimate-history-declaration");

			const declarations = await getPublicDeclarationsBySiren(target.siren);
			expect(sortedYears(declarations)).toEqual(DECLARATION_YEARS);
			for (const other of TARGETS.slice(1)) {
				const theirs = await getPublicDeclarationsBySiren(other.siren);
				expect(sortedYears(theirs)).toEqual(DECLARATION_YEARS);
			}
		});

		it("is idempotent: a second run produces the exact same public dataset", async () => {
			await seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR });
			const firstPass = await Promise.all(
				TARGETS.map((target) => getPublicDeclarationsBySiren(target.siren)),
			);

			await seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR });
			const secondPass = await Promise.all(
				TARGETS.map((target) => getPublicDeclarationsBySiren(target.siren)),
			);

			expect(secondPass).toEqual(firstPass);
		});

		it("--clean removes only its own rows, keeping the corrected campaign deadlines and a non-owned declaration", async () => {
			const target = TARGETS[0];
			if (!target) throw new Error("no targets resolved from the fixture");
			const foreignYear = CAMPAIGN_YEAR - 1;
			await sql`
				INSERT INTO app_user (id, email, first_name, last_name, is_admin)
				VALUES (${FOREIGN_DECLARANT_ID}, 'foreign-declarant@example.fr', 'Foreign', 'Declarant', false)
			`;
			await sql`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, status, created_at, updated_at
				) VALUES (
					'legitimate-history-declaration', ${target.siren}, ${foreignYear},
					${FOREIGN_DECLARANT_ID}, 'demarche_completed', NOW(), NOW()
				)
			`;

			await seedRgaaObservatoryHistory(sql, { campaignYear: CAMPAIGN_YEAR });
			await cleanRgaaObservatoryHistory(sql);

			const ownedDeclarations = await sql`
				SELECT 1 FROM app_declaration
				WHERE siren = ANY(${SIRENS}) AND id LIKE ${`${DECLARATION_ID_PREFIX}%`}
			`;
			expect(ownedDeclarations).toHaveLength(0);

			const ownedRepresentations = await sql`
				SELECT 1 FROM app_representation_declaration WHERE siren = ANY(${SIRENS})
			`;
			expect(ownedRepresentations).toHaveLength(0);

			const ownedGip = await sql`
				SELECT 1 FROM app_gip_mds_data WHERE siren = ANY(${SIRENS})
			`;
			expect(ownedGip).toHaveLength(0);

			const seedUser = await sql`
				SELECT 1 FROM app_user WHERE id = ${SEED_USER_ID}
			`;
			expect(seedUser).toHaveLength(0);

			// Not owned by this script: survives --clean.
			const [foreignRow] = await sql<[{ id: string }]>`
				SELECT id FROM app_declaration
				WHERE siren = ${target.siren} AND year = ${foreignYear}
			`;
			expect(foreignRow?.id).toBe("legitimate-history-declaration");

			// Shared with the rest of the env: campaign deadline corrections are not rolled back.
			const [deadlineRow] = await sql<[{ publicDataReleaseDate: string }]>`
				SELECT public_data_release_date AS "publicDataReleaseDate"
				FROM app_campaign_deadline WHERE year = ${CAMPAIGN_YEAR - 3}
			`;
			expect(deadlineRow?.publicDataReleaseDate).not.toBeNull();
		});
	});
});
