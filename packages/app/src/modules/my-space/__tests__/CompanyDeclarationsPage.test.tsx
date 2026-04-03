import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					mutateAsync: vi.fn(),
					isPending: false,
				}),
			},
		},
		profile: {
			updatePhone: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					mutateAsync: vi.fn(),
					isPending: false,
				}),
			},
		},
	},
}));

import { getCurrentYear, getDefaultCampaignDeadlines } from "~/modules/domain";
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

const currentYear = getCurrentYear();
const campaignDeadlines = getDefaultCampaignDeadlines(currentYear);

const declarations: DeclarationItem[] = [
	{
		type: "remuneration",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
		compliancePath: null,
		secondDeclarationStatus: null,
		complianceCompletedAt: null,
		hasCseOpinion: false,
		hasJointEvaluationFile: false,
	},
	{
		type: "representation",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		currentStep: 0,
		updatedAt: null,
		compliancePath: null,
		secondDeclarationStatus: null,
		complianceCompletedAt: null,
		hasCseOpinion: false,
		hasJointEvaluationFile: false,
	},
];

describe("CompanyDeclarationsPage", () => {
	it("renders the main landmark with id 'content'", () => {
		render(
			<CompanyDeclarationsPage
				campaignDeadlines={campaignDeadlines}
				company={company}
				declarations={declarations}
				hasNoSanction={false}
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
				campaignDeadlines={campaignDeadlines}
				company={company}
				declarations={declarations}
				hasNoSanction={false}
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Alpha Solutions" }),
		).toBeInTheDocument();
	});

	it("renders the 'En cours' heading", () => {
		render(
			<CompanyDeclarationsPage
				campaignDeadlines={campaignDeadlines}
				company={company}
				declarations={declarations}
				hasNoSanction={false}
				userPhone="0122334455"
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "En cours" }),
		).toBeInTheDocument();
	});

	it("renders the 'Archives' section", () => {
		render(
			<CompanyDeclarationsPage
				campaignDeadlines={campaignDeadlines}
				company={company}
				declarations={declarations}
				hasNoSanction={false}
				userPhone="0122334455"
			/>,
		);
		expect(screen.getByText("Archives")).toBeInTheDocument();
	});

	it("does not show MissingInfoModal when userPhone and hasCse are provided", () => {
		const { container } = render(
			<CompanyDeclarationsPage
				campaignDeadlines={campaignDeadlines}
				company={{ ...company, hasCse: true }}
				declarations={declarations}
				hasNoSanction={false}
				userPhone="0122334455"
			/>,
		);
		expect(
			container.querySelector("#missing-info-modal"),
		).not.toBeInTheDocument();
	});

	it("renders MissingInfoModal when userPhone is null", () => {
		const { container } = render(
			<CompanyDeclarationsPage
				campaignDeadlines={campaignDeadlines}
				company={{ ...company, hasCse: true }}
				declarations={declarations}
				hasNoSanction={false}
				userPhone={null}
			/>,
		);
		expect(container.querySelector("#missing-info-modal")).toBeInTheDocument();
	});

	it("renders MissingInfoModal when hasCse is null", () => {
		const { container } = render(
			<CompanyDeclarationsPage
				campaignDeadlines={campaignDeadlines}
				company={{ ...company, hasCse: null }}
				declarations={declarations}
				hasNoSanction={false}
				userPhone="0122334455"
			/>,
		);
		expect(container.querySelector("#missing-info-modal")).toBeInTheDocument();
	});
});
