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

vi.mock("~/trpc/react", () => ({
	api: {
		profile: {
			updatePhone: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
		},
	},
}));

import { CompanyDeclarationsPage } from "../CompanyDeclarationsPage";
import type { CompanyDetail, DeclarationItem } from "../types";

const company: CompanyDetail = {
	siren: "532847196",
	name: "Alpha Solutions",
	address: null,
	nafCode: null,
	workforce: null,
	hasCse: null,
};

const currentYear = new Date().getFullYear();

const declarations: DeclarationItem[] = [
	{
		type: "remuneration",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
	},
	{
		type: "representation",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
	},
];

describe("CompanyDeclarationsPage", () => {
	it("renders the main landmark with id 'content'", () => {
		render(
			<CompanyDeclarationsPage
				company={company}
				declarations={declarations}
				userPhone="0122334455"
			/>,
		);
		const main = screen.getByRole("main");
		expect(main).toBeInTheDocument();
		expect(main).toHaveAttribute("id", "content");
	});

	it("renders the company name", () => {
		render(
			<CompanyDeclarationsPage
				company={company}
				declarations={declarations}
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Alpha Solutions" }),
		).toBeInTheDocument();
	});

	it("renders the 'Déclarations' heading", () => {
		render(
			<CompanyDeclarationsPage
				company={company}
				declarations={declarations}
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Déclarations" }),
		).toBeInTheDocument();
	});

	it("renders the 'Archives' section", () => {
		render(
			<CompanyDeclarationsPage
				company={company}
				declarations={declarations}
				userPhone="0122334455"
			/>,
		);
		expect(screen.getByText("Archives")).toBeInTheDocument();
	});
});
