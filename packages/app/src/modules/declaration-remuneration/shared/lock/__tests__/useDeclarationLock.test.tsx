import { act, cleanup, renderHook } from "@testing-library/react";
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

import { LOCK_HEARTBEAT_INTERVAL_MS } from "~/modules/domain";

const acquireMutateAsync = vi.fn();
const heartbeatMutateAsync = vi.fn();
const releaseMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declarationLock: {
			acquireLock: { useMutation: () => ({ mutateAsync: acquireMutateAsync }) },
			heartbeat: { useMutation: () => ({ mutateAsync: heartbeatMutateAsync }) },
			releaseLock: { useMutation: () => ({ mutate: releaseMutate }) },
		},
	},
}));

import { useDeclarationLock } from "../useDeclarationLock";

const useSessionMock = useSession as unknown as Mock;

const DECLARATION_ID = "decl-1";
const HOLDER = {
	userId: "user-2",
	email: "owner@example.fr",
	firstName: "Alice",
	lastName: "Martin",
	expiresAt: new Date("2026-06-23T12:00:00Z"),
};

function setSession(
	options: { authenticated?: boolean; impersonating?: boolean } = {},
) {
	const { authenticated = true, impersonating = false } = options;
	if (!authenticated) {
		useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
		return;
	}
	useSessionMock.mockReturnValue({
		data: {
			user: {
				id: "user-1",
				impersonation: impersonating ? { siren: "999999999" } : null,
			},
		},
		status: "authenticated",
	});
}

function sendBeaconSpy() {
	const beacon = vi.fn().mockReturnValue(true);
	Object.defineProperty(navigator, "sendBeacon", {
		configurable: true,
		value: beacon,
	});
	return beacon;
}

function setVisibility(state: DocumentVisibilityState) {
	Object.defineProperty(document, "visibilityState", {
		configurable: true,
		get: () => state,
	});
}

// Flush the mount IIFE's awaited acquisition + the state updates that follow,
// without waitFor (incompatible with fake timers used to drive the heartbeat).
async function flush() {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
}

