import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GIP_WORKFORCE_UNKNOWN_LABEL } from "~/modules/domain";
import { CompanyInfoBanner } from "../CompanyInfoBanner";
import type { CompanyDetail } from "../types";

// gipWorkforce is >= 100 by default so the CSE row is visible in tests
// exercising the historical CSE badge/value behavior.
const baseCompany: CompanyDetail = {
	siren: "532847196",
	name: "Alpha Solutions",
	address: null,
	nafCode: null,
	nafLabel: null,
	gipWorkforce: 250,
	hasCse: null,
};

describe("CompanyInfoBanner", () => {
	it("renders the company name as the page h1 heading", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Alpha Solutions" }),
		).toBeInTheDocument();
	});

	it("structures company data as a description list", () => {
		const { container } = render(
			<CompanyInfoBanner
				company={{ ...baseCompany, address: "12 RUE DE PARIS, 75001 PARIS" }}
			/>,
		);
		const terms = Array.from(container.querySelectorAll("dl dt")).map(
			(dt) => dt.textContent,
		);
		expect(terms).toContain("SIREN :");
		expect(terms).toContain("Adresse :");
		expect(terms).toContain("Existence d'un CSE :");
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
				company={{ ...baseCompany, address: "12 RUE DE PARIS, 75001 PARIS" }}
			/>,
		);
		expect(
			screen.getByText("12 Rue de Paris, 75001 Paris"),
		).toBeInTheDocument();
	});

	it("renders the NAF code when provided", () => {
		render(
			<CompanyInfoBanner company={{ ...baseCompany, nafCode: "62.01Z" }} />,
		);
		expect(screen.getByText("62.01Z")).toBeInTheDocument();
	});

	it("renders the NAF code with its activity label when provided", () => {
		render(
			<CompanyInfoBanner
				company={{
					...baseCompany,
					nafCode: "62.01Z",
					nafLabel: "Programmation informatique",
				}}
			/>,
		);
		expect(
			screen.getByText("62.01Z — Programmation informatique"),
		).toBeInTheDocument();
	});

	it("renders the workforce when provided", () => {
		render(
			<CompanyInfoBanner company={{ ...baseCompany, gipWorkforce: 150 }} />,
		);
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

	it("renders the GIP unknown label and hides the CSE row when gipWorkforce is null", () => {
		render(
			<CompanyInfoBanner company={{ ...baseCompany, gipWorkforce: null }} />,
		);
		expect(screen.getByText(GIP_WORKFORCE_UNKNOWN_LABEL)).toBeInTheDocument();
		expect(screen.queryByText("Existence d'un CSE :")).not.toBeInTheDocument();
	});

	it("floors the workforce display and hides the CSE row below the 100 threshold", () => {
		render(
			<CompanyInfoBanner company={{ ...baseCompany, gipWorkforce: 99.97 }} />,
		);
		expect(screen.getByText("99")).toBeInTheDocument();
		expect(screen.queryByText("Existence d'un CSE :")).not.toBeInTheDocument();
	});

	it("shows the workforce and the CSE row at or above the 100 threshold", () => {
		render(
			<CompanyInfoBanner company={{ ...baseCompany, gipWorkforce: 250 }} />,
		);
		expect(screen.getByText("250")).toBeInTheDocument();
		expect(screen.getByText("Existence d'un CSE :")).toBeInTheDocument();
	});

	it("renders the 'Modifier' button", () => {
		render(<CompanyInfoBanner company={baseCompany} />);
		expect(
			screen.getByRole("button", { name: "Modifier" }),
		).toBeInTheDocument();
	});
});
