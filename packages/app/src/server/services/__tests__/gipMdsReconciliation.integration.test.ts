import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { importGipCsvToDb } from "../gipMds";

// `importGipCsvToDb` had no coverage at all, and the bug it now fixes is only
// observable against a real engine: the reconciliation runs after the import
// transaction commits, and the "company left the file" case is produced by the
// import's own DELETE, not by anything a mocked driver would replay (#4184).
describe("importGipCsvToDb — CSE reconciliation (real Postgres, #4184)", () => {
	let sql!: ReturnType<typeof postgres>;

	const YEAR = 2033;
	const SIREN_DROPS = "811111111";
	const SIREN_REMOVED = "822222222";
	const SIREN_STAYS = "833333333";
	const SIREN_COMPLETED = "844444444";
	const ALL_SIRENS = [SIREN_DROPS, SIREN_REMOVED, SIREN_STAYS, SIREN_COMPLETED];
	const USER_ID = "cse-reconciliation-user";
	const DECL_IDS = [
		"cse-recon-drops",
		"cse-recon-removed",
		"cse-recon-stays",
		"cse-recon-completed",
	];

	function buildCsv(entries: Array<{ siren: string; workforce: string }>) {
		return [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			`DGT;DTS;${YEAR}-08-04T16:31:32;${YEAR}-01-01;${YEAR}-12-31;${entries.length}`,
			"SIREN;Effectif_RCD",
			...entries.map((e) => `${e.siren};${e.workforce}`),
		].join("\n");
	}

	// Every company stays in the file except the removed one, so the only
	// difference between the two release cases is how the headcount vanished.
	const csvAfterDrop = buildCsv([
		{ siren: SIREN_DROPS, workforce: "87,00" },
		{ siren: SIREN_STAYS, workforce: "150,00" },
		{ siren: SIREN_COMPLETED, workforce: "80,00" },
	]);

	async function cleanup() {
		await sql`DELETE FROM app_declaration_status_history WHERE declaration_id IN ${sql(DECL_IDS)}`;
		await sql`DELETE FROM app_declaration WHERE id IN ${sql(DECL_IDS)}`;
		await sql`DELETE FROM app_gip_mds_data WHERE year = ${YEAR}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	async function readDeclaration(id: string) {
		const [row] = await sql`
			SELECT d.status, d.cse_required,
				(SELECT count(*)::int FROM app_declaration_status_history h
				  WHERE h.declaration_id = d.id) AS history_count
			FROM app_declaration d WHERE d.id = ${id}
		`;
		return row as {
			status: string;
			cse_required: boolean;
			history_count: number;
		};
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

		await sql`
			INSERT INTO app_user (id, email, first_name, last_name)
			VALUES (${USER_ID}, 'dir.rh@example.fr', 'Dir', 'RH')
		`;
		await sql`
			INSERT INTO app_company (siren, name, workforce, has_cse)
			VALUES
				(${SIREN_DROPS},     'Entreprise Effectif En Baisse', 110, true),
				(${SIREN_REMOVED},   'Entreprise Retiree Du Fichier', 130, true),
				(${SIREN_STAYS},     'Entreprise Temoin',             150, true),
				(${SIREN_COMPLETED}, 'Entreprise Deja Terminee',      120, true)
		`;
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
			VALUES
				(${SIREN_DROPS},     ${YEAR}, 110.00),
				(${SIREN_REMOVED},   ${YEAR}, 130.00),
				(${SIREN_STAYS},     ${YEAR}, 150.00),
				(${SIREN_COMPLETED}, ${YEAR}, 120.00)
		`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, status, cse_required, created_at, updated_at)
			VALUES
				('cse-recon-drops',     ${SIREN_DROPS},     ${YEAR}, ${USER_ID}, 'awaiting_cse_opinion', true, NOW(), NOW()),
				('cse-recon-removed',   ${SIREN_REMOVED},   ${YEAR}, ${USER_ID}, 'awaiting_cse_opinion', true, NOW(), NOW()),
				('cse-recon-stays',     ${SIREN_STAYS},     ${YEAR}, ${USER_ID}, 'awaiting_cse_opinion', true, NOW(), NOW()),
				('cse-recon-completed', ${SIREN_COMPLETED}, ${YEAR}, ${USER_ID}, 'demarche_completed',   true, NOW(), NOW())
		`;
	});

	it("releases a démarche whose headcount fell under the CSE threshold", async () => {
		await importGipCsvToDb(db, csvAfterDrop);

		const row = await readDeclaration("cse-recon-drops");
		expect(row.status).toBe("demarche_completed");
		expect(row.cse_required).toBe(false);
		expect(row.history_count).toBe(1);
	});

	it("releases a démarche whose company left the GIP file", async () => {
		// The import's own DELETE removes the row; a missing headcount reads as 0,
		// which is the same rule as a drop — this is the half a naive predicate
		// filtering on `workforce_ema < threshold` silently misses.
		await importGipCsvToDb(db, csvAfterDrop);

		const row = await readDeclaration("cse-recon-removed");
		expect(row.status).toBe("demarche_completed");
		expect(row.cse_required).toBe(false);
		expect(row.history_count).toBe(1);
	});

	it("leaves a démarche that still owes its opinion untouched", async () => {
		await importGipCsvToDb(db, csvAfterDrop);

		const row = await readDeclaration("cse-recon-stays");
		expect(row.status).toBe("awaiting_cse_opinion");
		expect(row.cse_required).toBe(true);
		expect(row.history_count).toBe(0);
	});

	it("refreshes the stale snapshot without transitioning a finished démarche", async () => {
		await importGipCsvToDb(db, csvAfterDrop);

		const row = await readDeclaration("cse-recon-completed");
		expect(row.status).toBe("demarche_completed");
		expect(row.cse_required).toBe(false);
		expect(row.history_count).toBe(0);
	});

	it("counts the démarches it realigned", async () => {
		const result = await importGipCsvToDb(db, csvAfterDrop);

		expect(result).toMatchObject({ year: YEAR, reconciled: 3, failed: 0 });
	});

	it("changes nothing when the same file is imported twice", async () => {
		await importGipCsvToDb(db, csvAfterDrop);
		const afterFirst = await Promise.all(DECL_IDS.map(readDeclaration));

		const second = await importGipCsvToDb(db, csvAfterDrop);

		expect(second.reconciled).toBe(0);
		expect(await Promise.all(DECL_IDS.map(readDeclaration))).toEqual(
			afterFirst,
		);
	});

	it("reconciles nothing when no headcount crossed the threshold", async () => {
		const unchanged = buildCsv([
			{ siren: SIREN_DROPS, workforce: "110,00" },
			{ siren: SIREN_REMOVED, workforce: "130,00" },
			{ siren: SIREN_STAYS, workforce: "150,00" },
			{ siren: SIREN_COMPLETED, workforce: "120,00" },
		]);

		const result = await importGipCsvToDb(db, unchanged);

		expect(result.reconciled).toBe(0);
		const row = await readDeclaration("cse-recon-drops");
		expect(row.status).toBe("awaiting_cse_opinion");
		expect(row.cse_required).toBe(true);
	});

	it("attributes the release to no user, since a batch triggered it", async () => {
		await importGipCsvToDb(db, csvAfterDrop);

		const [event] = await sql`
			SELECT event_type, actor_user_id
			FROM app_declaration_status_history
			WHERE declaration_id = 'cse-recon-drops'
		`;
		expect(event).toMatchObject({
			event_type: "demarche_complete",
			actor_user_id: null,
		});
	});
});
