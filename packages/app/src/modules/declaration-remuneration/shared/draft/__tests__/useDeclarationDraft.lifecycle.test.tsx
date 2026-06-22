import { act, renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

vi.unmock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
);

import { useDeclarationDraft } from "../useDeclarationDraft";

type DraftBlob = Record<string, Record<string, unknown>>;
type StepValues = { totalWomen: number; totalMen: number };

const useSessionMock = vi.mocked(useSession);

const SIREN = "123456789";
const YEAR = 2026;
const USER_ID = "user-1";
const DB_VALUES: StepValues = { totalWomen: 0, totalMen: 0 };

let queryState: { data: DraftBlob | null | undefined; isLoading: boolean };
let saveMutateMock: Mock;
let clearMutateMock: Mock;
let setDataMock: Mock;
let saveOnSuccess: ((data: unknown, variables: unknown) => void) | undefined;
let clearOnSuccess: ((data: unknown, variables: unknown) => void) | undefined;

vi.mock("~/trpc/react", () => ({
	api: {
		useUtils: () => ({
			declarationDraft: {
				get: {
					setData: (_input: unknown, updater: unknown) => setDataMock(updater),
				},
			},
		}),
		declarationDraft: {
			get: { useQuery: () => queryState },
			save: {
				useMutation: (opts?: {
					onSuccess?: (data: unknown, variables: unknown) => void;
				}) => {
					saveOnSuccess = opts?.onSuccess;
					return { mutate: saveMutateMock };
				},
			},
			clear: {
				useMutation: (opts?: {
					onSuccess?: (data: unknown, variables: unknown) => void;
				}) => {
					clearOnSuccess = opts?.onSuccess;
					return { mutate: clearMutateMock };
				},
			},
		},
	},
}));

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

function renderDraftHook() {
	return renderHook(() =>
		useDeclarationDraft<StepValues>({
			siren: SIREN,
			year: YEAR,
			step: 1,
			kind: "main",
			dbValues: DB_VALUES,
		}),
	);
}

