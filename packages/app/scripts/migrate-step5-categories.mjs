/**
 * Migration script: converts step=5 data from the serialized format
 * in `app_declaration_category` to the normalized `app_job_category` +
 * `app_employee_category` tables.
 *
 * Usage: node scripts/migrate-step5-categories.mjs
 *
 * Requires DATABASE_URL or POSTGRES_HOST+POSTGRES_DB env vars.
 */

import postgres from "postgres";

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const {
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_HOST,
		POSTGRES_PORT,
		POSTGRES_DB,
		POSTGRES_SSLMODE,
	} = process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = encodeURIComponent(POSTGRES_USER ?? "postgres");
		const password = POSTGRES_PASSWORD
			? `:${encodeURIComponent(POSTGRES_PASSWORD)}`
			: "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	throw new Error("DATABASE_URL or POSTGRES_HOST+POSTGRES_DB must be set");
}

function parseStep5Rows(rows) {
	const sourceRow = rows.find((r) =>
		r.category_name.startsWith("meta:source:"),
	);
	const source = sourceRow
		? sourceRow.category_name.replace("meta:source:", "")
		: "";

	const categories = new Map();

	const getOrCreate = (index) => {
		if (!categories.has(index)) {
			categories.set(index, {
				name: "",
				detail: "",
				womenCount: null,
				menCount: null,
				annualBaseWomen: null,
				annualBaseMen: null,
				annualVariableWomen: null,
				annualVariableMen: null,
				hourlyBaseWomen: null,
				hourlyBaseMen: null,
				hourlyVariableWomen: null,
				hourlyVariableMen: null,
			});
		}
		return categories.get(index);
	};

	for (const row of rows) {
		const nameMatch = row.category_name.match(/^cat:(\d+):name:(.*)$/);
		if (nameMatch) {
			getOrCreate(Number(nameMatch[1])).name = nameMatch[2];
			continue;
		}

		const detailMatch = row.category_name.match(/^cat:(\d+):detail:(.*)$/);
		if (detailMatch) {
			getOrCreate(Number(detailMatch[1])).detail = detailMatch[2];
			continue;
		}

		const match = row.category_name.match(/^cat:(\d+):(.+)$/);
		if (!match) continue;

		const cat = getOrCreate(Number(match[1]));

		switch (match[2]) {
			case "effectif":
				cat.womenCount = row.women_count;
				cat.menCount = row.men_count;
				break;
			case "annual:base":
				cat.annualBaseWomen = row.women_value;
				cat.annualBaseMen = row.men_value;
				break;
			case "annual:variable":
				cat.annualVariableWomen = row.women_value;
				cat.annualVariableMen = row.men_value;
				break;
			case "hourly:base":
				cat.hourlyBaseWomen = row.women_value;
				cat.hourlyBaseMen = row.men_value;
				break;
			case "hourly:variable":
				cat.hourlyVariableWomen = row.women_value;
				cat.hourlyVariableMen = row.men_value;
				break;
		}
	}

	return { source, categories };
}

async function main() {
	const url = getDatabaseUrl();
	const conn = postgres(url, { max: 1 });

	// Find all (siren, year) pairs with step=5 data
	const pairs =
		await conn`SELECT DISTINCT siren, year FROM app_declaration_category WHERE step = 5`;

	console.log(
		`Found ${pairs.length} declarations with step=5 data to migrate.`,
	);

	let migrated = 0;
	let skipped = 0;

	for (const { siren, year } of pairs) {
		// Find the declaration UUID
		const [declaration] =
			await conn`SELECT id FROM app_declaration WHERE siren = ${siren} AND year = ${year}`;

		if (!declaration) {
			console.warn(`  SKIP ${siren}/${year}: no matching declaration.`);
			skipped++;
			continue;
		}

		// Check if already migrated
		const [existing] =
			await conn`SELECT count(*) as count FROM app_job_category WHERE declaration_id = ${declaration.id}`;

		if (existing && Number(existing.count) > 0) {
			console.log(`  SKIP ${siren}/${year}: already migrated.`);
			skipped++;
			continue;
		}

		// Fetch step=5 rows
		const oldRows =
			await conn`SELECT category_name, women_count, men_count, women_value, men_value FROM app_declaration_category WHERE siren = ${siren} AND year = ${year} AND step = 5`;

		if (oldRows.length === 0) continue;

		const { source, categories } = parseStep5Rows(oldRows);
		const sortedEntries = Array.from(categories.entries()).sort(
			([a], [b]) => a - b,
		);

		// Insert into new tables within a transaction
		await conn.begin(async (tx) => {
			for (const [catIndex, cat] of sortedEntries) {
				const jobCatId = crypto.randomUUID();

				await tx`INSERT INTO app_job_category (id, declaration_id, category_index, name, detail, source) VALUES (${jobCatId}, ${declaration.id}, ${catIndex}, ${cat.name || `Catégorie ${catIndex + 1}`}, ${cat.detail || null}, ${source || "convention-collective"})`;

				const empCatId = crypto.randomUUID();
				await tx`INSERT INTO app_employee_category (id, job_category_id, declaration_type, women_count, men_count, annual_base_women, annual_base_men, annual_variable_women, annual_variable_men, hourly_base_women, hourly_base_men, hourly_variable_women, hourly_variable_men, created_at, updated_at) VALUES (${empCatId}, ${jobCatId}, 'initial', ${cat.womenCount}, ${cat.menCount}, ${cat.annualBaseWomen}, ${cat.annualBaseMen}, ${cat.annualVariableWomen}, ${cat.annualVariableMen}, ${cat.hourlyBaseWomen}, ${cat.hourlyBaseMen}, ${cat.hourlyVariableWomen}, ${cat.hourlyVariableMen}, NOW(), NOW())`;
			}

			// Delete old step=5 rows
			await tx`DELETE FROM app_declaration_category WHERE siren = ${siren} AND year = ${year} AND step = 5`;
		});

		migrated++;
		console.log(
			`  OK ${siren}/${year}: ${categories.size} categories migrated.`,
		);
	}

	console.log(
		`\nDone. Migrated: ${migrated}, Skipped: ${skipped}, Total: ${pairs.length}`,
	);
	await conn.end();
}

main().catch((err) => {
	console.error("Migration failed:", err);
	throw err;
});
