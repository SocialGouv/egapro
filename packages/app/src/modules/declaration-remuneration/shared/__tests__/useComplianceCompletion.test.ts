import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			completeCompliancePath: {
				useMutation: () => ({ mutate: mockMutate }),
			},
		},
	},
}));

import { useComplianceCompletion } from "../useComplianceCompletion";

describe("useComplianceCompletion", () => {
	beforeEach(() => {
		mockMutate.mockClear();
	});

	it("calls mutate once on first render", () => {
		renderHook(() => useComplianceCompletion());
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});

	it("does not call mutate again on re-render", () => {
		const { rerender } = renderHook(() => useComplianceCompletion());
		mockMutate.mockClear();
		rerender();
		rerender();
		expect(mockMutate).toHaveBeenCalledTimes(0);
	});
});
