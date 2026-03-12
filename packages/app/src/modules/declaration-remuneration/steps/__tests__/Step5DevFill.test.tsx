import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step5EmployeeCategories } from "../Step5EmployeeCategories";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateEmployeeCategories: {
				useMutation: () => ({
					mutate: vi.fn(),
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe("Step5EmployeeCategories dev fill", () => {
	it("fills categories when dev fill button is clicked", async () => {
		const user = userEvent.setup();
		render(<Step5EmployeeCategories />);

		await user.click(screen.getByRole("button", { name: "[DEV] Remplir" }));

		expect(screen.getByText("Nombre de catégories : 4")).toBeInTheDocument();
	});
});
