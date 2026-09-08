import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runImportV1Referents } from "#scripts/import-v1-referents.mjs";
import { env } from "~/env.js";

const REFERENT_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_REFERENT_ID = "22222222-2222-4222-8222-222222222222";
const STALE_REFERENT_ID = "33333333-3333-4333-8333-333333333333";

type ReferentOverrides = Partial<{
	county: string | null;
	id: string;
	name: string;
	principal: boolean;
	region: string;
	substituteEmail: string | null;
	substituteName: string | null;
	type: string;
	value: string;
}>;

type TargetReferent = {
	county: string | null;
	created_at: Date;
	id: string;
	name: string;
	principal: boolean;
	region: string;
	substitute_email: string | null;
	substitute_name: string | null;
	type: string;
	updated_at: Date;
	value: string;
};

describe("import-v1-referents.mjs (integration)", () => {
	let sql!: ReturnType<typeof postgres>;
	let legacySql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		legacySql = postgres(env.DATABASE_URL, { max: 1 });
		await legacySql`
			CREATE TABLE IF NOT EXISTS referent (
				id uuid PRIMARY KEY,
				county text,
				name text NOT NULL,
				principal boolean NOT NULL DEFAULT false,
				region text NOT NULL,
				type text NOT NULL,
				value text NOT NULL,
				substitute_name text,
				substitute_email text
			)
		`;
	});

	afterAll(async () => {
		await cleanup();
		await legacySql`DROP TABLE IF EXISTS referent`;
		await sql.end();
		await legacySql.end();
	});

	beforeEach(cleanup);

	async function cleanup() {
		await legacySql`TRUNCATE referent`;
		await sql`DELETE FROM app_referent`;
		await sql`
			ALTER TABLE app_referent
			DROP CONSTRAINT IF EXISTS import_v1_referents_test_check
		`;
	}

	async function seedLegacy(overrides: ReferentOverrides = {}) {
		const referent = {
			id: REFERENT_ID,
			county: "75",
			name: "Cellule égalité professionnelle",
			principal: true,
			region: "11",
			type: "email",
			value: "referent@example.fr",
			substituteName: "Suppléance régionale",
			substituteEmail: "substitute@example.fr",
			...overrides,
		};

		await legacySql`
			INSERT INTO referent (
				id, county, name, principal, region, type, value,
				substitute_name, substitute_email
			) VALUES (
				${referent.id}, ${referent.county}, ${referent.name},
				${referent.principal}, ${referent.region}, ${referent.type},
				${referent.value}, ${referent.substituteName},
				${referent.substituteEmail}
			)
		`;
		return referent;
	}

	async function seedTarget(
		id = STALE_REFERENT_ID,
		name = "Référent V2 obsolète",
	) {
		await sql`
			INSERT INTO app_referent (
				id, region, county, name, type, value, principal
			) VALUES (
				${id}, '11', '92', ${name}, 'email', 'stale@example.fr', false
			)
		`;
	}

	async function readTargetReferents() {
		return sql<TargetReferent[]>`
			SELECT
				id, region, county, name, type, value, principal,
				substitute_name, substitute_email, created_at, updated_at
			FROM app_referent
			ORDER BY id
		`;
	}

	function runImport(dryRun = false) {
		return runImportV1Referents({ legacySql, sql, dryRun });
	}

	it("replaces the directory and preserves every V1 field", async () => {
		await seedTarget();
		await seedLegacy();
		await seedLegacy({
			id: SECOND_REFERENT_ID,
			county: null,
			name: "Coordination régionale",
			principal: false,
			type: "url",
			value: "https://travail.gouv.fr/contact",
			substituteName: null,
			substituteEmail: null,
		});

		const counters = await runImport();
		const rows = await readTargetReferents();

		expect(counters).toEqual({
			totalRead: 2,
			targetBefore: 1,
			imported: 2,
		});
		expect(rows.map(({ id }) => id)).toEqual([REFERENT_ID, SECOND_REFERENT_ID]);
		expect(rows[0]).toMatchObject({
			id: REFERENT_ID,
			region: "11",
			county: "75",
			name: "Cellule égalité professionnelle",
			type: "email",
			value: "referent@example.fr",
			principal: true,
			substitute_name: "Suppléance régionale",
			substitute_email: "substitute@example.fr",
		});
		expect(rows[0]?.created_at).toBeInstanceOf(Date);
		expect(rows[0]?.updated_at).toBeInstanceOf(Date);
		expect(rows[0]?.created_at).toEqual(rows[0]?.updated_at);
		expect(rows[1]).toMatchObject({
			county: null,
			type: "url",
			value: "https://travail.gouv.fr/contact",
			substitute_name: null,
			substitute_email: null,
		});
		expect(rows[1]?.created_at).toEqual(rows[0]?.created_at);
		expect(rows[1]?.updated_at).toEqual(rows[0]?.updated_at);
		expect(rows.some(({ id }) => id === STALE_REFERENT_ID)).toBe(false);
	});

	it("can be replayed with stable source IDs", async () => {
		await seedLegacy();
		await runImport();

		const counters = await runImport();
		const rows = await readTargetReferents();

		expect(counters).toEqual({
			totalRead: 1,
			targetBefore: 1,
			imported: 1,
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe(REFERENT_ID);
	});

	it("validates dry-run input and leaves the target untouched", async () => {
		await seedLegacy();
		await seedTarget();
		const before = await readTargetReferents();

		const counters = await runImport(true);

		expect(counters).toEqual({
			totalRead: 1,
			targetBefore: 1,
			imported: 1,
		});
		expect(await readTargetReferents()).toStrictEqual(before);
	});

	it("rejects an empty source without clearing the target", async () => {
		await seedTarget();
		const before = await readTargetReferents();

		await expect(runImport()).rejects.toThrow(
			"Legacy referent snapshot is empty",
		);
		expect(await readTargetReferents()).toStrictEqual(before);
	});

	it("rejects all invalid source rows before changing the target", async () => {
		await seedTarget();
		await seedLegacy({ region: "999" });
		const before = await readTargetReferents();

		await expect(runImport()).rejects.toThrow(
			"Invalid legacy referent snapshot",
		);
		expect(await readTargetReferents()).toStrictEqual(before);
	});

	it("rolls the replacement back when an insert fails", async () => {
		await seedTarget();
		await seedLegacy({ name: "Rejected by target" });
		const before = await readTargetReferents();
		await sql`
			ALTER TABLE app_referent
			ADD CONSTRAINT import_v1_referents_test_check
			CHECK (name <> 'Rejected by target') NOT VALID
		`;

		await expect(runImport()).rejects.toThrow();
		expect(await readTargetReferents()).toStrictEqual(before);
	});

	it("waits for a concurrent target writer before replacing the directory", async () => {
		await seedLegacy();
		const blocker = postgres(env.DATABASE_URL, { max: 1 });
		const observer = postgres(env.DATABASE_URL, { max: 1 });
		const [backend] = await sql<{ pid: number }[]>`
			SELECT pg_backend_pid()::integer AS pid
		`;
		if (!backend) {
			throw new Error("Could not identify the importer database connection");
		}
		const { pid } = backend;
		let releaseBlocker!: () => void;
		let markBlockerReady!: () => void;
		const blockerReady = new Promise<void>((resolve) => {
			markBlockerReady = resolve;
		});
		const release = new Promise<void>((resolve) => {
			releaseBlocker = resolve;
		});
		const blockerRun = blocker.begin(async (tx) => {
			await tx`LOCK TABLE app_referent IN ROW EXCLUSIVE MODE`;
			markBlockerReady();
			await release;
		});

		await blockerReady;
		const importRun = runImport();
		let importerIsWaiting = false;
		try {
			for (let attempt = 0; attempt < 50; attempt++) {
				const [activity] = await observer<{ wait_event_type: string | null }[]>`
					SELECT wait_event_type
					FROM pg_stat_activity
					WHERE pid = ${pid}
				`;
				if (activity?.wait_event_type === "Lock") {
					importerIsWaiting = true;
					break;
				}
				await observer`SELECT pg_sleep(0.01)`;
			}
			expect(importerIsWaiting).toBe(true);
		} finally {
			releaseBlocker();
		}

		await blockerRun;
		await expect(importRun).resolves.toMatchObject({ imported: 1 });
		await blocker.end();
		await observer.end();
	});
});
