import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step3VariablePay } from "../Step3VariablePay";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep3: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

const emptyStep3Data = () => ({
	indicatorBAnnualWomen: "",
	indicatorBAnnualMen: "",
	indicatorBHourlyWomen: "",
	indicatorBHourlyMen: "",
	indicatorDAnnualWomen: "",
	indicatorDAnnualMen: "",
	indicatorDHourlyWomen: "",
	indicatorDHourlyMen: "",
	indicatorEWomen: "",
	indicatorEMen: "",
});

describe("Step3VariablePay dev fill", () => {
	it("fills rows and beneficiaries when dev fill button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step3VariablePay initialData={emptyStep3Data()} />);

		await user.click(screen.getByRole("button", { name: "[DEV] Remplir" }));

		// Intl.NumberFormat("fr-FR") uses U+202F as thousands separator
		const womenInput = screen.getByLabelText(
			"Annuelle brute moyenne — Femmes",
		) as HTMLInputElement;
		expect(womenInput.value.replace(/\s/g, " ")).toBe("2 500");
		expect(screen.getByLabelText("Bénéficiaires femmes")).toHaveValue("95");
		expect(screen.getByLabelText("Bénéficiaires hommes")).toHaveValue("110");
	});
});