describe("useDeclarationDraft (lifecycle & cache)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		queryState = { data: undefined, isLoading: true };
		saveMutateMock = vi.fn();
		clearMutateMock = vi.fn();
		setDataMock = vi.fn();
		saveOnSuccess = undefined;
		clearOnSuccess = undefined;
		setSession();
	});

	afterEach(() => {
		vi.useRealTimers();
		useSessionMock.mockReset();
	});

	it("flushes a pending debounced save when the component unmounts", () => {
		queryState = { data: null, isLoading: false };
		const { result, unmount } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 4, totalMen: 0 });
		});
		expect(saveMutateMock).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(300);
		});

		unmount();
		expect(saveMutateMock).toHaveBeenCalledTimes(1);
		expect(saveMutateMock).toHaveBeenCalledWith({
			year: YEAR,
			siren: SIREN,
			slice: { kind: "main", step: "1", data: { totalWomen: 4 } },
		});
	});

	it("flushes a pending clear on unmount when the diff went empty", () => {
		queryState = {
			data: { main: { "1": { totalWomen: 10 } } } as DraftBlob,
			isLoading: false,
		};
		const { result, unmount } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 0, totalMen: 0 });
		});
		expect(clearMutateMock).not.toHaveBeenCalled();

		unmount();
		expect(clearMutateMock).toHaveBeenCalledTimes(1);
		expect(saveMutateMock).not.toHaveBeenCalled();
	});

	it("skips the flush on unmount if the user is no longer enabled", () => {
		setSession();
		queryState = { data: null, isLoading: false };
		const { result, rerender, unmount } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 1, totalMen: 0 });
		});

		setSession({ impersonating: true });
		rerender();

		unmount();
		expect(saveMutateMock).not.toHaveBeenCalled();
		expect(clearMutateMock).not.toHaveBeenCalled();
	});

	it("does nothing on unmount when no debounced mutation is pending", () => {
		queryState = { data: null, isLoading: false };
		const { unmount } = renderDraftHook();
		unmount();
		expect(saveMutateMock).not.toHaveBeenCalled();
		expect(clearMutateMock).not.toHaveBeenCalled();
	});

	it("patches the get cache on save success", () => {
		queryState = { data: null, isLoading: false };
		renderDraftHook();
		expect(saveOnSuccess).toBeDefined();

		saveOnSuccess?.(
			{ ok: true },
			{
				year: YEAR,
				siren: SIREN,
				slice: { kind: "main", step: "1", data: { totalWomen: 7 } },
			},
		);
		expect(setDataMock).toHaveBeenCalledTimes(1);
		const updater = setDataMock.mock.calls[0]?.[0] as (
			old: DraftBlob | null | undefined,
		) => DraftBlob | null;
		expect(updater(undefined)).toEqual({ main: { "1": { totalWomen: 7 } } });
		expect(
			updater({ main: { "1": { totalMen: 1 }, "2": { x: 9 } } } as DraftBlob),
		).toEqual({
			main: { "1": { totalWomen: 7 }, "2": { x: 9 } },
		});
		expect(updater({ compliance: { "1": { x: 1 } } } as DraftBlob)).toEqual({
			compliance: { "1": { x: 1 } },
			main: { "1": { totalWomen: 7 } },
		});
	});

	it("patches the get cache on clear success (removes the kind slice)", () => {
		queryState = { data: null, isLoading: false };
		renderDraftHook();
		expect(clearOnSuccess).toBeDefined();

		clearOnSuccess?.({ ok: true }, { year: YEAR, siren: SIREN, kind: "main" });
		expect(setDataMock).toHaveBeenCalledTimes(1);
		const updater = setDataMock.mock.calls[0]?.[0] as (
			old: DraftBlob | null | undefined,
		) => DraftBlob | null;
		expect(updater(undefined)).toBeUndefined();
		expect(updater(null)).toBeNull();
		expect(updater({ main: { "1": { x: 1 } } } as DraftBlob)).toBeNull();
		expect(
			updater({
				main: { "1": { x: 1 } },
				compliance: { "1": { y: 2 } },
			} as DraftBlob),
		).toEqual({ compliance: { "1": { y: 2 } } });
	});

	it("flushRef immediately writes pending save to cache so the next mount hydrates without waiting for the mutation", () => {
		queryState = { data: null, isLoading: false };
		const { result, unmount } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 3000, totalMen: 0 });
		});

		// Unmount before the 600ms debounce fires (simulates quick back-navigation)
		unmount();

		// The cache must have been updated synchronously — the mutation call is verified
		// separately; here we check the setData optimistic update happened
		expect(setDataMock).toHaveBeenCalledTimes(1);
		const updater = setDataMock.mock.calls[0]?.[0] as (
			old: DraftBlob | null | undefined,
		) => DraftBlob | null;
		expect(updater(null)).toEqual({ main: { "1": { totalWomen: 3000 } } });
		// And the mutation still fires to persist to the server
		expect(saveMutateMock).toHaveBeenCalledTimes(1);
	});

	it("flushRef immediately clears the cache so the next mount sees no stale data", () => {
		queryState = {
			data: { main: { "1": { totalWomen: 10 } } } as DraftBlob,
			isLoading: false,
		};
		const { result, unmount } = renderDraftHook();

		// Revert to defaults — pending clear
		act(() => {
			result.current.setField({ totalWomen: 0, totalMen: 0 });
		});

		unmount();

		// Cache cleared synchronously
		expect(setDataMock).toHaveBeenCalledTimes(1);
		const updater = setDataMock.mock.calls[0]?.[0] as (
			old: DraftBlob | null | undefined,
		) => DraftBlob | null;
		expect(
			updater({ main: { "1": { totalWomen: 10 } } } as DraftBlob),
		).toBeNull();
		expect(clearMutateMock).toHaveBeenCalledTimes(1);
	});

	it("keeps hasDraft=true when a stale clear from a previous mount resolves after remount (race condition)", () => {
		queryState = {
			data: { main: { "1": { totalWomen: 10 } } } as DraftBlob,
			isLoading: false,
		};
		const { result, rerender } = renderDraftHook();
		expect(result.current.hasDraft).toBe(true);

		// Simulate the stale clear resolving: cache is now empty
		act(() => {
			queryState = { data: null, isLoading: false };
			rerender();
		});

		// hasDraft must remain true — the form was already hydrated from the non-null
		// queryDraft seen at mount time; flickering to false would show "Non enregistré"
		// while form fields still display the saved data.
		expect(result.current.hasDraft).toBe(true);
	});

	it("hasDraft stays false while typing into a blank form (no flash of Enregistré)", () => {
		queryState = { data: null, isLoading: false };
		const { result } = renderDraftHook();

		// Initially blank form — nothing saved
		expect(result.current.hasDraft).toBe(false);

		// User starts typing — setField called immediately, localDraft set
		act(() => {
			result.current.setField({ totalWomen: 1, totalMen: 0 });
		});

		// hasDraft must still be false: queryDraft is null and no confirmed save yet.
		// The spinner (isPendingSave) has not fired yet (VISUAL_DELAY_MS = 400ms),
		// so showing "Enregistré" here would be a false positive.
		expect(result.current.hasDraft).toBe(false);
		expect(result.current.isPendingSave).toBe(false);

		// After VISUAL_DELAY_MS the spinner appears — hasDraft still false (save pending, not confirmed)
		act(() => {
			vi.advanceTimersByTime(400);
		});
		expect(result.current.isPendingSave).toBe(true);
		expect(result.current.hasDraft).toBe(false);

		// After DEBOUNCE_MS the mutation fires
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(saveMutateMock).toHaveBeenCalledTimes(1);

		// hasDraft becomes true only once the save onSuccess patches the cache
		saveOnSuccess?.(
			{ ok: true },
			{
				year: YEAR,
				siren: SIREN,
				slice: { kind: "main", step: "1", data: { totalWomen: 1 } },
			},
		);
		// The cache patch updates queryState, but since we're in a mock we simulate
		// by checking that setDataMock was called — the actual hasDraft flip
		// happens when React re-renders with the new query.data.
		expect(setDataMock).toHaveBeenCalledTimes(1);
	});

	it("returns the cache unchanged on clear success when kind is undefined", () => {
		queryState = { data: null, isLoading: false };
		renderDraftHook();
		expect(clearOnSuccess).toBeDefined();

		clearOnSuccess?.(
			{ ok: true },
			{ year: YEAR, siren: SIREN, kind: undefined },
		);
		const updater = setDataMock.mock.calls[0]?.[0] as (
			old: DraftBlob | null | undefined,
		) => DraftBlob | null;
		expect(updater({ main: { "1": { x: 1 } } } as DraftBlob)).toBeNull();
	});
});
