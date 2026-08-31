import ExcelJS from "exceljs";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

// Draft exclusion and company join are SQL-enforced: a mocked driver cannot prove them.
describe("GET /api/public/representations/export — integration (#4155)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_DIFFUSIBLE = "123456789";
	const SIREN_NON_DIFFUSIBLE = "987654321";
	const SIREN_DRAFT = "111222333";
	const ALL_SIRENS = [SIREN_DIFFUSIBLE, SIREN_NON_DIFFUSIBLE, SIREN_DRAFT];
	const YEAR = 2027;
	const DECL_IDS = [
		"repr-export-diffusible",
		"repr-export-non-diffusible",
		"repr-export-draft",
	];

	async function cleanup() {
		await sql`DELETE FROM app_representation_declaration WHERE id IN ${sql(DECL_IDS)}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(ALL_SIRENS)}`;
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
			INSERT INTO app_company (siren, name, address, naf_code, naf_label, region, department_code, department_label, statut_diffusion)
			VALUES
				(${SIREN_DIFFUSIBLE},     'Entreprise Diffusible',     '1 rue de la Paix, 75002 Paris', '62.02A', 'Conseil en systemes informatiques', 'Île-de-France', '75', 'Paris',  'O'),
				(${SIREN_NON_DIFFUSIBLE}, 'Entreprise Non Diffusible', '2 rue Secrete, 69001 Lyon',     '70.10Z', 'Activites des sieges sociaux',      'Auvergne-Rhône-Alpes', '69', 'Rhône', 'N'),
				(${SIREN_DRAFT},          'Entreprise Brouillon',      '3 rue Brouillon, 44000 Nantes', '46.90Z', 'Commerce de gros non specialise',   'Pays de la Loire', '44', 'Loire-Atlantique', 'O')
		`;
		await sql`
			INSERT INTO app_representation_declaration
				(id, siren, year, executive_women_percent, executive_men_percent, member_women_percent, member_men_percent, publish_date, publish_url, publish_modalities, status)
			VALUES
				('repr-export-diffusible',     ${SIREN_DIFFUSIBLE},     ${YEAR}, 40.00, 60.00, 45.50, 54.50, '2028-03-01', 'https://example.fr/representation', 'Site internet', 'submitted'),
				('repr-export-non-diffusible', ${SIREN_NON_DIFFUSIBLE}, ${YEAR}, 30.00, 70.00, 25.00, 75.00, '2028-03-02', 'https://example.fr/non-diffusible', 'Site internet', 'submitted'),
				('repr-export-draft',          ${SIREN_DRAFT},          ${YEAR}, 50.00, 50.00, 50.00, 50.00, NULL,         NULL,                                NULL,            'draft')
		`;
	});

	async function fetchExportSheet() {
		const { GET } = await import(
			"~/app/api/public/representations/export/route"
		);
		const response = await GET(
			new Request("http://localhost/api/public/representations/export"),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(await response.arrayBuffer());
		const sheet = workbook.getWorksheet("Représentation équilibrée");
		if (!sheet) throw new Error("missing representation worksheet");
		return sheet;
	}

	function findRowBySiren(sheet: ExcelJS.Worksheet, siren: string) {
		let found: ExcelJS.Row | undefined;
		sheet.eachRow((row, rowNumber) => {
			if (rowNumber > 1 && row.getCell(2).value === siren) found = row;
		});
		return found;
	}

	it("exports a submitted declaration of a diffusible company with its identity and location", async () => {
		const sheet = await fetchExportSheet();
		const row = findRowBySiren(sheet, SIREN_DIFFUSIBLE);

		expect(row).toBeDefined();
		expect(row?.getCell(1).value).toBe(YEAR);
		expect(row?.getCell(3).value).toBe("Entreprise Diffusible");
		expect(row?.getCell(4).value).toBe("Île-de-France");
		expect(row?.getCell(5).value).toBe("75");
		expect(row?.getCell(6).value).toBe("Paris");
		expect(row?.getCell(7).value).toBe("62.02A");
		expect(row?.getCell(9).value).toBe(40);
		expect(row?.getCell(10).value).toBe(60);
	});

	it("exports a non-diffusible company with its SIREN and indicators but no identity nor location", async () => {
		const sheet = await fetchExportSheet();
		const row = findRowBySiren(sheet, SIREN_NON_DIFFUSIBLE);

		expect(row).toBeDefined();
		expect(row?.getCell(3).value).toBeNull();
		expect(row?.getCell(4).value).toBeNull();
		expect(row?.getCell(5).value).toBeNull();
		expect(row?.getCell(6).value).toBeNull();
		expect(row?.getCell(7).value).toBeNull();
		expect(row?.getCell(8).value).toBeNull();
		expect(row?.getCell(9).value).toBe(30);
		expect(row?.getCell(10).value).toBe(70);
	});

	it("never writes a company address in the file, diffusible or not", async () => {
		const sheet = await fetchExportSheet();

		const headers = (sheet.getRow(1).values as string[]).filter(Boolean);
		expect(headers.some((header) => /adresse/i.test(header))).toBe(false);

		const cellValues: unknown[] = [];
		sheet.eachRow((row) => {
			row.eachCell((cell) => cellValues.push(cell.value));
		});
		expect(cellValues).not.toContain("1 rue de la Paix, 75002 Paris");
		expect(cellValues).not.toContain("2 rue Secrete, 69001 Lyon");
	});

	it("excludes a draft declaration from the export", async () => {
		const sheet = await fetchExportSheet();

		expect(findRowBySiren(sheet, SIREN_DRAFT)).toBeUndefined();
	});

	it("excludes a declaration closed as not subject from the export", async () => {
		await sql`UPDATE app_representation_declaration SET status = 'not_subject' WHERE id = 'repr-export-draft'`;

		const sheet = await fetchExportSheet();

		expect(findRowBySiren(sheet, SIREN_DRAFT)).toBeUndefined();
	});

	it("exports a declaration that becomes submitted after having been a draft", async () => {
		await sql`UPDATE app_representation_declaration SET status = 'submitted' WHERE id = 'repr-export-draft'`;

		const sheet = await fetchExportSheet();

		expect(findRowBySiren(sheet, SIREN_DRAFT)).toBeDefined();
	});

	it("writes an audit log entry for the export", async () => {
		await sql`DELETE FROM audit.action_log WHERE action = 'public_representations.export'`;

		await fetchExportSheet();
		await new Promise((resolve) => setTimeout(resolve, 200));

		const logs = await sql`
			SELECT action, category, status FROM audit.action_log
			WHERE action = 'public_representations.export'
		`;
		expect(logs).toHaveLength(1);
		expect(logs[0]).toMatchObject({
			action: "public_representations.export",
			category: "export",
			status: "success",
		});
	});
});
