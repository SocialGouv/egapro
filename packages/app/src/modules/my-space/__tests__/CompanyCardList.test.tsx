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

import { CompanyCardList } from "../CompanyCardList";
import type { CompanyItem } from "../types";

const companies: CompanyItem[] = [
	{ siren: "111111111", name: "Company A", declarationStatus: "to_complete" },
	{ siren: "222222222", name: "Company B", declarationStatus: "in_progress" },
	{ siren: "333333333", name: "Company C", declarationStatus: "done" },
];

describe("CompanyCardList", () => {
	it("renders one card per company", () => {
		render(<CompanyCardList companies={companies} />);
		expect(screen.getByText("Company A")).toBeInTheDocument();
		expect(screen.getByText("Company B")).toBeInTheDocument();
		expect(screen.getByText("Company C")).toBeInTheDocument();
	});

	it("uses the DSFR grid row", () => {
		const { container } = render(<CompanyCardList companies={companies} />);
		expect(container.querySelector(".fr-grid-row")).toBeInTheDocument();
	});

	it("renders nothing for an empty list", () => {
		const { container } = render(<CompanyCardList companies={[]} />);
		expect(container.querySelectorAll(".fr-card")).toHaveLength(0);
	});
});
