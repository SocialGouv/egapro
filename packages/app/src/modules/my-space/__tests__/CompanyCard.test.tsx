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

import { CompanyCard } from "../CompanyCard";
import type { CompanyItem } from "../types";

const company: CompanyItem = {
	siren: "532847196",
	name: "Alpha Solutions",
	declarationStatus: "to_complete",
};

describe("CompanyCard", () => {
	it("renders the company name as a link", () => {
		render(<CompanyCard company={company} />);
		const link = screen.getByRole("link", { name: "Alpha Solutions" });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"/mon-espace/mes-entreprises/532847196",
		);
	});

	it("renders the SIREN number", () => {
		render(<CompanyCard company={company} />);
		expect(screen.getByText("N° SIREN : 532847196")).toBeInTheDocument();
	});

	it("renders the status badge", () => {
		render(<CompanyCard company={company} />);
		expect(screen.getByText("À compléter")).toBeInTheDocument();
	});

	it("has the correct DSFR card classes", () => {
		const { container } = render(<CompanyCard company={company} />);
		const card = container.querySelector(".fr-card");
		expect(card).toHaveClass("fr-card--horizontal");
		expect(card).toHaveClass("fr-card--sm");
		expect(card).toHaveClass("fr-enlarge-link");
	});

	it("renders the correct badge for done status", () => {
		render(<CompanyCard company={{ ...company, declarationStatus: "done" }} />);
		expect(screen.getByText("Effectué")).toBeInTheDocument();
	});
});
