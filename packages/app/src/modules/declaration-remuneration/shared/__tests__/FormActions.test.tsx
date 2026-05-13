import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormActions } from "../FormActions";

const mockedUseSession = vi.mocked(useSession);

describe("FormActions", () => {
	it("renders previous link when previousHref is provided", () => {
		render(<FormActions previousHref="/step/1" />);

		const link = screen.getByRole("link", { name: /précédent/i });
		expect(link).toHaveAttribute("href", "/step/1");
	});

	it("renders submit button when no nextHref is provided", () => {
		render(<FormActions />);

		const button = screen.getByRole("button", { name: /suivant/i });
		expect(button).toHaveAttribute("type", "submit");
	});

	it("renders next link when nextHref is provided", () => {
		render(<FormActions nextHref="/step/3" />);

		const link = screen.getByRole("link", { name: /suivant/i });
		expect(link).toHaveAttribute("href", "/step/3");
	});

	it("shows 'Enregistrement…' when isSubmitting is true", () => {
		render(<FormActions isSubmitting />);

		expect(screen.getByText("Enregistrement…")).toBeInTheDocument();
	});

	it("disables button when nextDisabled is true", () => {
		render(<FormActions nextDisabled />);

		const button = screen.getByRole("button", { name: /suivant/i });
		expect(button).toBeDisabled();
	});

	it("renders custom nextLabel", () => {
		render(<FormActions nextLabel="Valider" />);

		expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
	});

	describe("admin impersonation", () => {
		afterEach(() => {
			mockedUseSession.mockReset();
		});

		function mockImpersonating() {
			mockedUseSession.mockReturnValue({
				data: {
					user: {
						id: "admin-1",
						impersonation: { siren: "123456789", name: "Acme" },
					},
					expires: "2099-01-01",
				},
				status: "authenticated",
			} as unknown as ReturnType<typeof useSession>);
		}

		it("disables the submit button and renders a tooltip when impersonating without a saved record", () => {
			mockImpersonating();

			render(<FormActions />);

			const button = screen.getByRole("button", { name: /suivant/i });
			expect(button).toBeDisabled();
			const tooltip = screen.getByRole("tooltip");
			expect(tooltip).toHaveTextContent("mimoquage");
			expect(button).toHaveAttribute("aria-describedby", tooltip.id);
		});

		it("renders a Link instead of the submit button when impersonating with mimoquageNextHref", () => {
			mockImpersonating();

			render(
				<FormActions mimoquageNextHref="/declaration-remuneration/etape/2" />,
			);

			expect(
				screen.queryByRole("button", { name: /suivant/i }),
			).not.toBeInTheDocument();
			const link = screen.getByRole("link", { name: /suivant/i });
			expect(link).toHaveAttribute("href", "/declaration-remuneration/etape/2");
			const tooltip = screen.getByRole("tooltip");
			expect(link).toHaveAttribute("aria-describedby", tooltip.id);
		});

		it("ignores mimoquageNextHref when not impersonating", () => {
			render(
				<FormActions mimoquageNextHref="/declaration-remuneration/etape/2" />,
			);

			const button = screen.getByRole("button", { name: /suivant/i });
			expect(button).toHaveAttribute("type", "submit");
			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
		});

		it("does not render the tooltip when not impersonating", () => {
			render(<FormActions />);

			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
		});
	});

	describe("onPrevious prop", () => {
		it("renders a button for Précédent when onPrevious is provided", async () => {
			const user = userEvent.setup();
			const handlePrevious = vi.fn();
			render(
				<FormActions onPrevious={handlePrevious} previousHref="/step/1" />,
			);

			const btn = screen.getByRole("button", { name: /précédent/i });
			expect(btn).toHaveAttribute("type", "button");
			await user.click(btn);
			expect(handlePrevious).toHaveBeenCalledTimes(1);
		});

		it("shows Enregistrement… on Précédent when isPreviousPending is true", () => {
			render(
				<FormActions
					isPreviousPending
					onPrevious={vi.fn()}
					previousHref="/step/1"
				/>,
			);

			expect(screen.getByText("Enregistrement…")).toBeInTheDocument();
		});

		it("disables Précédent and Suivant when isPreviousPending is true", () => {
			render(
				<FormActions
					isPreviousPending
					onPrevious={vi.fn()}
					previousHref="/step/1"
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Enregistrement…" }),
			).toBeDisabled();
			expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
		});

		it("disables Précédent and Suivant when isSubmitting is true", () => {
			render(
				<FormActions
					isSubmitting
					onPrevious={vi.fn()}
					previousHref="/step/1"
				/>,
			);

			expect(screen.getByRole("button", { name: /précédent/i })).toBeDisabled();
		});

		it("renders a Link for Précédent when admin is impersonating even if onPrevious is provided", () => {
			mockedUseSession.mockReturnValue({
				data: {
					user: {
						id: "admin-1",
						impersonation: { siren: "123456789", name: "Acme" },
					},
					expires: "2099-01-01",
				},
				status: "authenticated",
			} as unknown as ReturnType<typeof useSession>);

			render(<FormActions onPrevious={vi.fn()} previousHref="/step/1" />);

			const link = screen.getByRole("link", { name: /précédent/i });
			expect(link).toHaveAttribute("href", "/step/1");
			expect(
				screen.queryByRole("button", { name: /précédent/i }),
			).not.toBeInTheDocument();

			mockedUseSession.mockReset();
		});
	});
});
