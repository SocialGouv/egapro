import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

	it("renders 'Non' when hasCse is false", () => {
		render(<CompanyInfoBanner company={{ ...baseCompany, hasCse: false }} />);
		expect(screen.getByText("Non")).toBeInTheDocument();
	});

	it("does not render address when null", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(screen.queryByText(/rue|avenue|boulevard/i)).not.toBeInTheDocument();
	});

	it("does not render NAF code section when nafCode is null", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(screen.queryByText("Code NAF :")).not.toBeInTheDocument();
	});

	it("does not render workforce section when workforce is null", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(screen.queryByText(/Effectif annuel moyen/)).not.toBeInTheDocument();
	});

	it("renders the 'Modifier les informations' button", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(
			screen.getByRole("button", { name: "Modifier les informations" }),
		).toBeInTheDocument();
	});
});
