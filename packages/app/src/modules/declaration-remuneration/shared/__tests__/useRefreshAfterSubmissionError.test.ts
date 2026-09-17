import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

import { useRefreshAfterSubmissionError } from "../useRefreshAfterSubmissionError";

describe("useRefreshAfterSubmissionError", () => {
	beforeEach(() => {
		mockRefresh.mockReset();
		vi.stubGlobal("fetch", vi.fn());
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("refreshes immediately when the server answered with an error", () => {
		const { result } = renderHook(() => useRefreshAfterSubmissionError());

		act(() =>
			result.current({ message: "Refusé", data: { code: "FORBIDDEN" } }),
		);

		expect(mockRefresh).toHaveBeenCalledTimes(1);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("probes /api/healthz and refreshes once the server answers again after a network failure", async () => {
		vi.mocked(fetch)
			.mockRejectedValueOnce(new TypeError("Failed to fetch"))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const { result } = renderHook(() => useRefreshAfterSubmissionError());

		act(() => result.current({ message: "Failed to fetch" }));
		await act(() => vi.advanceTimersByTimeAsync(0));

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(mockRefresh).not.toHaveBeenCalled();

		await act(() => vi.advanceTimersByTimeAsync(1_000));

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch).toHaveBeenCalledWith(
			"/api/healthz",
			expect.objectContaining({ cache: "no-store" }),
		);
		expect(mockRefresh).toHaveBeenCalledTimes(1);
	});

	it("gives up quietly once the server stays unreachable after 5 attempts", async () => {
		vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
		const { result } = renderHook(() => useRefreshAfterSubmissionError());

		act(() => result.current({ message: "Failed to fetch" }));
		await act(() => vi.advanceTimersByTimeAsync(1_000 + 2_000 + 4_000 + 8_000));

		expect(fetch).toHaveBeenCalledTimes(5);
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("does not refresh once the component has unmounted while the probe is still retrying", async () => {
		vi.mocked(fetch)
			.mockRejectedValueOnce(new TypeError("Failed to fetch"))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const { result, unmount } = renderHook(() =>
			useRefreshAfterSubmissionError(),
		);

		act(() => result.current({ message: "Failed to fetch" }));
		await act(() => vi.advanceTimersByTimeAsync(0));
		expect(fetch).toHaveBeenCalledTimes(1);

		unmount();

		await act(() => vi.advanceTimersByTimeAsync(1_000));

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(mockRefresh).not.toHaveBeenCalled();
	});
});
