import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("GET /api/v1/export/declarations — CSE opinion updates (#4574)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456788";
	const YEAR = getCurrentYear();
	const USER_ID = "cse-opinion-update-user";
	const USER_EMAIL = "cse-opinion-update@example.fr";
	const DECLARATION_ID = "cse-opinion-update-declaration";
	const FILE_ID = "cse-opinion-update-file";

	function createCaller() {
		return appRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: USER_EMAIL,
					siret: `${SIREN}00015`,
					isAdmin: false,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never).cseOpinion;
	}

	async function cleanup() {
		await sql`DELETE FROM app_cse_opinion WHERE declaration_id = ${DECLARATION_ID}`;
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
			VALUES (${USER_ID}, ${USER_EMAIL}, 'Test', 'CSE')
		`;
		await sql`
			INSERT INTO app_company (siren, name, workforce)
			VALUES (${SIREN}, 'Entreprise Test CSE', 250)
		`;
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, created_at, updated_at)
			VALUES
				(${DECLARATION_ID}, ${SIREN}, ${YEAR}, ${USER_ID}, 'demarche_completed',
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
	});

	function gatewayRequest(): Request {
		return new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2025-05-01&date_end=2025-05-02",
			{ headers: { "x-gateway-forwarded": "test-value" } },
		);
	}

	async function fetchAccuracyOpinion() {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(gatewayRequest());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(1);
		const accuracyOpinion = body.Declarations[0].Avis_CSE.find(
			(entry: { Numero_declaration: number; Type: string }) =>
				entry.Numero_declaration === 1 && entry.Type === "accuracy",
		);
		return accuracyOpinion.Avis;
	}

	it("returns the updated first-declaration opinion after a real re-submission", async () => {
		const caller = createCaller();

		// First submission of the CSE opinion step: the accuracy opinion is favorable.
		await caller.saveOpinions({
			firstDeclaration: {
				accuracyOpinion: "favorable",
				accuracyDate: "2025-05-01",
				gapConsulted: true,
				gapOpinion: "favorable",
				gapDate: "2025-05-01",
			},
		});

		expect(await fetchAccuracyOpinion()).toBe("favorable");

		// The user flips the flag (OUI -> NON, issue #4574) and re-submits through
		// the same mutation the CSE opinion form uses — `saveOpinions` deletes the
		// previous rows and re-inserts fresh ones, which a raw SQL `UPDATE` on the
		// original row would never exercise.
		await caller.saveOpinions({
			firstDeclaration: {
				accuracyOpinion: "unfavorable",
				accuracyDate: "2025-05-01",
				gapConsulted: true,
				gapOpinion: "favorable",
				gapDate: "2025-05-01",
			},
		});

		expect(await fetchAccuracyOpinion()).toBe("unfavorable");
	});
});
