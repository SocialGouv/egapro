import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefresh = vi.fn();
const mockWaitForServer = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		profile: {
			get: {
				useQuery: () => ({ refetch: mockWaitForServer }),
			},
		},
	},
}));

import { useRefreshAfterSubmissionError } from "../useRefreshAfterSubmissionError";

describe("useRefreshAfterSubmissionError", () => {
	beforeEach(() => {
		mockRefresh.mockReset();
		mockWaitForServer.mockReset();
	});

	it("refreshes immediately when the server answered with an error", () => {
		const { result } = renderHook(() => useRefreshAfterSubmissionError());

		act(() =>
			result.current({ message: "Refusé", data: { code: "FORBIDDEN" } }),
		);

		expect(mockRefresh).toHaveBeenCalledTimes(1);
		expect(mockWaitForServer).not.toHaveBeenCalled();
	});

	it("waits for the server to answer again before refreshing after a network failure", async () => {
		let markServerReachable: (result: { isSuccess: boolean }) => void =
			() => {};
		mockWaitForServer.mockReturnValue(
			new Promise((resolve) => {
				markServerReachable = resolve;
			}),
		);
		const { result } = renderHook(() => useRefreshAfterSubmissionError());

		act(() => result.current({ message: "Failed to fetch" }));

		expect(mockWaitForServer).toHaveBeenCalledTimes(1);
		expect(mockRefresh).not.toHaveBeenCalled();

		await act(async () => markServerReachable({ isSuccess: true }));

		expect(mockRefresh).toHaveBeenCalledTimes(1);
	});

	it("gives up quietly once the server stays unreachable", async () => {
		mockWaitForServer.mockResolvedValue({ isSuccess: false });
		const { result } = renderHook(() => useRefreshAfterSubmissionError());

		await act(async () => result.current({ message: "Failed to fetch" }));

		expect(mockRefresh).not.toHaveBeenCalled();
	});
});
