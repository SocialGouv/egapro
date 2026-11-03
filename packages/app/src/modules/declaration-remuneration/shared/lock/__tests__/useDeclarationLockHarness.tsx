import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { type Mock, vi } from "vitest";

import type { useDeclarationLock as UseDeclarationLock } from "../useDeclarationLock";

export const acquireMutateAsync = vi.fn();
export const heartbeatMutateAsync = vi.fn();
export const releaseMutate = vi.fn();
export const availabilityQuery = vi.fn();
export const recheckAvailability = vi.fn();
export const resetAvailability = vi.fn();
export const fetchLockState = vi.fn();
export const routerRefresh = vi.fn();
export const stableRouter = { refresh: routerRefresh };

export type AvailabilityData = {
	available: boolean;
	lockTimeoutMinutes: number | null;
};
export const availabilityState: { data: AvailabilityData | undefined } = {
	data: undefined,
};

export const navigationMock = {
	useRouter: () => stableRouter,
};

export const trpcMock = {
	api: {
		useUtils: () => ({
			declarationLock: {
				getLockState: { fetch: fetchLockState },
				getLockAvailability: { reset: resetAvailability },
			},
		}),
		declarationLock: {
			acquireLock: { useMutation: () => ({ mutateAsync: acquireMutateAsync }) },
			heartbeat: { useMutation: () => ({ mutateAsync: heartbeatMutateAsync }) },
			releaseLock: { useMutation: () => ({ mutate: releaseMutate }) },
			getLockAvailability: {
				useQuery: (input: unknown, options: unknown) => {
					availabilityQuery(input, options);
					return { data: availabilityState.data, refetch: recheckAvailability };
				},
			},
		},
	},
};

export const useSessionMock = useSession as unknown as Mock;

export const DECLARATION_ID = "decl-1";
export const HOLDER = {
	userId: "user-2",
	email: "owner@example.fr",
	firstName: "Alice",
	lastName: "Martin",
	expiresAt: new Date("2026-06-23T12:00:00Z"),
	lockTimeoutMinutes: 30,
};

export const NEW_HOLDER = {
	...HOLDER,
	userId: "user-3",
	email: "other@example.fr",
	firstName: "Bruno",
	lastName: "Petit",
};

export const OWN_HOLDER = { ...HOLDER, userId: "user-1" };

export function setSession(
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

export function sendBeaconSpy() {
	const beacon = vi.fn().mockReturnValue(true);
	Object.defineProperty(navigator, "sendBeacon", {
		configurable: true,
		value: beacon,
	});
	return beacon;
}

export function setVisibility(state: DocumentVisibilityState) {
	Object.defineProperty(document, "visibilityState", {
		configurable: true,
		get: () => state,
	});
}

// Flush the mount IIFE's awaited acquisition + the state updates that follow,
// without waitFor (incompatible with fake timers used to drive the heartbeat).
export async function flush() {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
}

export function setAvailability(
	rerender: () => void,
	data: AvailabilityData | undefined,
) {
	availabilityState.data = data;
	act(() => {
		rerender();
	});
}

export function lastAvailabilityOptions() {
	const calls = availabilityQuery.mock.calls;
	return calls[calls.length - 1]?.[1] as {
		enabled: boolean;
		refetchInterval: number | false;
		refetchIntervalInBackground: boolean;
	};
}

export async function advance(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

export function renderLockHook(
	useHook: typeof UseDeclarationLock,
	options: { modificationClosed?: boolean } = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	const rendered = renderHook(
		() =>
			useHook({
				declarationId: DECLARATION_ID,
				modificationClosed: options.modificationClosed,
			}),
		{
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		},
	);
	return { ...rendered, queryClient };
}

// Drive a real mutation to failure so the hook sees the same mutation-cache
// "error" action a rejected step submit produces.
export async function failMutation(queryClient: QueryClient, message: string) {
	const mutation = queryClient.getMutationCache().build(queryClient, {
		mutationFn: async () => {
			throw new Error(message);
		},
	});
	await act(async () => {
		await mutation.execute(undefined).catch(() => {});
		await vi.advanceTimersByTimeAsync(0);
	});
}

export function firePageShow(persisted: boolean) {
	const event = new Event("pageshow");
	Object.defineProperty(event, "persisted", { value: persisted });
	act(() => {
		window.dispatchEvent(event);
	});
}

export function resetLockHookMocks() {
	vi.useFakeTimers();
	acquireMutateAsync.mockReset();
	heartbeatMutateAsync.mockReset();
	heartbeatMutateAsync.mockResolvedValue({ held: true });
	releaseMutate.mockReset();
	availabilityQuery.mockReset();
	recheckAvailability.mockReset();
	recheckAvailability.mockResolvedValue(undefined);
	resetAvailability.mockReset();
	resetAvailability.mockResolvedValue(undefined);
	fetchLockState.mockReset();
	fetchLockState.mockResolvedValue({
		locked: true,
		isOwnLock: false,
		holder: HOLDER,
	});
	routerRefresh.mockReset();
	availabilityState.data = undefined;
	setSession();
	setVisibility("visible");
}

export function teardownLockHook() {
	// Unmount the hook first so its pagehide/visibilitychange listeners are
	// detached before the next test dispatches events on the shared window.
	cleanup();
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
	useSessionMock.mockReset();
}
