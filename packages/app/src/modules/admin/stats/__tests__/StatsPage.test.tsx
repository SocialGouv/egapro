import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: { NEXT_PUBLIC_EGAPRO_ENV: "dev" as string },
}));

vi.mock("~/env", () => ({ env: mockEnv }));

import StatsPage from "~/app/admin/stats/page";

describe("admin stats page", () => {
	beforeEach(() => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = "dev";
	});

	it.each([
		"dev",
		"preprod",
	])("asks for the test-data notice on the %s environment", (egaproEnv) => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = egaproEnv;

		expect(StatsPage().props.showTestDataNotice).toBe(true);
	});

	it("hides the test-data notice in production", () => {
		mockEnv.NEXT_PUBLIC_EGAPRO_ENV = "prod";

		expect(StatsPage().props.showTestDataNotice).toBe(false);
	});

	it("offers every campaign year from the current one down to the first declaration year", () => {
		const { availableYears, currentYear } = StatsPage().props;

		expect(availableYears[0]).toBe(currentYear);
		expect(availableYears).toEqual(
			[...availableYears].sort((a: number, b: number) => b - a),
		);
	});
});
