import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
	SessionProvider: ({ children }: { children: React.ReactNode }) =>
		React.createElement("div", { "data-testid": "session-provider" }, children),
	signIn: vi.fn(),
}));

import { SessionProviderWrapper } from "../SessionProviderWrapper";

describe("SessionProviderWrapper", () => {
	it("wraps children in a SessionProvider", () => {
		render(
			<SessionProviderWrapper>
				<span>child</span>
			</SessionProviderWrapper>,
		);
		const provider = screen.getByTestId("session-provider");
		expect(provider).toBeInTheDocument();
		expect(provider).toHaveTextContent("child");
	});
});
