import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { CompanyInfoBanner } from "../CompanyInfoBanner";
import type { CompanyDetail } from "../types";

const baseCompany: CompanyDetail = {
	siren: "532847196",
	name: "Alpha Solutions",
	address: null,
	nafCode: null,
	workforce: null,
	hasCse: null,
};

describe("CompanyInfoBanner", () => {
	it("renders the company name as an h2 heading", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Alpha Solutions" }),
		).toBeInTheDocument();
	});

	it("renders the formatted SIREN", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(screen.getByText("532 847 196")).toBeInTheDocument();
	});

	it("renders a breadcrumb with a link to /mon-espace/mes-entreprises", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		const link = screen.getByRole("link", { name: "Mon espace" });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/mon-espace/mes-entreprises");
	});

	it("renders the address when provided", () => {
		render(
			<CompanyInfoBanner
				company={{ ...baseCompany, address: "12 rue de Paris, 75001 Paris" }}
			/>,
		);
		expect(
			screen.getByText("12 rue de Paris, 75001 Paris"),
		).toBeInTheDocument();
	});

	it("renders the NAF code when provided", () => {
		render(
			<CompanyInfoBanner company={{ ...baseCompany, nafCode: "62.01Z" }} />,
		);
		expect(screen.getByText("62.01Z")).toBeInTheDocument();
	});

	it("renders the workforce when provided", () => {
		render(<CompanyInfoBanner company={{ ...baseCompany, workforce: 150 }} />);
		expect(screen.getByText("150")).toBeInTheDocument();
	});

	it("renders 'À compléter' badge when hasCse is null", () => {
		render(<CompanyInfoBanner company={{ ...baseCompany, hasCse: null }} />);
		expect(screen.getByText("À compléter")).toBeInTheDocument();
	});

	it("renders 'Oui' when hasCse is true", () => {
		render(<CompanyInfoBanner company={{ ...baseCompany, hasCse: true }} />);
		expect(screen.getByText("Oui")).toBeInTheDocument();
	});
});
