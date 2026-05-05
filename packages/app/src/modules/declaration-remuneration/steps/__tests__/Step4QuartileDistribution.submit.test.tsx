import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep4: {
				useMutation: () => ({
					mutate: mockMutate,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

beforeEach(() => {
	mockMutate.mockClear();
});

const validStep4Data = () => ({
	annual: [
		{ threshold: "10000", women: 3, men: 4 },
		{ threshold: "20000", women: 3, men: 4 },
		{ threshold: "30000", women: 2, men: 4 },
		{ women: 2, men: 3 },
	],
	hourly: [
		{ threshold: "10", women: 3, men: 4 },
		{ threshold: "20", women: 3, men: 4 },
		{ threshold: "30", women: 2, men: 4 },
		{ women: 2, men: 3 },
	],
});

describe("Step4QuartileDistribution submit behaviour", () => {
	it("calls mutation when Q1-Q3 have valid thresholds and Q4 has no threshold", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={validStep4Data()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).toHaveBeenCalledOnce();
		expect(
			screen.queryByText(/Veuillez renseigner toutes les données/),
		).not.toBeInTheDocument();
	});

	it("shows incomplete error when a women count is missing", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={{
					annual: [
						{ threshold: "10000", men: 4 },
						{ threshold: "20000", women: 3, men: 4 },
						{ threshold: "30000", women: 2, men: 4 },
						{ women: 2, men: 3 },
					],
					hourly: [
						{ threshold: "10", women: 3, men: 4 },
						{ threshold: "20", women: 3, men: 4 },
						{ threshold: "30", women: 2, men: 4 },
						{ women: 2, men: 3 },
					],
				}}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(
			screen.getByText(/Veuillez renseigner toutes les données/),
		).toBeInTheDocument();
	});
});
