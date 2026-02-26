import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FormActions } from "../FormActions";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

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
});
