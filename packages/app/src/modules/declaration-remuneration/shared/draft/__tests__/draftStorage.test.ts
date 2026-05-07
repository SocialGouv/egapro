import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftPayload } from "../draftSchema";
import { clearDraft, readDraft, writeDraft } from "../draftStorage";

const USER_ID = "user-1";
const SIREN = "123456789";
const YEAR = 2026;
const STORAGE_KEY = `egapro:declaration-draft:${USER_ID}:${SIREN}:${YEAR}`;

const FIXED_NOW = new Date("2026-03-15T12:00:00Z").getTime();

function buildValidPayload(
	overrides: Partial<DraftPayload> = {},
): DraftPayload {
	return {
		siren: SIREN,
		year: YEAR,
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
			expect(readDraft(USER_ID, SIREN, YEAR)).toBeNull();
		});

		it("purges and returns null on corrupt JSON", () => {
			window.localStorage.setItem(STORAGE_KEY, "{not-json");
			expect(readDraft(USER_ID, SIREN, YEAR)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("purges and returns null on Zod-invalid payload", () => {
			window.localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ siren: "abc", year: 2026 }),
			);
			expect(readDraft(USER_ID, SIREN, YEAR)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("purges and returns null when timestamp is older than 30 days", () => {
			const expired = buildValidPayload({
				timestamp: FIXED_NOW - 31 * 24 * 3600 * 1000,
			});
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expired));
			expect(readDraft(USER_ID, SIREN, YEAR)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("purges and returns null when the campaign deadline has passed", () => {
			vi.setSystemTime(new Date("2026-07-01T00:00:00Z").getTime());
			const payload = buildValidPayload({
				timestamp: new Date("2026-06-30T00:00:00Z").getTime(),
				year: 2026,
			});
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
			expect(readDraft(USER_ID, SIREN, YEAR)).toBeNull();
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("returns the parsed payload when valid and within deadlines", () => {
			const payload = buildValidPayload();
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
			expect(readDraft(USER_ID, SIREN, YEAR)).toEqual(payload);
		});

		it("isolates drafts across different SIRENs for the same user", () => {
			const otherSiren = "987654321";
			const otherKey = `egapro:declaration-draft:${USER_ID}:${otherSiren}:${YEAR}`;
			const payloadA = buildValidPayload({ fields: { totalWomen: 1 } });
			const payloadB = buildValidPayload({
				siren: otherSiren,
				fields: { totalWomen: 2 },
			});
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payloadA));
			window.localStorage.setItem(otherKey, JSON.stringify(payloadB));
			expect(readDraft(USER_ID, SIREN, YEAR)).toEqual(payloadA);
			expect(readDraft(USER_ID, otherSiren, YEAR)).toEqual(payloadB);
		});

		it("isolates drafts across different years for the same user/siren", () => {
			const otherYear = 2025;
			const otherKey = `egapro:declaration-draft:${USER_ID}:${SIREN}:${otherYear}`;
			const payloadA = buildValidPayload();
			const payloadB = buildValidPayload({
				year: otherYear,
				timestamp: new Date("2025-04-01T00:00:00Z").getTime(),
			});
			vi.setSystemTime(new Date("2025-04-15T00:00:00Z").getTime());
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payloadA));
			window.localStorage.setItem(otherKey, JSON.stringify(payloadB));
			expect(readDraft(USER_ID, SIREN, otherYear)).toEqual(payloadB);
		});
	});

	describe("writeDraft", () => {
		it("persists the payload as JSON under the user/siren/year-scoped key", () => {
			const payload = buildValidPayload();
			writeDraft(USER_ID, SIREN, YEAR, payload);
			expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
				JSON.stringify(payload),
			);
		});

		it("write then read round-trips identical content", () => {
			const payload = buildValidPayload();
			writeDraft(USER_ID, SIREN, YEAR, payload);
			expect(readDraft(USER_ID, SIREN, YEAR)).toEqual(payload);
		});
	});

	describe("clearDraft", () => {
		it("removes the user/siren/year-scoped key", () => {
			writeDraft(USER_ID, SIREN, YEAR, buildValidPayload());
			clearDraft(USER_ID, SIREN, YEAR);
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("does not affect drafts of other SIRENs for the same user", () => {
			const otherSiren = "987654321";
			const otherKey = `egapro:declaration-draft:${USER_ID}:${otherSiren}:${YEAR}`;
			writeDraft(USER_ID, SIREN, YEAR, buildValidPayload());
			writeDraft(
				USER_ID,
				otherSiren,
				YEAR,
				buildValidPayload({ siren: otherSiren }),
			);
			clearDraft(USER_ID, SIREN, YEAR);
			expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
			expect(window.localStorage.getItem(otherKey)).not.toBeNull();
		});

		it("is a no-op when the key does not exist", () => {
			expect(() => clearDraft(USER_ID, SIREN, YEAR)).not.toThrow();
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
			expect(readDraft(USER_ID, SIREN, YEAR)).toBeNull();
		});

		it("writeDraft is a no-op without throwing", () => {
			expect(() =>
				writeDraft(USER_ID, SIREN, YEAR, buildValidPayload()),
			).not.toThrow();
		});

		it("clearDraft is a no-op without throwing", () => {
			expect(() => clearDraft(USER_ID, SIREN, YEAR)).not.toThrow();
		});
	});
});
