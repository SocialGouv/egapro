import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import {
	getPublicCompanyLocation,
	NON_DIFFUSIBLE_LABEL,
} from "~/modules/public-api";
import { db } from "~/server/db";
import { companies } from "~/server/db/schema";

const SIREN_FRENCH = "815000001";
const SIREN_HIDDEN = "815000002";
const SIREN_FOREIGN = "815000003";
const SIREN_ABSENT = "815000004";
const SIRENS = [SIREN_FRENCH, SIREN_HIDDEN, SIREN_FOREIGN, SIREN_ABSENT];

async function cleanup(sql: ReturnType<typeof postgres>) {
	await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
}

describe("getPublicCompanyLocation (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup(sql);
		await db.insert(companies).values([
			{
				siren: SIREN_FRENCH,
				name: "Société Démo",
				address: "1 RUE DE LA PAIX 75002 PARIS",
				city: "PARIS",
				regionCode: "11",
				region: "Île-de-France",
				departmentCode: "75",
				departmentLabel: "Paris",
				countryLabel: "FRANCE",
				statutDiffusion: "O",
			},
			{
				siren: SIREN_HIDDEN,
				name: "Société Masquée",
				address: "2 RUE DU SECRET 69001 LYON",
				city: "LYON",
				regionCode: "84",
				region: "Auvergne-Rhône-Alpes",
				departmentCode: "69",
				departmentLabel: "Rhône",
				countryLabel: "FRANCE",
				statutDiffusion: "N",
			},
			{
				siren: SIREN_FOREIGN,
				name: "Société Belge",
				address: "12 RUE DE LA DEMO",
				region: "Île-de-France",
				countryCode: "99131",
				countryLabel: "BELGIQUE",
				statutDiffusion: "O",
			},
		]);
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup(sql);
		await sql.end();
	});

	it("returns the location columns of a diffusible company", async () => {
		expect(await getPublicCompanyLocation(SIREN_FRENCH)).toEqual({
			address: "1 RUE DE LA PAIX 75002 PARIS",
			city: "PARIS",
			regionCode: "11",
			region: "Île-de-France",
			departmentCode: "75",
			departmentLabel: "Paris",
			countryCode: null,
			countryLabel: "FRANCE",
		});
	});

	it("masks the eight location fields of a non-diffusible company", async () => {
		expect(await getPublicCompanyLocation(SIREN_HIDDEN)).toEqual({
			address: NON_DIFFUSIBLE_LABEL,
			city: NON_DIFFUSIBLE_LABEL,
			regionCode: NON_DIFFUSIBLE_LABEL,
			region: NON_DIFFUSIBLE_LABEL,
			departmentCode: NON_DIFFUSIBLE_LABEL,
			departmentLabel: NON_DIFFUSIBLE_LABEL,
			countryCode: NON_DIFFUSIBLE_LABEL,
			countryLabel: NON_DIFFUSIBLE_LABEL,
		});
	});

	it("drops the region carried by the row of a foreign company", async () => {
		expect(await getPublicCompanyLocation(SIREN_FOREIGN)).toMatchObject({
			address: "12 RUE DE LA DEMO",
			city: null,
			region: null,
			countryCode: "99131",
			countryLabel: "BELGIQUE",
		});
	});

	it("returns null for a siren without company row", async () => {
		expect(await getPublicCompanyLocation(SIREN_ABSENT)).toBeNull();
	});
});
