import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftPayload } from "../draftSchema";
import { clearDraft, readDraft, writeDraft } from "../draftStorage";

const USER_ID = "user-1";
const STORAGE_KEY = `egapro:declaration-draft:${USER_ID}`;

const FIXED_NOW = new Date("2026-03-15T12:00:00Z").getTime();

function buildValidPayload(
	overrides: Partial<DraftPayload> = {},
): DraftPayload {
	return {
		siren: "123456789",
		year: 2026,
		step: 1,
		kind: "main",
		timestamp: FIXED_NOW - 1000,
		fields: { totalWomen: 10 },
		...overrides,
	};
}

describe("draftStorage", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.useFakeTimers();
		vi.setSystemTime(new Date(FIXED_NOW));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("readDraft", () => {
		it("returns null when no key exists", () => {
			expect(readDraft(USER_ID)).toBeNull();
		});

		it("purges and returns null on corrupt JSON", () => {
			window.localStorage.setItem(STORAGE_KEY, "{not-json");
			expect(readDraft(USER_ID)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("purges and returns null on Zod-invalid payload", () => {
			window.localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ siren: "abc", year: 2026 }),
			);
			expect(readDraft(USER_ID)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("purges and returns null when timestamp is older than 30 days", () => {
			const expired = buildValidPayload({
				timestamp: FIXED_NOW - 31 * 24 * 3600 * 1000,
			});
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expired));
			expect(readDraft(USER_ID)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("purges and returns null when the campaign deadline has passed", () => {
			vi.setSystemTime(new Date("2026-07-01T00:00:00Z").getTime());
			const payload = buildValidPayload({
				timestamp: new Date("2026-06-30T00:00:00Z").getTime(),
				year: 2026,
			});
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
			expect(readDraft(USER_ID)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("returns the parsed payload when valid and within deadlines", () => {
			const payload = buildValidPayload();
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
			expect(readDraft(USER_ID)).toEqual(payload);
		});
	});

	describe("writeDraft", () => {
		it("persists the payload as JSON under the user-scoped key", () => {
			const payload = buildValidPayload();
			writeDraft(USER_ID, payload);
			expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
				JSON.stringify(payload),
			);
		});

		it("write then read round-trips identical content", () => {
			const payload = buildValidPayload();
			writeDraft(USER_ID, payload);
			expect(readDraft(USER_ID)).toEqual(payload);
		});
	});

	describe("clearDraft", () => {
		it("removes the user-scoped key", () => {
			writeDraft(USER_ID, buildValidPayload());
			clearDraft(USER_ID);
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("is a no-op when the key does not exist", () => {
			expect(() => clearDraft(USER_ID)).not.toThrow();
		});
	});

	describe("SSR safety (window === undefined)", () => {
		const originalWindow = globalThis.window;

		beforeEach(() => {
			Object.defineProperty(globalThis, "window", {
				value: undefined,
				writable: true,
				configurable: true,
			});
		});

		afterEach(() => {
			Object.defineProperty(globalThis, "window", {
				value: originalWindow,
				writable: true,
				configurable: true,
			});
		});

		it("readDraft returns null without throwing", () => {
			expect(readDraft(USER_ID)).toBeNull();
		});

		it("writeDraft is a no-op without throwing", () => {
			expect(() => writeDraft(USER_ID, buildValidPayload())).not.toThrow();
		});

		it("clearDraft is a no-op without throwing", () => {
			expect(() => clearDraft(USER_ID)).not.toThrow();
		});
	});
});
