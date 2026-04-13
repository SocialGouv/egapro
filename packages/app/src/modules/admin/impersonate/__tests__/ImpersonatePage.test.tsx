import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../ImpersonateForm", () => ({
	ImpersonateForm: () =>
		React.createElement("div", { "data-testid": "impersonate-form" }),
}));

import { ImpersonatePage } from "../ImpersonatePage";

describe("ImpersonatePage", () => {
	it("renders the heading, description and the form", () => {
		render(<ImpersonatePage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /mimoquer une entreprise/i,
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/administrateur/i)).toBeInTheDocument();
		expect(screen.getByTestId("impersonate-form")).toBeInTheDocument();
	});
});
