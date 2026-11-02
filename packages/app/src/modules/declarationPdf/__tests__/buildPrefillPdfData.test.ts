import { describe, expect, it } from "vitest";

import {
	formatWorkforceForUser,
	GIP_WORKFORCE_VOLUNTARY_DISPLAY,
} from "~/modules/domain";

import {
	DEMO_COMPANY,
	makeGip,
	makePrefillData,
} from "./helpers/prefillFixtures";

describe("buildPrefillPdfData", () => {
	it("projects the company block and the reference period", () => {
		const data = makePrefillData();

		expect(data).toMatchObject({
			siren: "123456789",
			year: 2027,
			companyName: "Société Démo",
			address: "1 rue de la Démo, 75001 Paris",
			naf: "62.02A - Conseil en systèmes et logiciels informatiques",
			workforceYear: 2026,
			workforceDisplay: formatWorkforceForUser(2256),
			referencePeriod: "01/01/2026 - 31/12/2026",
		});
	});

	it("falls back on the placeholder name and empty company fields without a company row", () => {
		const data = makePrefillData({ company: undefined });

		expect(data.companyName).toBe("Entreprise 123456789");
		expect(data.address).toBe("");
		expect(data.naf).toBe("-");
		expect(data.cseDisplay).toBe("Non renseigné");
	});

	it.each([
		["37.00", GIP_WORKFORCE_VOLUNTARY_DISPLAY],
		[null, GIP_WORKFORCE_VOLUNTARY_DISPLAY],
		["250.00", formatWorkforceForUser(250)],
	])("prints a workforceEma of %s as %s", (workforceEma, expected) => {
		expect(makePrefillData({ workforceEma }).workforceDisplay).toBe(expected);
	});

	it.each([
		[true, "Oui"],
		[false, "Non"],
		[null, "Non renseigné"],
	])("prints a CSE presence of %s as %s above the obligation threshold", (hasCse, expected) => {
		const data = makePrefillData({ company: { ...DEMO_COMPANY, hasCse } });
		expect(data.cseDisplay).toBe(expected);
	});

	it("omits the CSE line below the obligation threshold", () => {
		expect(makePrefillData({ workforceEma: "80.00" }).cseDisplay).toBeNull();
		expect(makePrefillData({ workforceEma: null }).cseDisplay).toBeNull();
	});

	it.each([
		[null, "2026-12-31"],
		["2026-01-01", null],
		[undefined, "2026-12-31"],
	])("drops the reference period when a bound is missing (%s → %s)", (periodStart, periodEnd) => {
		const data = makePrefillData({ gip: { periodStart, periodEnd } });
		expect(data.referencePeriod).toBeNull();
	});

	it("reuses the parcours projection for workforce, pay gaps and quartiles", () => {
		const gip = makeGip();
		const data = makePrefillData();

		expect(data).toMatchObject(gip.step1);
		expect(data.step2Data.indicatorAAnnualWomen).toBe("35050.21");
		expect(data.step2Gaps[0]).toEqual({
			women: "35050.21",
			men: "36739.82",
			gap: "0.046",
		});
		expect(data.step3Data.indicatorEWomen).toBe("60");
		expect(data.step3Gaps[3]?.gap).toBe("0.3127");
		expect(data.step4Data.annual[0]).toEqual({
			threshold: "20700.35",
			women: 60,
			men: 30,
		});
		expect(data.step4Data.hourly[3]).toEqual({
			threshold: undefined,
			women: 4,
			men: 9,
		});
	});
});
