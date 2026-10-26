import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

import { REPRESENTATION_YEAR as YEAR } from "~/modules/declaration-representation/__tests__/fixtures";
import {
	LOCK_HEARTBEAT_INTERVAL_MS,
	REPRESENTATION_LOCK_CONFLICT_MESSAGE,
} from "~/modules/domain";

const acquireMutateAsync = vi.fn();
const heartbeatMutateAsync = vi.fn();
const routerRefresh = vi.fn();
const stableRouter = { refresh: routerRefresh };

vi.mock("next/navigation", () => ({
	useRouter: () => stableRouter,
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			acquireLock: { useMutation: () => ({ mutateAsync: acquireMutateAsync }) },
			heartbeat: { useMutation: () => ({ mutateAsync: heartbeatMutateAsync }) },
		},
	},
}));

import {
	type PendingSaveFlush,
	useRepresentationLock,
} from "../RepresentationLockContext";
import { RepresentationLockProvider } from "../RepresentationLockProvider";

const useSessionMock = useSession as unknown as Mock;

const RELEASE_ENDPOINT = "/api/representation-declaration-lock/release";
const HOLDER = {
	userId: "user-2",
	email: "camille.martin@example.fr",
	firstName: "Camille",
	lastName: "Martin",
	expiresAt: new Date("2026-06-23T12:00:00Z"),
};

