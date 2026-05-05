import { render, screen, waitFor } from "@testing-library/react";
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
		{ threshold: undefined, women: 2, men: 3 },
	],
	hourly: [
		{ threshold: "10", women: 3, men: 4 },
		{ threshold: "20", women: 3, men: 4 },
		{ threshold: "30", women: 2, men: 4 },
		{ threshold: undefined, women: 2, men: 3 },
	],
});

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

describe("Step4QuartileDistribution submit behaviour", () => {
	it("calls mutation with Q4 threshold=undefined when 3 thresholds + 8 counts are valid", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={validStep4Data()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledOnce();
		});
		const payload = mockMutate.mock.calls[0]?.[0];
		expect(payload.annual[3].threshold).toBeUndefined();
		expect(payload.hourly[3].threshold).toBeUndefined();
		expect(payload.annual[3].women).toBe(2);
		expect(payload.annual[3].men).toBe(3);
	});

	it("shows recap alert with anchor links when thresholds are non-crescent", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={{
					annual: [
						{ threshold: "30000", women: 1, men: 1 },
						{ threshold: "20000", women: 1, men: 1 },
						{ threshold: "40000", women: 1, men: 1 },
						{ threshold: undefined, women: 1, men: 1 },
					],
					hourly: [
						{ threshold: "10", women: 1, men: 1 },
						{ threshold: "20", women: 1, men: 1 },
						{ threshold: "30", women: 1, men: 1 },
						{ threshold: undefined, women: 1, men: 1 },
					],
				}}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		// Recap alert is rendered with role=alert
		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(/Le formulaire contient des erreurs/);
		// Anchor link points to the offending threshold input
		const anchor = alert.querySelector('a[href="#step4-annual-q2-max"]');
		expect(anchor).not.toBeNull();
		expect(alert.querySelectorAll("a").length).toBeGreaterThan(0);
	});

	it("shows 'Effectif obligatoire' on missing women count cells", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={{
					annual: [
						{ threshold: "10000", men: 4 },
						{ threshold: "20000", women: 3, men: 4 },
						{ threshold: "30000", women: 2, men: 4 },
						{ threshold: undefined, women: 2, men: 3 },
					],
					hourly: [
						{ threshold: "10", women: 3, men: 4 },
						{ threshold: "20", women: 3, men: 4 },
						{ threshold: "30", women: 2, men: 4 },
						{ threshold: undefined, women: 2, men: 3 },
					],
				}}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(screen.getAllByText("Effectif obligatoire").length).toBeGreaterThan(
			0,
		);
		const womenInput = screen.getByLabelText(
			/Nombre de femmes 1er quartile annuel/i,
		);
		expect(womenInput).toHaveAttribute("aria-invalid", "true");
	});

	it("shows 'Le seuil est obligatoire' when a threshold is empty and a count is also missing", async () => {
		const user = userEvent.setup();
		render(
			<Step4QuartileDistribution
				declarationYear={2025}
				initialData={emptyStep4Data()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mockMutate).not.toHaveBeenCalled();
		expect(
			screen.getAllByText("Le seuil est obligatoire").length,
		).toBeGreaterThan(0);
		// All threshold inputs should be aria-invalid
		const seuil1 = screen.getByLabelText(/Seuil maximum 1er quartile annuel/i);
		expect(seuil1).toHaveAttribute("aria-invalid", "true");
	});
});
