import { render } from "@testing-library/react";
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

import { ComplianceCompletionEffect } from "../ComplianceCompletionEffect";

describe("ComplianceCompletionEffect", () => {
	beforeEach(() => {
		mockMutate.mockClear();
	});

	it("renders nothing", () => {
		const { container } = render(<ComplianceCompletionEffect />);
		expect(container.innerHTML).toBe("");
	});

	it("triggers compliance completion mutation on mount", () => {
		render(<ComplianceCompletionEffect />);
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});
});
