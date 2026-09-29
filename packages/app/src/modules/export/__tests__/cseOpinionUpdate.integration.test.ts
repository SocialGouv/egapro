import postgres from "postgres";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

vi.mock("~/modules/mail/server", () => ({
	enqueueReceipt: vi.fn().mockResolvedValue(undefined),
}));

type ExportedOpinion = {
	Numero_declaration: number;
	Type: string;
	Avis: string | null;
	Date: string | null;
};

type ExportedFile = {
	Contenus: { Numero_declaration: number; Type: string }[];
};

describe("GET /api/v1/export/declarations — CSE opinion updates (#4574)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456788";
	const YEAR = getCurrentYear();
	const USER_ID = "cse-opinion-update-user";
	const USER_EMAIL = "cse-opinion-update@example.fr";
	const DECLARATION_ID = "cse-opinion-update-declaration";
	const FILE_ID = "cse-opinion-update-file";
	const JOB_CATEGORY_ID = "cse-opinion-update-job-category";

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
		await sql`DELETE FROM app_employee_category WHERE job_category_id = ${JOB_CATEGORY_ID}`;
		await sql`DELETE FROM app_job_category WHERE id = ${JOB_CATEGORY_ID}`;
		await sql`DELETE FROM app_cse_opinion_file WHERE declaration_id = ${DECLARATION_ID}`;
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
				(${DECLARATION_ID}, ${SIREN}, ${YEAR}, ${USER_ID}, 'awaiting_cse_opinion',
				 '2025-05-01T08:00:00Z', '2025-05-01T10:00:00Z')
		`;
		await sql`
			INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
			VALUES (${JOB_CATEGORY_ID}, ${DECLARATION_ID}, 0, 'Ouvriers', 'manual')
		`;
		await sql`
			INSERT INTO app_employee_category
				(id, job_category_id, declaration_type, annual_base_women, annual_base_men)
			VALUES
				('cse-opinion-update-employee-category', ${JOB_CATEGORY_ID}, 'initial', '30000', '40000')
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
		const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
			.toISOString()
			.slice(0, 10);
		return new Request(
			`http://localhost/api/v1/export/declarations?date_begin=2025-05-01&date_end=${tomorrow}`,
			{ headers: { "x-gateway-forwarded": "test-value" } },
		);
	}

	async function fetchExportedDeclaration() {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const response = await GET(gatewayRequest());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(1);
		return body.Declarations[0] as {
			Avis_CSE: ExportedOpinion[];
			Fichiers_CSE: ExportedFile[];
		};
	}

	function findOpinion(opinions: ExportedOpinion[], type: string) {
		return opinions.find(
			(entry) => entry.Numero_declaration === 1 && entry.Type === type,
		);
	}

	async function fetchAccuracyOpinion() {
		const declaration = await fetchExportedDeclaration();
		return findOpinion(declaration.Avis_CSE, "accuracy")?.Avis;
	}

	it("returns the updated first-declaration opinion after a real re-submission", async () => {
		const caller = createCaller();

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

	it("drops the gap justification from the API when the CSE consultation is switched from yes to no and the declaration is submitted again", async () => {
		const caller = createCaller();

		await caller.saveOpinions({
			firstDeclaration: {
				accuracyOpinion: "favorable",
				accuracyDate: "2025-05-01",
				gapConsulted: true,
				gapOpinion: "favorable",
				gapDate: "2025-05-01",
			},
		});
		await caller.setFileContentTypes({
			associations: [
				{ declarationNumber: 1, type: "accuracy", fileId: FILE_ID },
				{ declarationNumber: 1, type: "gap", fileId: FILE_ID },
			],
		});
		await caller.finalize();

		const beforeSwitch = await fetchExportedDeclaration();
		expect(findOpinion(beforeSwitch.Avis_CSE, "gap")).toMatchObject({
			Avis: "favorable",
			Date: "2025-05-01",
		});
		expect(beforeSwitch.Fichiers_CSE[0]?.Contenus).toEqual([
			{ Numero_declaration: 1, Type: "accuracy" },
			{ Numero_declaration: 1, Type: "gap" },
		]);

		await caller.saveOpinions({
			firstDeclaration: {
				accuracyOpinion: "favorable",
				accuracyDate: "2025-05-01",
				gapConsulted: false,
				gapOpinion: null,
				gapDate: null,
			},
		});
		await caller.finalize();

		const afterSwitch = await fetchExportedDeclaration();
		expect(findOpinion(afterSwitch.Avis_CSE, "accuracy")).toMatchObject({
			Avis: "favorable",
			Date: "2025-05-01",
		});
		expect(findOpinion(afterSwitch.Avis_CSE, "gap")).toMatchObject({
			Avis: null,
			Date: null,
		});
		expect(afterSwitch.Fichiers_CSE[0]?.Contenus).toEqual([
			{ Numero_declaration: 1, Type: "accuracy" },
		]);
	});
});
