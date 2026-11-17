import { describe, expect, it } from "vitest";

import {
	DECLARATION_RETENTION_YEARS,
	USER_ACCOUNT_INACTIVITY_RETENTION_YEARS,
} from "../shared/retention";

describe("retention windows", () => {
	it("announces a two-year account inactivity window", () => {
		expect(USER_ACCOUNT_INACTIVITY_RETENTION_YEARS).toBe(2);
	});

	it("announces a six-year declaration retention window", () => {
		expect(DECLARATION_RETENTION_YEARS).toBe(6);
	});

	it("is exported by the domain barrel", async () => {
		const domain = await import("../index");

		expect(domain.USER_ACCOUNT_INACTIVITY_RETENTION_YEARS).toBe(
			USER_ACCOUNT_INACTIVITY_RETENTION_YEARS,
		);
		expect(domain.DECLARATION_RETENTION_YEARS).toBe(
			DECLARATION_RETENTION_YEARS,
		);
	});
});
