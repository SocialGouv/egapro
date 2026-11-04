import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	DECLARATION_LOCK_CONFLICT_MESSAGE,
	LOCK_HEARTBEAT_INTERVAL_MS,
} from "~/modules/domain";

vi.mock(
	"next/navigation",
	async () => (await import("./useDeclarationLockHarness")).navigationMock,
);
vi.mock(
	"~/trpc/react",
	async () => (await import("./useDeclarationLockHarness")).trpcMock,
);

import { useDeclarationLock } from "../useDeclarationLock";
import {
	acquireMutateAsync,
	advance,
	availabilityQuery,
	DECLARATION_ID,
	failMutation,
	fetchLockState,
	firePageShow,
	flush,
	HOLDER,
	heartbeatMutateAsync,
	lastAvailabilityOptions,
	NEW_HOLDER,
	OWN_HOLDER,
	recheckAvailability,
	renderLockHook as renderHookWith,
	resetAvailability,
	resetLockHookMocks,
	routerRefresh,
	sendBeaconSpy,
	setAvailability,
	setSession,
	setVisibility,
	teardownLockHook,
} from "./useDeclarationLockHarness";

const renderLockHook = (options: { modificationClosed?: boolean } = {}) =>
	renderHookWith(useDeclarationLock, options);

describe("useDeclarationLock — waiting for the lock to be released", () => {
	beforeEach(resetLockHookMocks);

	afterEach(teardownLockHook);

	async function renderLockedOut() {
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: false,
			holder: HOLDER,
		});
		const rendered = renderLockHook();
		await flush();
		return rendered;
	}

	it("polls availability every heartbeat, only while the tab is visible, when locked out", async () => {
		await renderLockedOut();

		expect(availabilityQuery).toHaveBeenLastCalledWith(
			{ declarationId: DECLARATION_ID },
			expect.objectContaining({
				enabled: true,
				refetchInterval: LOCK_HEARTBEAT_INTERVAL_MS,
				refetchIntervalInBackground: false,
			}),
		);
	});

	it("does not poll availability while it holds the lock", async () => {
		acquireMutateAsync.mockResolvedValue({
			acquired: true,
			holder: OWN_HOLDER,
		});
		renderLockHook();
		await flush();

		expect(lastAvailabilityOptions().enabled).toBe(false);
		expect(lastAvailabilityOptions().refetchInterval).toBe(false);
	});

	it("re-reads availability without taking the lock when the tab becomes visible again", async () => {
		await renderLockedOut();

		act(() => {
			setVisibility("visible");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		await flush();

		expect(recheckAvailability).toHaveBeenCalledTimes(1);
		expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
	});

	it("re-reads availability without taking the lock on a bfcache restore", async () => {
		await renderLockedOut();

		firePageShow(true);
		await flush();

		expect(recheckAvailability).toHaveBeenCalledTimes(1);
		expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
	});

	it("re-reads availability without taking the lock when a write hits a lock conflict", async () => {
		const { queryClient } = await renderLockedOut();

		await failMutation(queryClient, DECLARATION_LOCK_CONFLICT_MESSAGE);

		expect(recheckAvailability).toHaveBeenCalledTimes(1);
		expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
	});

	it("never takes the lock on its own once the declaration is released", async () => {
		const { result, rerender } = await renderLockedOut();

		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		await advance(LOCK_HEARTBEAT_INTERVAL_MS * 3);

		expect(result.current.retake.isAvailable).toBe(true);
		expect(result.current.isReadOnly).toBe(true);
		expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
	});

	it("shows the timeout carried by the current lock row", async () => {
		const { result, rerender } = await renderLockedOut();

		setAvailability(rerender, { available: false, lockTimeoutMinutes: 10 });

		expect(result.current.holder?.lockTimeoutMinutes).toBe(10);
		expect(result.current.holder?.email).toBe(HOLDER.email);
	});

	it("keeps the holder's own timeout until availability reports one", async () => {
		const { result } = await renderLockedOut();

		expect(result.current.holder?.lockTimeoutMinutes).toBe(30);
	});

	it("re-reads the holder identity once when someone takes the released lock", async () => {
		const { result, rerender } = await renderLockedOut();
		fetchLockState.mockResolvedValue({
			locked: true,
			isOwnLock: false,
			holder: NEW_HOLDER,
		});

		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		await flush();
		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		await flush();

		expect(fetchLockState).toHaveBeenCalledTimes(1);
		expect(fetchLockState).toHaveBeenCalledWith(
			{ declarationId: DECLARATION_ID },
			{ staleTime: 0 },
		);
		expect(result.current.holder?.email).toBe(NEW_HOLDER.email);
	});

	it("does not re-read the holder when the lock simply stays taken", async () => {
		const { rerender } = await renderLockedOut();

		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		await flush();

		expect(fetchLockState).not.toHaveBeenCalled();
	});

	it("resolves a missing holder when the first lock read failed", async () => {
		acquireMutateAsync.mockRejectedValueOnce(new Error("network"));
		const { result, rerender } = renderLockHook();
		await flush();
		fetchLockState.mockResolvedValue({
			locked: true,
			isOwnLock: false,
			holder: HOLDER,
		});

		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		await flush();

		expect(result.current.holder?.email).toBe(HOLDER.email);
	});

	it("ignores a holder re-read that fails or reports the caller's own lock", async () => {
		const { result, rerender } = await renderLockedOut();
		fetchLockState.mockRejectedValueOnce(new Error("network"));

		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		await flush();
		expect(result.current.holder?.email).toBe(HOLDER.email);

		fetchLockState.mockResolvedValueOnce({
			locked: true,
			isOwnLock: true,
			holder: OWN_HOLDER,
		});
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		await flush();
		expect(result.current.holder?.email).toBe(HOLDER.email);
	});

	it("reloads every cache and stays read-only until the refresh lands, then remounts the page editable", async () => {
		const { result, rerender, queryClient } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		let resolveInvalidation!: () => void;
		const invalidate = vi
			.spyOn(queryClient, "invalidateQueries")
			.mockReturnValue(
				new Promise<void>((resolve) => {
					resolveInvalidation = resolve;
				}),
			);
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: true,
			holder: OWN_HOLDER,
		});

		act(() => {
			result.current.retake.retake();
		});
		await flush();

		expect(result.current.retake.status).toBe("pending");
		expect(result.current.isReadOnly).toBe(true);
		expect(resetAvailability).toHaveBeenCalledTimes(1);
		expect(invalidate).toHaveBeenCalledWith();
		expect(routerRefresh).not.toHaveBeenCalled();
		expect(result.current.editSessionKey).toBe(0);

		await act(async () => {
			resolveInvalidation();
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(routerRefresh).toHaveBeenCalledTimes(1);
		expect(result.current.isReadOnly).toBe(false);
		expect(result.current.reason).toBeNull();
		expect(result.current.retake.status).toBe("succeeded");
		expect(result.current.editSessionKey).toBe(1);

		await advance(LOCK_HEARTBEAT_INTERVAL_MS);
		expect(heartbeatMutateAsync).toHaveBeenCalledTimes(1);
	});

	it("stays read-only when the retaken lock is lost again before the refresh lands", async () => {
		sendBeaconSpy();
		const { result, rerender, queryClient } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		let resolveInvalidation!: () => void;
		vi.spyOn(queryClient, "invalidateQueries").mockReturnValue(
			new Promise<void>((resolve) => {
				resolveInvalidation = resolve;
			}),
		);
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: true,
			holder: OWN_HOLDER,
		});
		act(() => {
			result.current.retake.retake();
		});
		await flush();

		acquireMutateAsync.mockResolvedValueOnce({
			acquired: false,
			holder: NEW_HOLDER,
		});
		act(() => {
			setVisibility("hidden");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		act(() => {
			setVisibility("visible");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		await flush();
		await act(async () => {
			resolveInvalidation();
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(result.current.isReadOnly).toBe(true);
		expect(result.current.retake.status).toBe("idle");
		expect(result.current.holder?.email).toBe(NEW_HOLDER.email);
	});

	it("stays read-only and names the new holder when another session was faster", async () => {
		const { result, rerender } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: false,
			holder: NEW_HOLDER,
		});

		act(() => {
			result.current.retake.retake();
		});
		await flush();

		expect(result.current.retake.status).toBe("outpaced");
		expect(result.current.isReadOnly).toBe(true);
		expect(result.current.holder?.email).toBe(NEW_HOLDER.email);
		expect(recheckAvailability).toHaveBeenCalledTimes(1);
		expect(routerRefresh).not.toHaveBeenCalled();
	});

	it("forgets an outpaced attempt once the declaration is released again", async () => {
		const { result, rerender } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: false,
			holder: NEW_HOLDER,
		});
		act(() => {
			result.current.retake.retake();
		});
		await flush();

		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		expect(result.current.retake.status).toBe("outpaced");
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });

		expect(result.current.retake.status).toBe("idle");
		expect(result.current.retake.isAvailable).toBe(true);
	});

	it("reports a failed retake, stays read-only and keeps watching", async () => {
		const { result, rerender } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		acquireMutateAsync.mockRejectedValueOnce(new Error("network"));

		act(() => {
			result.current.retake.retake();
		});
		await flush();

		expect(result.current.retake.status).toBe("failed");
		expect(result.current.isReadOnly).toBe(true);
		expect(lastAvailabilityOptions().enabled).toBe(true);

		setAvailability(rerender, { available: false, lockTimeoutMinutes: 30 });
		expect(result.current.retake.status).toBe("idle");
	});

	it("ignores a second click while a retake is in flight", async () => {
		const { result, rerender } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		acquireMutateAsync.mockReturnValueOnce(new Promise(() => {}));

		act(() => {
			result.current.retake.retake();
			result.current.retake.retake();
		});
		await flush();

		expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
		expect(lastAvailabilityOptions().enabled).toBe(false);
	});

	it("drops a retake that settles after unmount", async () => {
		const { result, rerender, unmount } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		let resolveAcquire!: (value: unknown) => void;
		acquireMutateAsync.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveAcquire = resolve;
			}),
		);
		act(() => {
			result.current.retake.retake();
		});

		unmount();
		await act(async () => {
			resolveAcquire({ acquired: true, holder: OWN_HOLDER });
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(routerRefresh).not.toHaveBeenCalled();
		expect(resetAvailability).not.toHaveBeenCalled();
	});

	async function startRetakeWithPendingInvalidation() {
		const rendered = await renderLockedOut();
		setAvailability(rendered.rerender, {
			available: true,
			lockTimeoutMinutes: null,
		});
		let resolveInvalidation!: () => void;
		vi.spyOn(rendered.queryClient, "invalidateQueries").mockReturnValue(
			new Promise<void>((resolve) => {
				resolveInvalidation = resolve;
			}),
		);
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: true,
			holder: OWN_HOLDER,
		});
		act(() => {
			rendered.result.current.retake.retake();
		});
		await flush();
		return { ...rendered, resolveInvalidation: () => resolveInvalidation() };
	}

	it("keeps the forms read-only when the lock is re-confirmed before the refreshed data lands", async () => {
		sendBeaconSpy();
		const { result } = await startRetakeWithPendingInvalidation();
		acquireMutateAsync.mockResolvedValueOnce({
			acquired: true,
			holder: OWN_HOLDER,
		});

		act(() => {
			setVisibility("hidden");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		act(() => {
			setVisibility("visible");
			document.dispatchEvent(new Event("visibilitychange"));
		});
		await flush();
		await advance(LOCK_HEARTBEAT_INTERVAL_MS);

		expect(heartbeatMutateAsync).toHaveBeenCalled();
		expect(result.current.isReadOnly).toBe(true);
	});

	it("drops a retake whose cache reload settles after unmount", async () => {
		const { unmount, resolveInvalidation } =
			await startRetakeWithPendingInvalidation();

		unmount();
		await act(async () => {
			resolveInvalidation();
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(routerRefresh).not.toHaveBeenCalled();
	});

	it("drops a retake failure that settles after unmount", async () => {
		const { result, rerender, unmount } = await renderLockedOut();
		setAvailability(rerender, { available: true, lockTimeoutMinutes: null });
		let rejectAcquire!: (reason: Error) => void;
		acquireMutateAsync.mockReturnValueOnce(
			new Promise((_resolve, reject) => {
				rejectAcquire = reject;
			}),
		);
		act(() => {
			result.current.retake.retake();
		});

		unmount();
		await act(async () => {
			rejectAcquire(new Error("network"));
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(result.current.retake.status).toBe("pending");
	});

	it("does nothing when retake is called while the lock is disabled", () => {
		setSession({ impersonating: true });
		const { result } = renderLockHook();

		act(() => {
			result.current.retake.retake();
		});

		expect(acquireMutateAsync).not.toHaveBeenCalled();
		expect(result.current.retake.status).toBe("idle");
	});
});
