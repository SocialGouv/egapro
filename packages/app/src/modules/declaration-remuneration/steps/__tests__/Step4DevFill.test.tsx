import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStepCategories: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

describe("Step4QuartileDistribution dev fill", () => {
	it("fills both tables when dev fill button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step4QuartileDistribution />);

		await user.click(screen.getByRole("button", { name: "[DEV] Remplir" }));

		// Intl.NumberFormat("fr-FR") uses U+202F as thousands separator
		const remuInputs = screen.getAllByLabelText(/Rémunération brute/);
		const firstRemuInput = remuInputs[0] as HTMLInputElement;
		expect(firstRemuInput.value.replace(/\s/g, " ")).toBe("22 000");

		const womenInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenInputs[0]).toHaveValue(35);
	});
});