function setSession(
	status: "authenticated" | "loading" | "unauthenticated" = "authenticated",
	options: { impersonating?: boolean } = {},
) {
	if (status !== "authenticated") {
		useSessionMock.mockReturnValue({ data: null, status });
		return;
	}
	useSessionMock.mockReturnValue({
		data: {
			user: {
				id: "user-1",
				impersonation: options.impersonating ? { siren: "123456789" } : null,
			},
		},
		status,
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
	act(() => {
		document.dispatchEvent(new Event("visibilitychange"));
	});
}

function firePageShow(persisted: boolean) {
	const event = new Event("pageshow");
	Object.defineProperty(event, "persisted", { value: persisted });
	act(() => {
		window.dispatchEvent(event);
	});
}

async function advance(ms = 0) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

function LockProbe() {
	const lock = useRepresentationLock();
	return (
		<dl>
			<dt>readOnly</dt>
			<dd data-testid="readOnly">{String(lock.isReadOnly)}</dd>
			<dt>loading</dt>
			<dd data-testid="loading">{String(lock.isLoading)}</dd>
			<dt>unavailable</dt>
			<dd data-testid="unavailable">{String(lock.isUnavailable)}</dd>
			<dt>holder</dt>
			<dd data-testid="holder">{lock.holder?.email ?? "none"}</dd>
		</dl>
	);
}

function PendingSaveProbe({ flush }: { flush: PendingSaveFlush }) {
	const { registerPendingSave } = useRepresentationLock();
	useEffect(() => registerPendingSave(flush), [flush, registerPendingSave]);
	return null;
}

function renderProvider(
	props: Partial<{
		enabled: boolean;
		campaignOpen: boolean;
		isSubmitted: boolean;
		pendingSave: PendingSaveFlush;
	}> = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	const rendered = render(
		<QueryClientProvider client={queryClient}>
			<RepresentationLockProvider
				campaignOpen={props.campaignOpen ?? true}
				enabled={props.enabled ?? true}
				isSubmitted={props.isSubmitted ?? false}
				year={YEAR}
			>
				<LockProbe />
				{props.pendingSave ? (
					<PendingSaveProbe flush={props.pendingSave} />
				) : null}
			</RepresentationLockProvider>
		</QueryClientProvider>,
	);
	return { ...rendered, queryClient };
}

async function failMutation(queryClient: QueryClient, message: string) {
	const mutation = queryClient.getMutationCache().build(queryClient, {
		mutationFn: async () => {
			throw new Error(message);
		},
	});
	await act(async () => {
		await mutation.execute(undefined).catch(() => undefined);
		await vi.advanceTimersByTimeAsync(0);
	});
}

function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((settle) => {
		resolve = settle;
	});
	return { promise, resolve };
}

async function settle(resolve: () => void) {
	await act(async () => {
		resolve();
		await vi.advanceTimersByTimeAsync(0);
	});
}

function probe(name: "readOnly" | "loading" | "unavailable" | "holder") {
	return screen.getByTestId(name).textContent;
}

describe("RepresentationLockProvider", () => {
	let beacon: Mock;

	beforeEach(() => {
		vi.useFakeTimers();
		acquireMutateAsync.mockReset();
		heartbeatMutateAsync.mockReset();
		routerRefresh.mockReset();
		beacon = sendBeaconSpy();
		setSession();
		Object.defineProperty(document, "visibilityState", {
			configurable: true,
			get: () => "visible",
		});
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	describe("without lock management", () => {
		it("exposes a read-only state and never acquires when disabled", async () => {
			renderProvider({ enabled: false });
			await advance();

			expect(probe("readOnly")).toBe("true");
			expect(probe("loading")).toBe("false");
			expect(acquireMutateAsync).not.toHaveBeenCalled();
		});

		it.each([
			["the campaign is closed", { campaignOpen: false }],
			["the declaration is submitted", { isSubmitted: true }],
		])("stays read-only without acquiring when %s", async (_, props) => {
			renderProvider(props);
			await advance();

			expect(probe("readOnly")).toBe("true");
			expect(probe("loading")).toBe("false");
			expect(acquireMutateAsync).not.toHaveBeenCalled();
		});

		it("never acquires while impersonating a company", async () => {
			setSession("authenticated", { impersonating: true });

			renderProvider();
			await advance();

			expect(probe("readOnly")).toBe("true");
			expect(acquireMutateAsync).not.toHaveBeenCalled();
		});

		it("reports loading while the session resolves", async () => {
			setSession("loading");

			renderProvider();
			await advance();

			expect(probe("loading")).toBe("true");
			expect(probe("readOnly")).toBe("true");
			expect(acquireMutateAsync).not.toHaveBeenCalled();
		});
	});

	describe("acquisition", () => {
		it("unlocks editing once the lock is acquired", async () => {
			acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });

			renderProvider();
			expect(probe("readOnly")).toBe("true");
			await advance();

			expect(acquireMutateAsync).toHaveBeenCalledWith({ year: YEAR });
			expect(probe("readOnly")).toBe("false");
			expect(probe("loading")).toBe("false");
			expect(probe("holder")).toBe("none");
			expect(routerRefresh).not.toHaveBeenCalled();
		});

		it("shows the holder and retries while someone else edits", async () => {
			acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });

			renderProvider();
			await advance();

			expect(probe("readOnly")).toBe("true");
			expect(probe("holder")).toBe(HOLDER.email);

			await advance(LOCK_HEARTBEAT_INTERVAL_MS);
			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
		});

		it("refreshes the page when the lock frees up after a refusal", async () => {
			acquireMutateAsync
				.mockResolvedValueOnce({ acquired: false, holder: HOLDER })
				.mockResolvedValue({ acquired: true, holder: HOLDER });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);

			expect(probe("readOnly")).toBe("false");
			expect(probe("holder")).toBe("none");
			expect(routerRefresh).toHaveBeenCalledTimes(1);
		});

		it("flags the lock as unavailable and retries when acquisition fails", async () => {
			acquireMutateAsync
				.mockRejectedValueOnce(new Error("network"))
				.mockResolvedValue({ acquired: true, holder: HOLDER });

			renderProvider();
			await advance();

			expect(probe("unavailable")).toBe("true");
			expect(probe("readOnly")).toBe("true");
			expect(probe("loading")).toBe("false");

			await advance(LOCK_HEARTBEAT_INTERVAL_MS);
			expect(probe("unavailable")).toBe("false");
			expect(probe("readOnly")).toBe("false");
		});

		it("stops retrying without an unavailable alert when the declaration is already submitted", async () => {
			acquireMutateAsync.mockRejectedValue({ data: { code: "FORBIDDEN" } });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS * 2);

			expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
			expect(probe("readOnly")).toBe("true");
			expect(probe("unavailable")).toBe("false");
			expect(routerRefresh).toHaveBeenCalledTimes(1);
		});

		it("keeps editing blocked until the refreshed declaration has arrived", async () => {
			const refresh = deferred<void>();
			routerRefresh.mockReturnValue(refresh.promise);
			acquireMutateAsync
				.mockResolvedValueOnce({ acquired: false, holder: HOLDER })
				.mockResolvedValue({ acquired: true, holder: HOLDER });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);

			expect(routerRefresh).toHaveBeenCalledTimes(1);
			expect(probe("holder")).toBe("none");
			expect(probe("readOnly")).toBe("true");

			await settle(() => refresh.resolve());
			expect(probe("readOnly")).toBe("false");
		});

		it("stays read-only when the lock is lost again before the refresh ends", async () => {
			const refresh = deferred<void>();
			routerRefresh.mockReturnValue(refresh.promise);
			heartbeatMutateAsync.mockResolvedValue({ held: false });
			acquireMutateAsync
				.mockResolvedValueOnce({ acquired: false, holder: HOLDER })
				.mockResolvedValueOnce({ acquired: true, holder: HOLDER })
				.mockResolvedValue({ acquired: false, holder: HOLDER });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);

			await settle(() => refresh.resolve());
			expect(probe("readOnly")).toBe("true");
			expect(probe("holder")).toBe(HOLDER.email);
		});

		it("does not acquire from a hidden tab after a refusal", async () => {
			acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });

			renderProvider();
			await advance();
			setVisibility("hidden");
			await advance(LOCK_HEARTBEAT_INTERVAL_MS * 3);

			expect(acquireMutateAsync).toHaveBeenCalledTimes(1);

			setVisibility("visible");
			await advance();
			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
		});

		it("releases and ignores an acquisition answered once the tab is hidden", async () => {
			const answer = deferred<{ acquired: true; holder: typeof HOLDER }>();
			acquireMutateAsync.mockReturnValueOnce(answer.promise);
			heartbeatMutateAsync.mockResolvedValue({ held: true });

			renderProvider();
			await advance();
			setVisibility("hidden");
			await settle(() => answer.resolve({ acquired: true, holder: HOLDER }));

			expect(beacon).toHaveBeenCalledTimes(1);
			expect(probe("readOnly")).toBe("true");
			await advance(LOCK_HEARTBEAT_INTERVAL_MS * 2);
			expect(heartbeatMutateAsync).not.toHaveBeenCalled();
		});

		it("keeps the lock of a newer attempt when an outdated acquisition answers late", async () => {
			const first = deferred<{ acquired: true; holder: typeof HOLDER }>();
			acquireMutateAsync
				.mockReturnValueOnce(first.promise)
				.mockResolvedValue({ acquired: true, holder: HOLDER });

			renderProvider();
			await advance();
			setVisibility("hidden");
			setVisibility("visible");
			await advance();
			await settle(() => first.resolve({ acquired: true, holder: HOLDER }));

			expect(beacon).not.toHaveBeenCalled();
			expect(probe("readOnly")).toBe("false");
		});

		it("releases a lock acquired after leaving the declaration flow", async () => {
			const answer = deferred<{ acquired: true; holder: typeof HOLDER }>();
			acquireMutateAsync.mockReturnValueOnce(answer.promise);

			const { unmount } = renderProvider();
			await advance();
			unmount();
			expect(beacon).not.toHaveBeenCalled();

			await settle(() => answer.resolve({ acquired: true, holder: HOLDER }));

			expect(beacon).toHaveBeenCalledWith(RELEASE_ENDPOINT, expect.any(Blob));
			const body = beacon.mock.calls[0]?.[1] as Blob;
			await expect(body.text().then(JSON.parse)).resolves.toEqual({
				year: YEAR,
			});
		});
	});

	describe("heartbeat", () => {
		beforeEach(() => {
			acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
		});

		it("keeps editing while the heartbeat confirms the lock", async () => {
			heartbeatMutateAsync.mockResolvedValue({ held: true });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);

			expect(heartbeatMutateAsync).toHaveBeenCalledWith({ year: YEAR });
			expect(probe("readOnly")).toBe("false");
			expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
		});

		it("re-acquires as soon as the heartbeat reports a lost lock", async () => {
			heartbeatMutateAsync.mockResolvedValue({ held: false });
			acquireMutateAsync
				.mockResolvedValueOnce({ acquired: true, holder: HOLDER })
				.mockResolvedValue({ acquired: false, holder: HOLDER });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);

			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
			expect(probe("readOnly")).toBe("true");
			expect(probe("holder")).toBe(HOLDER.email);
		});

		it("stops retrying once the heartbeat finds the declaration transmitted", async () => {
			heartbeatMutateAsync.mockResolvedValue({ held: false });
			acquireMutateAsync
				.mockResolvedValueOnce({ acquired: true, holder: HOLDER })
				.mockRejectedValue({ data: { code: "FORBIDDEN" } });

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);
			await advance(LOCK_HEARTBEAT_INTERVAL_MS * 3);

			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
			expect(heartbeatMutateAsync).toHaveBeenCalledTimes(1);
			expect(probe("readOnly")).toBe("true");
			expect(probe("unavailable")).toBe("false");
			expect(routerRefresh).toHaveBeenCalledTimes(1);
		});

		it("re-checks the lock as soon as a write is rejected for a lost lock", async () => {
			heartbeatMutateAsync.mockResolvedValue({ held: true });
			acquireMutateAsync
				.mockResolvedValueOnce({ acquired: true, holder: HOLDER })
				.mockResolvedValue({ acquired: false, holder: HOLDER });

			const { queryClient } = renderProvider();
			await advance();
			await failMutation(queryClient, REPRESENTATION_LOCK_CONFLICT_MESSAGE);

			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
			expect(probe("readOnly")).toBe("true");
			expect(probe("holder")).toBe(HOLDER.email);
		});

		it("ignores write failures unrelated to the lock", async () => {
			heartbeatMutateAsync.mockResolvedValue({ held: true });

			const { queryClient } = renderProvider();
			await advance();
			await failMutation(queryClient, "network");

			expect(acquireMutateAsync).toHaveBeenCalledTimes(1);
			expect(probe("readOnly")).toBe("false");
		});

		it("falls back to read-only and retries when the heartbeat fails", async () => {
			heartbeatMutateAsync.mockRejectedValue(new Error("network"));

			renderProvider();
			await advance();
			await advance(LOCK_HEARTBEAT_INTERVAL_MS);

			expect(probe("readOnly")).toBe("true");
			expect(probe("unavailable")).toBe("true");

			await advance(LOCK_HEARTBEAT_INTERVAL_MS);
			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
		});
	});

	describe("release", () => {
		beforeEach(() => {
			acquireMutateAsync.mockResolvedValue({ acquired: true, holder: HOLDER });
			heartbeatMutateAsync.mockResolvedValue({ held: true });
		});

		function beaconPayload() {
			const body = beacon.mock.calls[0]?.[1] as Blob;
			return body.text().then((text) => JSON.parse(text));
		}

		it("releases the lock with a beacon when the tab is hidden, then re-acquires", async () => {
			renderProvider();
			await advance();

			setVisibility("hidden");
			expect(beacon).toHaveBeenCalledWith(RELEASE_ENDPOINT, expect.any(Blob));
			await expect(beaconPayload()).resolves.toEqual({ year: YEAR });
			expect(probe("readOnly")).toBe("true");

			setVisibility("visible");
			await advance();
			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
			expect(probe("readOnly")).toBe("false");
		});

		it("saves the pending input before releasing the lock of a hidden tab", async () => {
			const save = deferred<void>();
			const pendingSave = vi.fn(() => save.promise);
			renderProvider({ pendingSave });
			await advance();

			setVisibility("hidden");

			expect(pendingSave).toHaveBeenCalledTimes(1);
			expect(beacon).not.toHaveBeenCalled();
			expect(probe("readOnly")).toBe("true");

			await settle(() => save.resolve());
			expect(beacon).toHaveBeenCalledTimes(1);
		});

		it("keeps the lock when the tab is shown again before the pending save settles", async () => {
			const save = deferred<void>();
			renderProvider({ pendingSave: () => save.promise });
			await advance();

			setVisibility("hidden");
			setVisibility("visible");
			await advance();
			await settle(() => save.resolve());

			expect(beacon).not.toHaveBeenCalled();
			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
			expect(routerRefresh).not.toHaveBeenCalled();
			expect(probe("readOnly")).toBe("false");
		});

		it("releases on pagehide and re-acquires when restored from the back-forward cache", async () => {
			renderProvider();
			await advance();

			act(() => {
				window.dispatchEvent(new Event("pagehide"));
			});
			expect(beacon).toHaveBeenCalledTimes(1);

			firePageShow(false);
			await advance();
			expect(acquireMutateAsync).toHaveBeenCalledTimes(1);

			firePageShow(true);
			await advance();
			expect(acquireMutateAsync).toHaveBeenCalledTimes(2);
		});

		it("releases the held lock when leaving the declaration flow", async () => {
			const { unmount } = renderProvider();
			await advance();

			unmount();

			expect(beacon).toHaveBeenCalledTimes(1);
		});

		it("sends no beacon for a lock it never held", async () => {
			acquireMutateAsync.mockResolvedValue({ acquired: false, holder: HOLDER });
			const { unmount } = renderProvider();
			await advance();

			unmount();

			expect(beacon).not.toHaveBeenCalled();
		});
	});
});