async function advance(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

function renderLockHook() {
	return renderHook(() =>
		useDeclarationLock({ declarationId: DECLARATION_ID }),
	);
}

describe("useDeclarationLock", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		acquireMutateAsync.mockReset();
		heartbeatMutateAsync.mockReset();
		heartbeatMutateAsync.mockResolvedValue({ held: true });
		releaseMutate.mockReset();
		setSession();
		setVisibility("visible");
	});

	afterEach(() => {
		// Unmount the hook first so its pagehide/visibilitychange listeners are
		// detached before the next test dispatches events on the shared window.
		cleanup();
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		useSessionMock.mockReset();
	});

	it("acquires the lock on mount and stays editable when held (S1)", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		const { result } = renderLockHook();
		await flush();

		expect(acquireMutateAsync).toHaveBeenCalledWith({
			declarationId: DECLARATION_ID,
		});
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isReadOnly).toBe(false);
		expect(result.current.holder).toEqual(HOLDER);
	});

	it("becomes read-only and exposes the holder when the lock is taken (no heartbeat)", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });
		const { result } = renderLockHook();
		await flush();

		expect(result.current.isReadOnly).toBe(true);
		expect(result.current.holder).toEqual(HOLDER);

		await advance(LOCK_HEARTBEAT_INTERVAL_MS * 3);
		expect(heartbeatMutateAsync).not.toHaveBeenCalled();
	});

	it("sends periodic heartbeats while it holds the lock (S7)", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		heartbeatMutateAsync.mockResolvedValue({ held: true });
		const { result } = renderLockHook();
		await flush();
		expect(result.current.isLoading).toBe(false);

		await advance(LOCK_HEARTBEAT_INTERVAL_MS);
		expect(heartbeatMutateAsync).toHaveBeenCalledTimes(1);
		expect(heartbeatMutateAsync).toHaveBeenCalledWith({
			declarationId: DECLARATION_ID,
		});

		await advance(LOCK_HEARTBEAT_INTERVAL_MS);
		expect(heartbeatMutateAsync).toHaveBeenCalledTimes(2);
	});

	it("re-reads ownership and stops the heartbeat when the lock is lost", async () => {
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: true,
			holder: HOLDER,
		});
		heartbeatMutateAsync.mockResolvedValue({ held: false });
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: false,
			holder: HOLDER,
		});
		const { result } = renderLockHook();
		await flush();

		await advance(LOCK_HEARTBEAT_INTERVAL_MS);
		expect(result.current.isReadOnly).toBe(true);
		expect(acquireMutateAsync).toHaveBeenCalledTimes(2);

		const heartbeatsAfterLoss = heartbeatMutateAsync.mock.calls.length;
		await advance(LOCK_HEARTBEAT_INTERVAL_MS * 2);
		expect(heartbeatMutateAsync.mock.calls.length).toBe(heartbeatsAfterLoss);
	});

	it("does not release the lock on unmount, even as the holder (step navigation must not churn the lock)", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		const { unmount } = renderLockHook();
		await flush();

		// Releasing on unmount would race the next step's acquire and delete the
		// freshly-taken lock. Release is owned by the beacon / logout / timeout.
		unmount();
		expect(releaseMutate).not.toHaveBeenCalled();
	});

	it("does not release on unmount when it is not the holder", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });
		const { result, unmount } = renderLockHook();
		await flush();
		expect(result.current.isReadOnly).toBe(true);

		unmount();
		expect(releaseMutate).not.toHaveBeenCalled();
	});

	it("emits a release beacon on pagehide when it is the holder (S5)", async () => {
		const beacon = sendBeaconSpy();
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		renderLockHook();
		await flush();

		act(() => {
			window.dispatchEvent(new Event("pagehide"));
		});

		expect(beacon).toHaveBeenCalledTimes(1);
		const [url, blob] = beacon.mock.calls[0] as [string, Blob];
		expect(url).toBe("/api/declaration-lock/release");
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe("application/json");
		expect(await blob.text()).toBe(
			JSON.stringify({ declarationId: DECLARATION_ID }),
		);
	});

	it("emits a release beacon when the tab is hidden (S5 visibilitychange)", async () => {
		const beacon = sendBeaconSpy();
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		renderLockHook();
		await flush();

		act(() => {
			setVisibility("hidden");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		expect(beacon).toHaveBeenCalledTimes(1);
	});

	it("does not emit a beacon on a visibilitychange that is not hidden", async () => {
		const beacon = sendBeaconSpy();
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		renderLockHook();
		await flush();

		act(() => {
			setVisibility("visible");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		expect(beacon).not.toHaveBeenCalled();
	});

	it("does not emit a beacon on pagehide when it is not the holder", async () => {
		const beacon = sendBeaconSpy();
		acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });
		const { result } = renderLockHook();
		await flush();
		expect(result.current.isReadOnly).toBe(true);

		act(() => {
			window.dispatchEvent(new Event("pagehide"));
		});
		expect(beacon).not.toHaveBeenCalled();
	});

	it("falls back to read-only without a holder when acquisition throws", async () => {
		acquireMutateAsync.mockRejectedValue(new Error("network"));
		const { result } = renderLockHook();
		await flush();

		expect(result.current.isReadOnly).toBe(true);
		expect(result.current.holder).toBeNull();
	});

	it("is disabled while unauthenticated: never acquires, stays editable, not loading", () => {
		setSession({ authenticated: false });
		const { result } = renderLockHook();

		expect(acquireMutateAsync).not.toHaveBeenCalled();
		expect(result.current.isReadOnly).toBe(false);
		expect(result.current.holder).toBeNull();
		expect(result.current.isLoading).toBe(false);
	});

	it("stays loading while the session is still resolving", () => {
		useSessionMock.mockReturnValue({ data: null, status: "loading" });
		const { result } = renderLockHook();

		expect(acquireMutateAsync).not.toHaveBeenCalled();
		expect(result.current.isLoading).toBe(true);
	});

	it("is read-only while impersonating with reason 'impersonation', without acquiring the lock", () => {
		setSession({ impersonating: true });
		const { result } = renderLockHook();

		expect(acquireMutateAsync).not.toHaveBeenCalled();
		expect(result.current.isReadOnly).toBe(true);
		expect(result.current.reason).toBe("impersonation");
		expect(result.current.holder).toBeNull();
	});

	it("reports reason 'lock' when the declaration is held by another user", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });
		const { result } = renderLockHook();
		await flush();

		expect(result.current.isReadOnly).toBe(true);
		expect(result.current.reason).toBe("lock");
	});

	it("reports a null reason for a normal editor that holds the lock", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		const { result } = renderLockHook();
		await flush();

		expect(result.current.isReadOnly).toBe(false);
		expect(result.current.reason).toBeNull();
	});

	it("swallows heartbeat rejections without re-reading ownership", async () => {
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		heartbeatMutateAsync.mockRejectedValue(new Error("boom"));
		const { result } = renderLockHook();
		await flush();

		await advance(LOCK_HEARTBEAT_INTERVAL_MS);

		expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
		expect(result.current.isReadOnly).toBe(false);
	});

	it("ignores a successful acquisition that resolves after unmount", async () => {
		let resolveAcquire!: (value: {
			acquired: boolean;
			holder: typeof HOLDER;
		}) => void;
		acquireMutateAsync.mockReturnValue(
			new Promise((resolve) => {
				resolveAcquire = resolve;
			}),
		);
		const { result, unmount } = renderLockHook();
		expect(result.current.isLoading).toBe(true);

		unmount();
		await act(async () => {
			resolveAcquire({ acquired: true, holder: HOLDER });
			await vi.advanceTimersByTimeAsync(0);
		});

		// Cleanup ran before the acquire settled: no heartbeat scheduled, no
		// release fired (the tab never became the holder).
		await advance(LOCK_HEARTBEAT_INTERVAL_MS);
		expect(heartbeatMutateAsync).not.toHaveBeenCalled();
		expect(releaseMutate).not.toHaveBeenCalled();
	});

	it("ignores a failed acquisition that rejects after unmount", async () => {
		let rejectAcquire!: (reason: Error) => void;
		acquireMutateAsync.mockReturnValue(
			new Promise((_resolve, reject) => {
				rejectAcquire = reject;
			}),
		);
		const { unmount } = renderLockHook();

		unmount();
		await act(async () => {
			rejectAcquire(new Error("network"));
			await vi.advanceTimersByTimeAsync(0);
		});

		await advance(LOCK_HEARTBEAT_INTERVAL_MS);
		expect(heartbeatMutateAsync).not.toHaveBeenCalled();
		expect(releaseMutate).not.toHaveBeenCalled();
	});
});
