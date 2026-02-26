import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompanyBanner } from "../CompanyBanner";

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

describe("CompanyBanner", () => {
	it("renders breadcrumb with 'Mon espace' link and current page label", () => {
		render(<CompanyBanner siren="123456789" currentPageLabel="Déclaration" />);

		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toHaveAttribute("href", "/");

		expect(screen.getByText("Déclaration")).toBeInTheDocument();
	});

	it("renders formatted SIREN", () => {
		render(<CompanyBanner siren="123456789" currentPageLabel="Déclaration" />);

		expect(screen.getByText(/123 456 789/)).toBeInTheDocument();
	});

	it("renders company name", () => {
		render(<CompanyBanner siren="123456789" currentPageLabel="Déclaration" />);

		expect(screen.getByText(/Mon entreprise/)).toBeInTheDocument();
	});

	it("renders effectif and CSE values", () => {
		render(<CompanyBanner siren="123456789" currentPageLabel="Déclaration" />);

		expect(screen.getByText("45")).toBeInTheDocument();
		expect(screen.getByText("Oui")).toBeInTheDocument();
	});
});
