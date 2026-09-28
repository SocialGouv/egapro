import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock, useMutationMock } = vi.hoisted(() => ({
	trackEventMock: vi.fn(),
	useMutationMock: vi.fn(),
}));

vi.mock("~/modules/analytics", () => ({
	campaignYearDimension: (year: number) => ({ 1: String(year) }),
	MATOMO_ACTION: { CSE_STATUS_CONFIRM: "cse_status_confirm" },
	MATOMO_EVENT_CATEGORY: { CSE_STATUS: "cse_status" },
	trackEvent: trackEventMock,
}));

vi.mock("~/modules/domain", () => ({
	getCurrentYear: () => 2026,
}));

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: (...args: unknown[]) => useMutationMock(...args),
			},
		},
	},
}));

import { useUpdateHasCse } from "../useUpdateHasCse";

type MutationOptions = {
	onSuccess: (
		data: unknown,
		variables: { siren: string; hasCse: boolean },
	) => void;
};

// Capture the options the hook passes to `useMutation` so we can drive the
// `onSuccess(data, variables)` callback exactly as tRPC would.
function captureOptions(): MutationOptions {
	const options = useMutationMock.mock.calls[0]?.[0] as MutationOptions;
	return options;
}

const SIREN = "123456789";

describe("useUpdateHasCse", () => {
	beforeEach(() => {
		trackEventMock.mockReset();
		useMutationMock.mockReset();
		useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("tracks a single oui event on success with hasCse:true", () => {
		renderHook(() => useUpdateHasCse());

		captureOptions().onSuccess(undefined, { siren: SIREN, hasCse: true });

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: "cse_status",
			action: "cse_status_confirm",
			name: "oui",
			dimensions: { 1: "2026" },
		});
	});

	it("tracks a non event on success with hasCse:false", () => {
		renderHook(() => useUpdateHasCse());

		captureOptions().onSuccess(undefined, { siren: SIREN, hasCse: false });

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(trackEventMock.mock.calls[0]?.[0]).toMatchObject({ name: "non" });
	});

	it("never leaks the SIREN / SIRET / any PII into the tracked payload (CNIL anonymisation)", () => {
		renderHook(() => useUpdateHasCse());

		captureOptions().onSuccess(undefined, { siren: SIREN, hasCse: true });

		const payload = trackEventMock.mock.calls[0]?.[0];
		const serialized = JSON.stringify(payload);
		expect(serialized).not.toContain(SIREN);
		expect(serialized).not.toMatch(/siren/i);
		expect(serialized).not.toMatch(/siret/i);
	});

	it("invokes the caller's onSuccess after tracking", () => {
		const callerOnSuccess = vi.fn();
		renderHook(() => useUpdateHasCse({ onSuccess: callerOnSuccess }));

		captureOptions().onSuccess(undefined, { siren: SIREN, hasCse: true });

		expect(callerOnSuccess).toHaveBeenCalledTimes(1);
		// Tracking must fire before the caller's callback (which may navigate away
		// and unmount the component mid-flush).
		const trackOrder = trackEventMock.mock.invocationCallOrder[0] ?? Infinity;
		const callerOrder =
			callerOnSuccess.mock.invocationCallOrder[0] ?? -Infinity;
		expect(trackOrder).toBeLessThan(callerOrder);
	});

	it("does not throw when no caller onSuccess is provided", () => {
		renderHook(() => useUpdateHasCse());

		expect(() =>
			captureOptions().onSuccess(undefined, { siren: SIREN, hasCse: false }),
		).not.toThrow();
		expect(trackEventMock).toHaveBeenCalledTimes(1);
	});
});
