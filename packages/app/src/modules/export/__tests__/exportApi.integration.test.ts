import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

describe("GET /api/v1/export/declarations — Date_annulation integration", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456789";
	const YEAR = 2025;
	const USER_ID = "export-integration-test-user";

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN} AND year = ${YEAR}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN} AND year = ${YEAR}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;

		await sql`
			INSERT INTO app_user (id, email, first_name, last_name)
			VALUES (${USER_ID}, 'dir.rh@example.fr', 'Dir', 'RH')
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_company (siren, name, workforce)
			VALUES (${SIREN}, 'Entreprise Test Export', 250)
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, status, cancelled_at, created_at, updated_at)
			VALUES
				('export-decl-cancelled-1', ${SIREN}, ${YEAR}, ${USER_ID}, 'submitted', '2025-04-15T12:00:00Z', '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z'),
				('export-decl-cancelled-2', ${SIREN}, ${YEAR}, ${USER_ID}, 'submitted', '2025-04-20T12:00:00Z', '2025-03-15T00:00:00Z', '2025-03-15T00:00:00Z'),
				('export-decl-active',      ${SIREN}, ${YEAR}, ${USER_ID}, 'submitted', NULL,                   '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z')
		`;
	});

	function gatewayRequest(params: Record<string, string>): Request {
		const searchParams = new URLSearchParams(params);
		return new Request(
			`http://localhost/api/v1/export/declarations?${searchParams}`,
			{ headers: { "x-gateway-forwarded": "test-value" } },
		);
	}

	it("returns a cancelled declaration with its Date_annulation as ISO string", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(
			gatewayRequest({ date_begin: "2025-04-15", date_end: "2025-04-16" }),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(1);
		const decl = body.Declarations[0];
		expect(decl.SIREN).toBe(SIREN);
		expect(decl.Date_annulation).toBe("2025-04-15T12:00:00.000Z");
		expect(decl.Indicateurs).toBeDefined();
	});

	it("returns the active declaration with Date_annulation null", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(
			gatewayRequest({ date_begin: "2025-05-01", date_end: "2025-05-02" }),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(1);
		const decl = body.Declarations[0];
		expect(decl.Date_annulation).toBeNull();
		expect(decl.SIREN).toBe(SIREN);
	});

	it("returns all 3 declarations across a wide date window, with 2 cancelled and 1 active", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(
			gatewayRequest({ date_begin: "2025-04-15", date_end: "2025-05-02" }),
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(3);

		const cancelled = body.Declarations.filter(
			(d: { Date_annulation: string | null }) => d.Date_annulation !== null,
		);
		const active = body.Declarations.filter(
			(d: { Date_annulation: string | null }) => d.Date_annulation === null,
		);
		expect(cancelled).toHaveLength(2);
		expect(active).toHaveLength(1);

		for (const decl of body.Declarations) {
			expect(decl.Indicateurs).toBeDefined();
			expect(decl.SIREN).toBe(SIREN);
		}
	});
});
