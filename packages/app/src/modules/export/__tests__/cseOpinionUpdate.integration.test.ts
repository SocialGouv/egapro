import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

describe("GET /api/v1/export/declarations — CSE opinion updates", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456788";
	const YEAR = 2025;
	const USER_ID = "cse-opinion-update-user";
	const DECLARATION_ID = "cse-opinion-update-declaration";
	const OPINION_ID = "cse-opinion-update-opinion";
	const FILE_ID = "cse-opinion-update-file";

	async function cleanup() {
		await sql`DELETE FROM app_cse_opinion WHERE id = ${OPINION_ID}`;
		await sql`DELETE FROM app_file WHERE id = ${FILE_ID}`;
		await sql`DELETE FROM app_declaration WHERE id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
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
			VALUES (${USER_ID}, 'cse-opinion-update@example.fr', 'Test', 'CSE')
		`;
		await sql`
			INSERT INTO app_company (siren, name, workforce)
			VALUES (${SIREN}, 'Entreprise Test CSE', 250)
		`;
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, created_at, updated_at)
			VALUES
				(${DECLARATION_ID}, ${SIREN}, ${YEAR}, ${USER_ID}, 'submitted',
				 '2025-05-01T08:00:00Z', '2025-05-01T10:00:00Z')
		`;
		await sql`
			INSERT INTO app_file
				(id, declaration_id, file_name, file_path, type, uploaded_at)
			VALUES
				(${FILE_ID}, ${DECLARATION_ID}, 'avis-cse.pdf',
				 '123456788/2025/avis-cse.pdf', 'cse_opinion',
				 '2025-05-01T09:00:00Z')
		`;
		await sql`
			INSERT INTO app_cse_opinion
				(id, declaration_id, declaration_number, type, opinion, opinion_date)
			VALUES
				(${OPINION_ID}, ${DECLARATION_ID}, 1, 'accuracy', 'favorable', '2025-05-01')
		`;
	});

	function gatewayRequest(): Request {
		return new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2025-05-01&date_end=2025-05-02",
			{ headers: { "x-gateway-forwarded": "test-value" } },
		);
	}

	async function fetchOpinion() {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(gatewayRequest());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(1);
		return body.Declarations[0].Avis_CSE[0].Avis;
	}

	it("returns the updated first-declaration opinion when the same API URL is queried again", async () => {
		expect(await fetchOpinion()).toBe("favorable");

		await sql`
			UPDATE app_cse_opinion
			SET opinion = 'unfavorable', updated_at = '2025-05-01T11:00:00Z'
			WHERE id = ${OPINION_ID}
		`;

		expect(await fetchOpinion()).toBe("unfavorable");
	});
});
