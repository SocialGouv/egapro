import { render, screen } from "@testing-library/react";
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

		it("disables the submit button and renders a tooltip when impersonating", () => {
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

			render(<FormActions />);

			const button = screen.getByRole("button", { name: /suivant/i });
			expect(button).toBeDisabled();
			const tooltip = screen.getByRole("tooltip");
			expect(tooltip).toHaveTextContent("mimoquage");
			expect(button).toHaveAttribute("aria-describedby", tooltip.id);
		});

		it("does not render the tooltip when not impersonating", () => {
			render(<FormActions />);

			expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
		});
	});
});
