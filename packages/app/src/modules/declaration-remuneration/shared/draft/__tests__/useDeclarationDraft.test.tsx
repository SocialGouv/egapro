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
type DraftKindLiteral = "main" | "second" | "joint" | "compliance" | "cse";
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
			save: { useMutation: () => ({ mutate: saveMutateMock }) },
			clear: { useMutation: () => ({ mutate: clearMutateMock }) },
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

function renderDraftHook(
	overrides: Partial<{
		kind: DraftKindLiteral;
		step: number | "second-1";
		dbValues: StepValues;
	}> = {},
) {
	return renderHook(() =>
		useDeclarationDraft<StepValues>({
			siren: SIREN,
			year: YEAR,
			step: overrides.step ?? 1,
			kind: overrides.kind ?? "main",
			dbValues: overrides.dbValues ?? DB_VALUES,
		}),
	);
}

describe("useDeclarationDraft", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		queryState = { data: undefined, isLoading: true };
		saveMutateMock = vi.fn();
		clearMutateMock = vi.fn();
		setDataMock = vi.fn();
		setSession();
	});

	afterEach(() => {
		vi.useRealTimers();
		useSessionMock.mockReset();
	});

	it("returns an empty draft and loading=true while the query is pending", () => {
		const { result } = renderDraftHook();
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
		expect(result.current.isLoadingDraft).toBe(true);
	});

	it("hydrates draft from the query slice when data resolves", () => {
		queryState = {
			data: { main: { "1": { totalWomen: 10, totalMen: 5 } } } as DraftBlob,
			isLoading: false,
		};
		const { result } = renderDraftHook();
		expect(result.current.draft).toEqual({ totalWomen: 10, totalMen: 5 });
		expect(result.current.hasDraft).toBe(true);
		expect(result.current.isLoadingDraft).toBe(false);
	});

	it("returns an empty draft when the query data has no slice for this kind", () => {
		queryState = {
			data: { compliance: { "1": { foo: 1 } } } as DraftBlob,
			isLoading: false,
		};
		const { result } = renderDraftHook();
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
	});

	it("returns an empty draft when the kind slice exists but the step is missing", () => {
		queryState = {
			data: { main: { "2": { totalWomen: 3 } } } as DraftBlob,
			isLoading: false,
		};
		const { result } = renderDraftHook({ step: 1 });
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
	});

	it("debounces save calls (multiple setField in <600ms → 1 mutation)", () => {
		queryState = { data: null, isLoading: false };
		const { result } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 1, totalMen: 0 });
			result.current.setField({ totalWomen: 2, totalMen: 0 });
			result.current.setField({ totalWomen: 3, totalMen: 0 });
		});
		expect(saveMutateMock).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(600);
		});

		expect(saveMutateMock).toHaveBeenCalledTimes(1);
		expect(saveMutateMock).toHaveBeenCalledWith({
			year: YEAR,
			siren: SIREN,
			slice: { kind: "main", step: "1", data: { totalWomen: 3 } },
		});
	});

	it("updates the local draft immediately on setField (optimistic)", () => {
		queryState = { data: null, isLoading: false };
		const { result } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 7, totalMen: 0 });
		});

		expect(result.current.draft).toEqual({ totalWomen: 7 });
		expect(result.current.hasDraft).toBe(true);
		expect(saveMutateMock).not.toHaveBeenCalled();
	});

	it("clearDraft triggers the clear mutation immediately (not debounced)", () => {
		queryState = {
			data: { main: { "1": { totalWomen: 10 } } } as DraftBlob,
			isLoading: false,
		};
		const { result } = renderDraftHook();
		expect(result.current.hasDraft).toBe(true);

		act(() => {
			result.current.clearDraft();
		});

		expect(clearMutateMock).toHaveBeenCalledTimes(1);
		expect(clearMutateMock).toHaveBeenCalledWith({
			year: YEAR,
			siren: SIREN,
			kind: "main",
		});
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);
	});

	it("clearDraft cancels any pending debounced save", () => {
		queryState = { data: null, isLoading: false };
		const { result } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 5, totalMen: 0 });
		});
		act(() => {
			result.current.clearDraft();
		});
		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(saveMutateMock).not.toHaveBeenCalled();
		expect(clearMutateMock).toHaveBeenCalledTimes(1);
	});

	it("setField with values equal to dbValues triggers a clear (no save)", () => {
		queryState = {
			data: { main: { "1": { totalWomen: 5 } } } as DraftBlob,
			isLoading: false,
		};
		const { result } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 0, totalMen: 0 });
		});
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);

		act(() => {
			vi.advanceTimersByTime(600);
		});
		expect(saveMutateMock).not.toHaveBeenCalled();
		expect(clearMutateMock).toHaveBeenCalledTimes(1);
		expect(clearMutateMock).toHaveBeenCalledWith({
			year: YEAR,
			siren: SIREN,
			kind: "main",
		});
	});

	it("hasDraft becomes true once the query resolves with a non-empty slice", () => {
		queryState = { data: undefined, isLoading: true };
		const { rerender, result } = renderDraftHook();
		expect(result.current.hasDraft).toBe(false);

		queryState = {
			data: { main: { "1": { totalWomen: 10 } } } as DraftBlob,
			isLoading: false,
		};
		rerender();
		expect(result.current.hasDraft).toBe(true);
		expect(result.current.draft).toEqual({ totalWomen: 10 });
	});

	it("disables the query and is a no-op when impersonating", () => {
		setSession({ impersonating: true });
		queryState = { data: undefined, isLoading: true };
		const { result } = renderDraftHook();

		expect(result.current.isLoadingDraft).toBe(false);
		expect(result.current.draft).toEqual({});
		expect(result.current.hasDraft).toBe(false);

		act(() => {
			result.current.setField({ totalWomen: 99, totalMen: 0 });
			result.current.clearDraft();
		});
		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(saveMutateMock).not.toHaveBeenCalled();
		expect(clearMutateMock).not.toHaveBeenCalled();
	});

	it("reports isLoadingDraft=true while the session is loading", () => {
		useSessionMock.mockReturnValue({
			data: null,
			status: "loading",
			update: vi.fn(),
		} as never);
		queryState = { data: undefined, isLoading: false };
		const { result } = renderDraftHook();
		expect(result.current.isLoadingDraft).toBe(true);
	});

	it("is a no-op when the user is logged out", () => {
		setSession({ userId: null });
		queryState = { data: undefined, isLoading: true };
		const { result } = renderDraftHook();

		expect(result.current.isLoadingDraft).toBe(false);
		expect(result.current.draft).toEqual({});

		act(() => {
			result.current.setField({ totalWomen: 1, totalMen: 0 });
			result.current.clearDraft();
		});
		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(saveMutateMock).not.toHaveBeenCalled();
		expect(clearMutateMock).not.toHaveBeenCalled();
	});

	it("keeps a stable draft reference when setField is called with the same values", () => {
		queryState = { data: null, isLoading: false };
		const { result } = renderDraftHook();

		act(() => {
			result.current.setField({ totalWomen: 5, totalMen: 0 });
		});
		const draftAfterFirst = result.current.draft;

		act(() => {
			result.current.setField({ totalWomen: 5, totalMen: 0 });
		});
		expect(result.current.draft).toBe(draftAfterFirst);
	});

	it("keeps a stable draft reference for nested values with identical contents", () => {
		queryState = { data: null, isLoading: false };
		const tupleDb = { rows: [{ a: 0, b: 0 }] };
		const { result } = renderHook(() =>
			useDeclarationDraft<typeof tupleDb>({
				siren: SIREN,
				year: YEAR,
				step: 4,
				kind: "main",
				dbValues: tupleDb,
			}),
		);

		act(() => {
			result.current.setField({ rows: [{ a: 1, b: 2 }] });
		});
		const draftAfterFirst = result.current.draft;

		act(() => {
			result.current.setField({ rows: [{ a: 1, b: 2 }] });
		});
		expect(result.current.draft).toBe(draftAfterFirst);
	});

	it("honors a custom step in the save payload", () => {
		queryState = { data: null, isLoading: false };
		const { result } = renderDraftHook({ step: "second-1" });

		act(() => {
			result.current.setField({ totalWomen: 1, totalMen: 0 });
		});
		act(() => {
			vi.advanceTimersByTime(600);
		});

		expect(saveMutateMock).toHaveBeenCalledWith({
			year: YEAR,
			siren: SIREN,
			slice: { kind: "main", step: "second-1", data: { totalWomen: 1 } },
		});
	});
});
