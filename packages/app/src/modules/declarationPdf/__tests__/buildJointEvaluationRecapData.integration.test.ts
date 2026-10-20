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
	buildJointEvaluationRecapData,
	JointEvaluationNotTransmittedError,
} from "~/modules/declarationPdf/buildJointEvaluationRecapData";

describe("buildJointEvaluationRecapData against a real Postgres", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "333444555";
	const YEAR = 2027;
	const USER_ID = "joint-evaluation-recap-integration-user";
	const DECLARATION_ID = "joint-evaluation-recap-integration";
	const FILE_ID = "joint-evaluation-recap-integration-file";
	const UPLOADED_AT = new Date("2027-04-01T10:00:00.000Z");
	const SUBMITTED_AT = new Date("2027-04-03T12:00:00.000Z");

	async function recordEvent(
		eventType: string,
		createdAt: Date,
		{ round = 1, value = null }: { round?: number; value?: string | null } = {},
	) {
		await sql`
			INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, value, round, actor_user_id, created_at)
			VALUES
				(${crypto.randomUUID()}, ${DECLARATION_ID}, ${eventType}, ${value}, ${round}, ${USER_ID}, ${createdAt})
		`;
	}

	async function depositReport(uploadedAt: Date) {
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, uploaded_at, type)
			VALUES (${FILE_ID}, ${DECLARATION_ID}, 'rapport.pdf', 'joint/rapport.pdf', ${uploadedAt}, 'joint_evaluation')
		`;
	}

	async function cleanup() {
		await sql`DELETE FROM app_declaration_status_history WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_file WHERE declaration_id = ${DECLARATION_ID}`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name, phone)
			VALUES (${USER_ID}, 'declarant@example.fr', 'Marie', 'Dupont', '01 02 03 04 05')
		`;
		await sql`
			INSERT INTO app_company (siren, name, address, has_cse)
			VALUES (${SIREN}, 'Société Démo', '1 rue de Paris 75001 Paris', true)
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

	it("assembles the recap of a report transmitted at the first round", async () => {
		await depositReport(UPLOADED_AT);
		await recordEvent("joint_evaluation_submit", SUBMITTED_AT);

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data).toEqual({
			year: YEAR,
			transmittedAt: "03/04/2027",
			referencePeriod: "01/01/2026 - 31/12/2026",
			declarant: {
				name: "Marie Dupont",
				email: "declarant@example.fr",
				phone: "01 02 03 04 05",
			},
			company: expect.objectContaining({
				name: "Société Démo",
				siren: "333 444 555",
				workforceLabel: "Effectif annuel moyen en 2026",
				cseDisplay: "Oui",
			}),
			file: {
				id: FILE_ID,
				name: "rapport.pdf",
				detail: "PDF – 17,96 Ko · déposé le 1ᵉʳ avril 2027",
			},
		});
		expect(mocks.getFileSize).toHaveBeenCalledWith("joint/rapport.pdf");
	});

	it("uses the second declaration period for a report transmitted at the second round", async () => {
		await depositReport(UPLOADED_AT);
		await recordEvent("joint_evaluation_submit", SUBMITTED_AT, { round: 2 });

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.referencePeriod).toBe("01/02/2027 - 31/07/2027");
	});

	it("dates the recap with the latest submission", async () => {
		await depositReport(UPLOADED_AT);
		await recordEvent("joint_evaluation_submit", SUBMITTED_AT);
		await recordEvent(
			"joint_evaluation_submit",
			new Date("2027-05-10T08:00:00.000Z"),
			{ round: 2 },
		);

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.transmittedAt).toBe("10/05/2027");
	});

	it("shows the format alone when the stored size cannot be read", async () => {
		mocks.getFileSize.mockResolvedValue(null);
		await depositReport(UPLOADED_AT);
		await recordEvent("joint_evaluation_submit", SUBMITTED_AT);

		const data = await buildJointEvaluationRecapData(SIREN, YEAR);

		expect(data.file.detail).toBe("PDF · déposé le 1ᵉʳ avril 2027");
	});

	it("refuses a report deposited but never transmitted", async () => {
		await depositReport(UPLOADED_AT);

		await expect(buildJointEvaluationRecapData(SIREN, YEAR)).rejects.toThrow(
			JointEvaluationNotTransmittedError,
		);
	});

	it("refuses a report uploaded after the latest submission", async () => {
		await recordEvent("joint_evaluation_submit", SUBMITTED_AT);
		await depositReport(new Date("2027-04-05T10:00:00.000Z"));

		await expect(buildJointEvaluationRecapData(SIREN, YEAR)).rejects.toThrow(
			JointEvaluationNotTransmittedError,
		);
	});

	it("refuses a report the company departed from since", async () => {
		await depositReport(UPLOADED_AT);
		await recordEvent("joint_evaluation_submit", SUBMITTED_AT);
		await recordEvent("path_choice", new Date("2027-04-10T10:00:00.000Z"), {
			round: 2,
			value: "corrective_action",
		});

		await expect(buildJointEvaluationRecapData(SIREN, YEAR)).rejects.toThrow(
			JointEvaluationNotTransmittedError,
		);
	});

	it("refuses a year without any declaration", async () => {
		await expect(
			buildJointEvaluationRecapData(SIREN, YEAR - 1),
		).rejects.toThrow(JointEvaluationNotTransmittedError);
	});
});
