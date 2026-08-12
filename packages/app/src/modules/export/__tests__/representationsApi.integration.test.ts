import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

// The date window, the `submitted` filter and the company join are SQL-enforced:
// a mocked driver cannot prove them (see rules/audit-logging.md).
describe("GET /api/v1/export/representations — integration (#4127)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_WINDOW_START = "900000001";
	const SIREN_NON_DIFFUSIBLE = "900000002";
	const SIREN_WINDOW_END = "900000003";
	const SIREN_DRAFT = "900000004";
	const SIREN_BEFORE_WINDOW = "900000005";
	const ALL_SIRENS = [
		SIREN_WINDOW_START,
		SIREN_NON_DIFFUSIBLE,
		SIREN_WINDOW_END,
		SIREN_DRAFT,
		SIREN_BEFORE_WINDOW,
	];
	const YEAR = 2029;
	const DECL_IDS = [
		"suit-repr-window-start",
		"suit-repr-non-diffusible",
		"suit-repr-window-end",
		"suit-repr-draft",
		"suit-repr-before-window",
	];

	const DATE_BEGIN = "2030-03-15";
	const DATE_END = "2030-03-20";

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
				(${SIREN_WINDOW_START},   'Entreprise Borne Debut',    '1 rue de la Paix, 75002 Paris', '62.02A', 'Conseil en systemes informatiques', 'Île-de-France',        '75', 'Paris',            'O'),
				(${SIREN_NON_DIFFUSIBLE}, 'Entreprise Non Diffusible', '2 rue Secrete, 69001 Lyon',     '70.10Z', 'Activites des sieges sociaux',      'Auvergne-Rhône-Alpes', '69', 'Rhône',            'N'),
				(${SIREN_WINDOW_END},     'Entreprise Borne Fin',      '3 rue Brouillon, 44000 Nantes', '46.90Z', 'Commerce de gros non specialise',   'Pays de la Loire',     '44', 'Loire-Atlantique', 'O'),
				(${SIREN_DRAFT},          'Entreprise Brouillon',      '4 rue Brouillon, 33000 Bordeaux','43.99C','Travaux de maconnerie generale',    'Nouvelle-Aquitaine',   '33', 'Gironde',          'O'),
				(${SIREN_BEFORE_WINDOW},  'Entreprise Hors Fenetre',   '5 rue Ancienne, 59000 Lille',   '10.71C', 'Boulangerie et boulangerie-patisserie', 'Hauts-de-France',  '59', 'Nord',             'O')
		`;
		await sql`
			INSERT INTO app_representation_declaration
				(id, siren, year, reference_period_start, reference_period_end,
				 executive_women_percent, executive_men_percent, not_computable_reason_executives,
				 member_women_percent, member_men_percent, not_computable_reason_members,
				 publish_date, publish_url, publish_modalities, status, submitted_at)
			VALUES
				('suit-repr-window-start',   ${SIREN_WINDOW_START},   ${YEAR}, '2029-01-01', '2029-12-31', 40.00, 60.00, NULL, 45.50, 54.50, NULL, '2030-03-01', 'https://example.fr/borne-debut', 'Site internet', 'submitted', '2030-03-15T00:00:00Z'),
				('suit-repr-non-diffusible', ${SIREN_NON_DIFFUSIBLE}, ${YEAR}, '2029-01-01', '2029-12-31', 30.00, 70.00, NULL, 25.00, 75.00, NULL, '2030-03-02', 'https://example.fr/non-diffusible', 'Affichage', 'submitted', '2030-03-17T09:30:00Z'),
				('suit-repr-window-end',     ${SIREN_WINDOW_END},     ${YEAR}, NULL,         NULL,         NULL,  NULL,  'aucun_cadre_dirigeant', NULL, NULL, 'aucune_instance_dirigeante', NULL, NULL, NULL, 'submitted', '2030-03-20T00:00:00Z'),
				('suit-repr-draft',          ${SIREN_DRAFT},          ${YEAR}, NULL,         NULL,         50.00, 50.00, NULL, 50.00, 50.00, NULL, NULL, NULL, NULL, 'draft',     '2030-03-17T09:30:00Z'),
				('suit-repr-before-window',  ${SIREN_BEFORE_WINDOW},  ${YEAR}, NULL,         NULL,         10.00, 90.00, NULL, 20.00, 80.00, NULL, NULL, NULL, NULL, 'submitted', '2030-03-14T23:59:59Z')
		`;
	});

	function gatewayRequest(params: Record<string, string>): Request {
		return new Request(
			`http://localhost/api/v1/export/representations?${new URLSearchParams(params)}`,
			{ headers: { "x-gateway-forwarded": "test-value" } },
		);
	}

	async function fetchWindow(params: Record<string, string>) {
		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(gatewayRequest(params));

		expect(response.status).toBe(200);
		const body = await response.json();
		return body as {
			Date_debut: string;
			Date_fin: string;
			Nombre: number;
			Representations: Array<Record<string, unknown>>;
		};
	}

	function seededOnly(representations: Array<Record<string, unknown>>) {
		return representations.filter((r) =>
			ALL_SIRENS.includes(r.SIREN as string),
		);
	}

	function bySiren(
		representations: Array<Record<string, unknown>>,
		siren: string,
	) {
		return representations.find((r) => r.SIREN === siren);
	}

	it("includes a declaration submitted exactly on date_begin and excludes one submitted exactly on date_end (S29)", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		const sirens = seededOnly(body.Representations).map((r) => r.SIREN);
		expect(sirens).toContain(SIREN_WINDOW_START);
		expect(sirens).not.toContain(SIREN_WINDOW_END);
	});

	it("includes the declaration submitted on date_end once the window is widened", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: "2030-03-21",
		});

		expect(seededOnly(body.Representations).map((r) => r.SIREN)).toContain(
			SIREN_WINDOW_END,
		);
	});

	it("excludes a declaration submitted the second before date_begin (S29)", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		expect(seededOnly(body.Representations).map((r) => r.SIREN)).not.toContain(
			SIREN_BEFORE_WINDOW,
		);
	});

	it("returns only the date_begin day when date_end is omitted (S29)", async () => {
		const body = await fetchWindow({ date_begin: DATE_BEGIN });

		expect(body.Date_debut).toBe(DATE_BEGIN);
		expect(body.Date_fin).toBe("2030-03-16");
		expect(seededOnly(body.Representations).map((r) => r.SIREN)).toEqual([
			SIREN_WINDOW_START,
		]);
	});

	it("excludes a draft declaration even when its submission date falls inside the window", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		expect(seededOnly(body.Representations).map((r) => r.SIREN)).not.toContain(
			SIREN_DRAFT,
		);
	});

	it("includes a declaration that becomes submitted after having been a draft", async () => {
		await sql`UPDATE app_representation_declaration SET status = 'submitted' WHERE id = 'suit-repr-draft'`;

		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		expect(seededOnly(body.Representations).map((r) => r.SIREN)).toContain(
			SIREN_DRAFT,
		);
	});

	it("returns the envelope with a Nombre matching the Representations length (S29)", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		expect(Object.keys(body)).toEqual([
			"Date_debut",
			"Date_fin",
			"Nombre",
			"Representations",
		]);
		expect(body.Date_debut).toBe(DATE_BEGIN);
		expect(body.Date_fin).toBe(DATE_END);
		expect(body.Nombre).toBe(body.Representations.length);
	});

	it("joins the company identity and location onto the declaration", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		expect(bySiren(body.Representations, SIREN_WINDOW_START)).toMatchObject({
			id: "suit-repr-window-start",
			SIREN: SIREN_WINDOW_START,
			Raison_sociale: "Entreprise Borne Debut",
			Adresse: "1 rue de la Paix, 75002 Paris",
			Code_NAF: "62.02A",
			Région: "Île-de-France",
			Département: "Paris",
			Année_référence: YEAR,
			Période_référence_début: "2029-01-01",
			Période_référence_fin: "2029-12-31",
			Pourcentage_femmes_cadres: 40,
			Pourcentage_hommes_cadres: 60,
			Pourcentage_femmes_membres: 45.5,
			Pourcentage_hommes_membres: 54.5,
			Date_publication: "2030-03-01",
			URL_publication: "https://example.fr/borne-debut",
			Modalités_communication: "Site internet",
			Date_déclaration: "2030-03-15T00:00:00.000Z",
		});
	});

	it("returns full identity and location for a non-diffusible company (S30)", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: DATE_END,
		});

		expect(bySiren(body.Representations, SIREN_NON_DIFFUSIBLE)).toMatchObject({
			SIREN: SIREN_NON_DIFFUSIBLE,
			Raison_sociale: "Entreprise Non Diffusible",
			Adresse: "2 rue Secrete, 69001 Lyon",
			Code_NAF: "70.10Z",
			Région: "Auvergne-Rhône-Alpes",
			Département: "Rhône",
		});
	});

	it("returns the non-computable reasons verbatim from the DB enums", async () => {
		const body = await fetchWindow({
			date_begin: DATE_BEGIN,
			date_end: "2030-03-21",
		});

		expect(bySiren(body.Representations, SIREN_WINDOW_END)).toMatchObject({
			Pourcentage_femmes_cadres: null,
			Pourcentage_hommes_cadres: null,
			Motif_non_calculabilité_cadres: "aucun_cadre_dirigeant",
			Pourcentage_femmes_membres: null,
			Pourcentage_hommes_membres: null,
			Motif_non_calculabilité_membres: "aucune_instance_dirigeante",
		});
	});

	it("returns the raw rows unfiltered by diffusibility from the DB layer (S30)", async () => {
		const { fetchSubmittedRepresentations } = await import(
			"~/modules/export/fetchRepresentations"
		);

		const rows = await fetchSubmittedRepresentations(DATE_BEGIN, DATE_END);
		const row = rows.find((r) => r.siren === SIREN_NON_DIFFUSIBLE);

		expect(row).toMatchObject({
			companyName: "Entreprise Non Diffusible",
			address: "2 rue Secrete, 69001 Lyon",
			nafCode: "70.10Z",
			region: "Auvergne-Rhône-Alpes",
			departmentLabel: "Rhône",
		});
		expect(row).not.toHaveProperty("statutDiffusion");
	});

	it("traces the call in the audit log under the export category (S29)", async () => {
		await sql`DELETE FROM audit.action_log WHERE action = 'export.api_representations'`;

		await fetchWindow({ date_begin: DATE_BEGIN, date_end: DATE_END });
		await new Promise((resolve) => setTimeout(resolve, 200));

		const logs = await sql`
			SELECT action, category, status, metadata FROM audit.action_log
			WHERE action = 'export.api_representations'
		`;
		expect(logs).toHaveLength(1);
		expect(logs[0]).toMatchObject({
			action: "export.api_representations",
			category: "export",
			status: "success",
			metadata: { date_begin: DATE_BEGIN, date_end: DATE_END },
		});
	});

	it("traces a rejected call as a failure without touching the database", async () => {
		await sql`DELETE FROM audit.action_log WHERE action = 'export.api_representations'`;

		const { GET } = await import("~/app/api/v1/export/representations/route");
		const response = await GET(
			new Request("http://localhost/api/v1/export/representations"),
		);
		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(response.status).toBe(403);
		const logs = await sql`
			SELECT status FROM audit.action_log
			WHERE action = 'export.api_representations'
		`;
		expect(logs).toHaveLength(1);
		expect(logs[0]).toMatchObject({ status: "failure" });
	});
});
