import { act, renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftPayload } from "../draftSchema";
import { useDeclarationDraft } from "../useDeclarationDraft";

const useSessionMock = vi.mocked(useSession);

const SIREN = "123456789";
const YEAR = 2026;
const USER_ID = "user-1";
const STORAGE_KEY = `egapro:declaration-draft:${USER_ID}`;

const FIXED_NOW = new Date("2026-03-15T12:00:00Z").getTime();

function buildPayload(overrides: Partial<DraftPayload> = {}): DraftPayload {
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

type StepValues = { totalWomen: number; totalMen: number };

const DB_VALUES: StepValues = { totalWomen: 0, totalMen: 0 };

function setSession(
	options: { userId?: string | null; impersonating?: boolean } = {},
) {
	const { userId = USER_ID, impersonating = false } = options;
	useSessionMock.mockReturnValue({
		data:
			userId === null
				? null
				: ({
						user: {
							id: userId,
							impersonation: impersonating
								? { siren: "999999999", name: "X" }
								: null,
						},
						expires: "",
					} as never),
		status: userId === null ? "unauthenticated" : "authenticated",
		update: vi.fn(),
	} as never);
}

describe("useDeclarationDraft", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.useFakeTimers();
		vi.setSystemTime(new Date(FIXED_NOW));
	});

	afterEach(() => {
		vi.useRealTimers();
		useSessionMock.mockReset();
	});

	it("is a no-op when userId is null (logged out)", () => {
		setSession({ userId: null });
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPayload()));
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);

		act(() => {
			result.current.setField({ totalWomen: 99, totalMen: 0 });
		});
		expect(window.localStorage.length).toBe(1);

		act(() => {
			result.current.clearDraft();
		});
		expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
	});

	it("is a no-op when impersonating", () => {
		setSession({ impersonating: true });
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPayload()));
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);

		act(() => {
			result.current.setField({ totalWomen: 99, totalMen: 0 });
			result.current.clearDraft();
		});
		expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
	});

	it("hydrates draft when payload matches (siren, year, step)", () => {
		setSession();
		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(buildPayload({ fields: { totalWomen: 10, totalMen: 5 } })),
		);
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.draft).toEqual({ totalWomen: 10, totalMen: 5 });
		expect(result.current.hasDraft).toBe(true);
	});

	it("does not hydrate when payload (siren, year, step) does not match — and does not purge", () => {
		setSession();
		const payload = buildPayload({ siren: "987654321" });
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
		expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
	});

	it("does not hydrate when payload year does not match", () => {
		setSession();
		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(buildPayload({ year: 2025 })),
		);
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
	});

	it("does not hydrate when payload step does not match", () => {
		setSession();
		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(buildPayload({ step: 2 })),
		);
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
	});

	it("clears the draft when setField makes values match dbValues", () => {
		setSession();
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);

		act(() => {
			result.current.setField({ totalWomen: 5, totalMen: 0 });
		});
		expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
		expect(result.current.hasDraft).toBe(true);

		act(() => {
			result.current.setField({ totalWomen: 0, totalMen: 0 });
		});
		expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		expect(result.current.hasDraft).toBe(false);
	});

	it("writes the diff (only differing keys) when setField is called", () => {
		setSession();
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		act(() => {
			result.current.setField({ totalWomen: 5, totalMen: 0 });
		});
		const stored = JSON.parse(
			window.localStorage.getItem(STORAGE_KEY) ?? "{}",
		) as DraftPayload;
		expect(stored.fields).toEqual({ totalWomen: 5 });
		expect(stored.siren).toBe(SIREN);
		expect(stored.year).toBe(YEAR);
		expect(stored.step).toBe(1);
		expect(stored.kind).toBe("main");
		expect(stored.timestamp).toBe(FIXED_NOW);
	});

	it("clearDraft removes the key and resets hasDraft", () => {
		setSession();
		window.localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(buildPayload({ fields: { totalWomen: 10 } })),
		);
		const { result } = renderHook(() =>
			useDeclarationDraft<StepValues>({
				siren: SIREN,
				year: YEAR,
				step: 1,
				kind: "main",
				dbValues: DB_VALUES,
			}),
		);
		expect(result.current.hasDraft).toBe(true);
		act(() => {
			result.current.clearDraft();
		});
		expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
		expect(result.current.hasDraft).toBe(false);
	});
});
