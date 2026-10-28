import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { db } from "~/server/db";
import {
	getJustificationRequirements,
	getRequiredContentTypes,
} from "../cseRequiredContentTypes";

describe("getRequiredContentTypes — stored gap qualification", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "555666779";
	const USER_ID = "1d9a7b8c-4c8b-4a4f-8e1b-7b2d3c4e5f60";
	const DECLARATION_ID = "required-content-types-declaration";
	const JOB_CATEGORY_ID = "required-content-types-job-category";
	const YEAR = getCurrentYear();

	async function qualify(justification: string | null) {
		await sql`UPDATE app_declaration SET first_declaration_gap_justification = ${justification} WHERE id = ${DECLARATION_ID}`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`INSERT INTO app_user (id, email) VALUES (${USER_ID}, 'required-types@example.fr') ON CONFLICT DO NOTHING`;
		await sql`INSERT INTO app_company (siren, name) VALUES (${SIREN}, 'Société Démo') ON CONFLICT DO NOTHING`;
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_cse_opinion WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_employee_category WHERE job_category_id = ${JOB_CATEGORY_ID}`;
		await sql`DELETE FROM app_job_category WHERE id = ${JOB_CATEGORY_ID}`;
		await sql`DELETE FROM app_declaration WHERE id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_cse_opinion WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_employee_category WHERE job_category_id = ${JOB_CATEGORY_ID}`;
		await sql`DELETE FROM app_job_category WHERE id = ${JOB_CATEGORY_ID}`;
		await sql`DELETE FROM app_declaration WHERE id = ${DECLARATION_ID}`;
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, first_declaration_path_choice)
			VALUES
				(${DECLARATION_ID}, ${SIREN}, ${YEAR}, ${USER_ID}, 'awaiting_cse_opinion', 'joint_evaluation')
		`;
		await sql`
			INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
			VALUES (${JOB_CATEGORY_ID}, ${DECLARATION_ID}, 0, 'Catégorie', 'manual')
		`;
		await sql`
			INSERT INTO app_employee_category
				(id, job_category_id, declaration_type, annual_base_women, annual_base_men)
			VALUES
				('required-content-types-employee-category', ${JOB_CATEGORY_ID}, 'initial', '30000', '40000')
		`;
		await sql`
			INSERT INTO app_cse_opinion (id, declaration_id, declaration_number, type, gap_consulted)
			VALUES (${crypto.randomUUID()}, ${DECLARATION_ID}, 1, 'gap', false)
		`;
	});

	it("requires the justification for partial, even when gap_consulted is false", async () => {
		await qualify("partial");

		expect(await getRequiredContentTypes(db, DECLARATION_ID)).toEqual([
			{ declarationNumber: 1, type: "accuracy" },
			{ declarationNumber: 1, type: "gap" },
		]);
	});

	it.each([
		"none",
		null,
	])("does not require the justification for %s", async (justification) => {
		await qualify(justification);

		expect(await getRequiredContentTypes(db, DECLARATION_ID)).toEqual([
			{ declarationNumber: 1, type: "accuracy" },
		]);
	});

	it("does not require it when the gap has disappeared", async () => {
		await qualify("all");
		await sql`UPDATE app_employee_category SET annual_base_men = '30000' WHERE job_category_id = ${JOB_CATEGORY_ID}`;

		expect(await getJustificationRequirements(db, DECLARATION_ID)).toEqual({
			firstDeclJustificationRequired: false,
			secondDeclJustificationRequired: false,
		});
	});

	it("requires nothing beyond accuracy for an unknown declaration", async () => {
		expect(await getJustificationRequirements(db, "missing")).toEqual({
			firstDeclJustificationRequired: false,
			secondDeclJustificationRequired: false,
		});
	});
});
