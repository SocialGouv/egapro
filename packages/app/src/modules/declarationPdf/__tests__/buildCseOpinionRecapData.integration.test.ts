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

const mocks = vi.hoisted(() => ({ getFileSize: vi.fn() }));

vi.mock("~/server/services/s3", () => ({ getFileSize: mocks.getFileSize }));

import { env } from "~/env.js";
import {
	buildCseOpinionRecapData,
	CseOpinionNotTransmittedError,
} from "~/modules/declarationPdf/buildCseOpinionRecapData";
import { findTransmittedCseOpinions } from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";

describe("CSE opinion recap against a real Postgres", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "444555666";
	const YEAR = 2027;
	const USER_ID = "cse-opinion-recap-integration-user";
	const DECLARATION_ID = "cse-opinion-recap-integration";
	const SUBMITTED_AT = new Date("2027-02-10T10:00:00.000Z");

	async function recordEvent(eventType: string, createdAt: Date) {
		await sql`
			INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, round, actor_user_id, created_at)
			VALUES
				(${crypto.randomUUID()}, ${DECLARATION_ID}, ${eventType}, 1, ${USER_ID}, ${createdAt})
		`;
	}

	async function recordOpinion(
		declarationNumber: number,
		type: string,
		{
			gapConsulted = null,
			opinion = "favorable",
			opinionDate = "2027-02-01",
		}: {
			gapConsulted?: boolean | null;
			opinion?: string | null;
			opinionDate?: string | null;
		} = {},
	) {
		await sql`
			INSERT INTO app_cse_opinion
				(id, declaration_id, declaration_number, type, gap_consulted, opinion, opinion_date)
			VALUES
				(${crypto.randomUUID()}, ${DECLARATION_ID}, ${declarationNumber}, ${type}, ${gapConsulted}, ${opinion}, ${opinionDate})
		`;
	}

	async function depositFile(
		fileId: string,
		uploadedAt: Date,
		types: Array<[number, string]>,
	) {
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, uploaded_at, type)
			VALUES (${fileId}, ${DECLARATION_ID}, ${`${fileId}.pdf`}, ${`cse/${fileId}.pdf`}, ${uploadedAt}, 'cse_opinion')
		`;
		for (const [declarationNumber, type] of types) {
			await sql`
				INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
				VALUES (${crypto.randomUUID()}, ${DECLARATION_ID}, ${declarationNumber}, ${type}, ${fileId})
			`;
		}
	}

	async function cleanup() {
		await sql`DELETE FROM app_cse_opinion_file WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_cse_opinion WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_file WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`UPDATE app_declaration SET cse_opinion_draft_updated_at = NULL WHERE id = ${DECLARATION_ID}`;
	}

	async function transmitFirstDeclaration() {
		await recordOpinion(1, "accuracy");
		await recordOpinion(1, "gap", {
			gapConsulted: false,
			opinion: null,
			opinionDate: null,
		});
		await depositFile("avis-exactitude", new Date("2026-08-17T10:00:00Z"), [
			[1, "accuracy"],
		]);
		await recordEvent("cse_opinion_submit", SUBMITTED_AT);
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name, phone)
			VALUES (${USER_ID}, 'declarant@example.fr', 'Marie', 'Dupont', '01 02 03 04 05')
		`;
		await sql`
			INSERT INTO app_company (siren, name, address, department_label, naf_code, naf_label, has_cse)
			VALUES (${SIREN}, 'Société Démo', '1 rue de Paris 75001 Paris', 'Paris', '62.02A', 'Conseil en systèmes', true)
		`;
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
			VALUES (${SIREN}, ${YEAR}, 150)
		`;
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, current_step,
				 second_decl_reference_period_start, second_decl_reference_period_end)
			VALUES
				(${DECLARATION_ID}, ${SIREN}, ${YEAR}, ${USER_ID}, 'awaiting_cse_opinion', 6,
				 '2027-02-01', '2027-07-31')
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql`DELETE FROM app_declaration WHERE id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
		mocks.getFileSize.mockReset();
		mocks.getFileSize.mockResolvedValue(18_391);
	});

	it("reads the transmission with its storage keys for the server-side size lookup", async () => {
		await transmitFirstDeclaration();

		const transmitted = await findTransmittedCseOpinions(db, DECLARATION_ID);

		expect(transmitted).toMatchObject({
			year: YEAR,
			submittedAt: SUBMITTED_AT,
			workforceEma: "150.00",
			hasSubmittedSecondDeclaration: false,
			company: { siren: SIREN, nafCode: "62.02A", hasCse: true },
			declarant: { email: "declarant@example.fr" },
		});
		expect(transmitted?.opinions).toHaveLength(2);
		expect(transmitted?.associations).toEqual([
			expect.objectContaining({
				fileId: "avis-exactitude",
				filePath: "cse/avis-exactitude.pdf",
			}),
		]);
	});

	it("assembles the recap of a first declaration transmission", async () => {
		await transmitFirstDeclaration();

		const recap = await buildCseOpinionRecapData(SIREN, YEAR);

		expect(recap).toMatchObject({
			transmittedAt: "10/02/2027",
			company: { name: "Société Démo", siren: "444 555 666" },
			referencePeriods: [
				{ label: "Période de référence", value: "01/01/2026 - 31/12/2026" },
			],
			fileColumns: [
				{ id: "1:accuracy", label: "Exactitude", declarationLabel: null },
			],
			files: [
				{
					id: "avis-exactitude",
					name: "avis-exactitude.pdf",
					detail: "PDF – 17,96 Ko · déposé le 17 août 2026",
					columnIds: ["1:accuracy"],
				},
			],
		});
		expect(recap.declarations).toHaveLength(1);
		expect(recap.declarations[0]?.opinions[1]?.rows).toEqual([
			{ label: "CSE informé et consulté", value: "Non" },
		]);
		expect(mocks.getFileSize).toHaveBeenCalledWith("cse/avis-exactitude.pdf");
	});

	it("adds the second declaration once it was transmitted", async () => {
		await recordEvent(
			"second_declaration_submit",
			new Date("2027-02-05T10:00:00Z"),
		);
		await transmitFirstDeclaration();
		await recordOpinion(2, "accuracy", { opinion: "unfavorable" });
		await depositFile("avis-seconde", new Date("2026-08-18T10:00:00Z"), [
			[2, "accuracy"],
		]);

		const recap = await buildCseOpinionRecapData(SIREN, YEAR);

		expect(recap.declarations.map((d) => d.title)).toEqual([
			"Première déclaration",
			"Seconde déclaration",
		]);
		expect(recap.referencePeriods[1]?.value).toBe("01/02/2027 - 31/07/2027");
		expect(recap.fileColumns.map((c) => c.declarationLabel)).toEqual([
			"1re déclaration",
			"2e déclaration",
		]);
	});

	it("refuses opinions modified since their transmission", async () => {
		await transmitFirstDeclaration();
		await sql`UPDATE app_declaration SET cse_opinion_draft_updated_at = now() WHERE id = ${DECLARATION_ID}`;

		expect(await findTransmittedCseOpinions(db, DECLARATION_ID)).toBeNull();
		await expect(buildCseOpinionRecapData(SIREN, YEAR)).rejects.toThrow(
			CseOpinionNotTransmittedError,
		);
	});

	it("refuses opinions that were never transmitted", async () => {
		await recordOpinion(1, "accuracy");

		expect(await findTransmittedCseOpinions(db, DECLARATION_ID)).toBeNull();
	});

	it("refuses a year without any declaration", async () => {
		await expect(buildCseOpinionRecapData(SIREN, YEAR - 1)).rejects.toThrow(
			CseOpinionNotTransmittedError,
		);
	});
});
