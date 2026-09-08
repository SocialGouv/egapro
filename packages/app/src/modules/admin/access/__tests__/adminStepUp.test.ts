import { signIn } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildAdminStepUpAuthorizationParams } from "~/server/auth/stepUpParams";
import { triggerAdminStepUp } from "../adminStepUp";

const mockSignIn = vi.mocked(signIn);

describe("triggerAdminStepUp", () => {
	beforeEach(() => {
		mockSignIn.mockClear();
	});

	it("signs in through the proconnect provider", () => {
		triggerAdminStepUp("/admin");

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			expect.anything(),
			expect.anything(),
		);
		expect(mockSignIn.mock.calls[0]?.[0]).toBe("proconnect");
	});

	it("carries the requested return path as the callback URL", () => {
		triggerAdminStepUp("/admin/declarations/abc");

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			{ callbackUrl: "/admin/declarations/abc" },
			expect.anything(),
		);
	});

	it("attaches the admin step-up authorization params, unmodified", () => {
		triggerAdminStepUp("/admin");

		expect(mockSignIn).toHaveBeenCalledWith(
			"proconnect",
			expect.anything(),
			buildAdminStepUpAuthorizationParams(),
		);
	});
});
