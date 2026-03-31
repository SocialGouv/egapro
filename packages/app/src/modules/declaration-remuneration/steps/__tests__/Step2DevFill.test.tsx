import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step2PayGap } from "../Step2PayGap";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep2: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

const emptyStep2Data = () => ({
	indicatorAAnnualWomen: "",
	indicatorAAnnualMen: "",
	indicatorAHourlyWomen: "",
	indicatorAHourlyMen: "",
	indicatorCAnnualWomen: "",
	indicatorCAnnualMen: "",
	indicatorCHourlyWomen: "",
	indicatorCHourlyMen: "",
});

describe("Step2PayGap dev fill", () => {
	it("fills pay gap rows when dev fill button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step2PayGap initialData={emptyStep2Data()} />);

		await user.click(screen.getByRole("button", { name: "[DEV] Remplir" }));

		// Intl.NumberFormat("fr-FR") uses U+202F as thousands separator
		const womenInput = screen.getByLabelText(
			"Annuelle brute moyenne — Femmes",
		) as HTMLInputElement;
		const menInput = screen.getByLabelText(
			"Annuelle brute moyenne — Hommes",
		) as HTMLInputElement;
		expect(womenInput.value.replace(/\s/g, " ")).toBe("35 000");
		expect(menInput.value.replace(/\s/g, " ")).toBe("38 000");
	});
});
