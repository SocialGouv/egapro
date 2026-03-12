import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step1Workforce } from "../Step1Workforce";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep1: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

describe("Step1Workforce dev fill", () => {
	it("fills workforce when dev fill button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step1Workforce />);

		await user.click(screen.getByRole("button", { name: "[DEV] Remplir" }));

		expect(screen.getByLabelText("Nombre de femmes")).toHaveValue(120);
		expect(screen.getByLabelText("Nombre d'hommes")).toHaveValue(130);
	});
});
