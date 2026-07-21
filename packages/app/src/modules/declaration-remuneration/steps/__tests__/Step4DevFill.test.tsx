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
			updateStep4: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

const emptyStep4Data = () => ({
	annual: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: undefined },
	],
	hourly: [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: undefined },
	],
});

describe("Step4QuartileDistribution dev fill", () => {
	it("fills both tables with 3 thresholds + 4 counts each when DevFill is clicked", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
				declarationYear={2025}
				indicatorGRequired
				initialData={emptyStep4Data()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "[DEV] Remplir" }));

		// 3 threshold inputs per table → 6 total
		const seuilInputs = screen.getAllByLabelText(/Seuil maximum/);
		expect(seuilInputs.length).toBe(6);
		const firstSeuil = seuilInputs[0] as HTMLInputElement;
		expect(firstSeuil.value.replace(/\s/g, " ")).toBe("22 000,00");

		// 4 women count inputs per table → 8 total, all filled
		const womenInputs = screen.getAllByLabelText(/Nombre de femmes/);
		expect(womenInputs.length).toBe(8);
		expect(womenInputs[0]).toHaveValue("35");
		// Q4 women is filled too
		const q4Women = screen.getAllByLabelText(
			/Nombre de femmes 4e quartile annuel/i,
		)[0];
		expect(q4Women).toHaveValue("27");
	});
});
