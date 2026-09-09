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
import { companyRouter } from "~/server/api/routers/company";
import { db } from "~/server/db";
import { fetchCompanyBySiren } from "~/server/services/weez";

vi.mock("~/server/services/weez", () => ({
	fetchCompanyBySiren: vi.fn(),
}));

// company.test.ts mocks the driver, so the two-column UPDATE below would pass it
// even with a column drizzle cannot map. #4087 is exactly a stored-pair bug: it
// has to be proven against the real table.
describe("companyRouter.get NAF backfill (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "700000020";
	const USER_ID = "company-naf-backfill-integration-test-user";
	const USER_EMAIL = "company-naf-backfill-integration@example.fr";

	function createCaller() {
		return companyRouter.createCaller({
			db,
			session: {
				user: { id: USER_ID, email: USER_EMAIL, isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	async function cleanup() {
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	async function storedNaf() {
		const [row] = await sql`
			SELECT naf_code, naf_label FROM app_company WHERE siren = ${SIREN}
		`;
		return row;
	}

	async function seedCompany(nafCode: string | null, nafLabel: string | null) {
		await sql`
			INSERT INTO app_company (siren, name, naf_code, naf_label)
			VALUES (${SIREN}, 'Alpha Solutions', ${nafCode}, ${nafLabel})
		`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN})`;
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
		vi.mocked(fetchCompanyBySiren).mockReset();
		await cleanup();
		await sql`INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})`;
	});

	it("persists the rév. 2 code and label over a stale NAF 2025 code", async () => {
		await seedCompany("65.12Y", null);
		vi.mocked(fetchCompanyBySiren).mockResolvedValue({
			name: "Alpha Solutions",
			address: null,
			nafCode: "65.12Z",
			nafLabel: "Autres assurances",
			region: null,
			departmentCode: null,
			departmentLabel: null,
			countryCode: null,
			countryLabel: "FRANCE",
			workforce: null,
			statutDiffusion: "O",
		});

		const result = await createCaller().get({ siren: SIREN });

		expect(result.nafCode).toBe("65.12Z");
		expect(result.nafLabel).toBe("Autres assurances");
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Z",
			naf_label: "Autres assurances",
		});
	});

	it("leaves the stored pair untouched when Weez has no code", async () => {
		await seedCompany("65.12Y", null);
		vi.mocked(fetchCompanyBySiren).mockResolvedValue({
			name: "Alpha Solutions",
			address: null,
			nafCode: null,
			nafLabel: "Autres assurances",
			region: null,
			departmentCode: null,
			departmentLabel: null,
			countryCode: null,
			countryLabel: "FRANCE",
			workforce: null,
			statutDiffusion: "O",
		});

		const result = await createCaller().get({ siren: SIREN });

		expect(result.nafCode).toBe("65.12Y");
		expect(result.nafLabel).toBeNull();
		expect(await storedNaf()).toMatchObject({
			naf_code: "65.12Y",
			naf_label: null,
		});
	});

	it("does not read the registry when the pair is already complete", async () => {
		await seedCompany("65.12Z", "Autres assurances");

		const result = await createCaller().get({ siren: SIREN });

		expect(fetchCompanyBySiren).not.toHaveBeenCalled();
		expect(result.nafCode).toBe("65.12Z");
		expect(result.nafLabel).toBe("Autres assurances");
	});
});
