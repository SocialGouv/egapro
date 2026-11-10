import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	consumeSubmissionBannerFlash,
	markSubmissionBannerFlash,
} from "../submissionBannerFlash";

describe("submissionBannerFlash", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("reports no flash when none was ever marked", () => {
		expect(consumeSubmissionBannerFlash()).toBe(false);
	});

	it("reports a flash right after it was marked", () => {
		markSubmissionBannerFlash();
		expect(consumeSubmissionBannerFlash()).toBe(true);
	});

	it("consumes the flash so a second read in the same visit reports nothing", () => {
		markSubmissionBannerFlash();
		expect(consumeSubmissionBannerFlash()).toBe(true);
		expect(consumeSubmissionBannerFlash()).toBe(false);
	});

	it("rejects a flash older than 30 seconds (stale tab left open on the destination page)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		markSubmissionBannerFlash();

		vi.setSystemTime(new Date("2026-01-01T00:00:30.001Z"));
		expect(consumeSubmissionBannerFlash()).toBe(false);
	});

	it("accepts a flash read exactly at the 30-second boundary", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		markSubmissionBannerFlash();

		vi.setSystemTime(new Date("2026-01-01T00:00:30Z"));
		expect(consumeSubmissionBannerFlash()).toBe(true);
	});

	it("never throws when sessionStorage is disabled, and reports no flash", () => {
		vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
			throw new Error("SecurityError: storage disabled");
		});

		expect(() => consumeSubmissionBannerFlash()).not.toThrow();
		expect(consumeSubmissionBannerFlash()).toBe(false);
	});

	it("never throws when marking fails, so navigation after submission still works", () => {
		vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
			throw new Error("SecurityError: storage disabled");
		});

		expect(() => markSubmissionBannerFlash()).not.toThrow();
	});

	it("ignores a corrupted (non-numeric) stored timestamp", () => {
		window.sessionStorage.setItem(
			"egapro:cse-submission-banner",
			"not-a-number",
		);
		expect(consumeSubmissionBannerFlash()).toBe(false);
	});
});
