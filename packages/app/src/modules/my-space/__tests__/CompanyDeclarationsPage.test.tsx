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
	nafLabel: null,
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
		fsmStatus: null,
		currentStep: 0,
		updatedAt: null,
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,

		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
	},
	{
		type: "representation",
		siren: "532847196",
		year: currentYear,
		status: "to_complete",
		fsmStatus: null,
		currentStep: 0,
		updatedAt: null,
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,

		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
	},
];

type LockHolder = {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
};

const BASE_PROPS = {
	campaignDeadlines,
	company,
	declarations,
	hasNoSanction: false,
	lockedByOther: false,
	lockHolder: null as LockHolder | null,
	userPhone: "0122334455" as string | null,
};

function renderPage(overrides: Partial<typeof BASE_PROPS> = {}) {
	return render(<CompanyDeclarationsPage {...BASE_PROPS} {...overrides} />);
}

describe("CompanyDeclarationsPage", () => {
	it("renders the main landmark with id 'content'", () => {
		renderPage();
		const main = screen.getByRole("main");
		expect(main).toBeInTheDocument();
		expect(main).toHaveAttribute("id", "content");
	});

	it("renders the company name", () => {
		renderPage();
		expect(
			screen.getByRole("heading", { level: 2, name: "Alpha Solutions" }),
		).toBeInTheDocument();
	});

	it("renders the 'Démarche en cours' heading", () => {
		renderPage();
		expect(
			screen.getByRole("heading", { level: 2, name: "Démarche en cours" }),
		).toBeInTheDocument();
	});

	it("renders the 'Archives' section", () => {
		renderPage();
		expect(screen.getByText("Archives")).toBeInTheDocument();
	});

	it("always renders MissingInfoModal so DSFR conceal/disclose chain works", () => {
		const { container } = renderPage({ company: { ...company, hasCse: true } });
		expect(container.querySelector("#missing-info-modal")).toBeInTheDocument();
	});

	it("renders MissingInfoModal when userPhone is null", () => {
		const { container } = renderPage({
			company: { ...company, hasCse: true },
			userPhone: null,
		});
		expect(container.querySelector("#missing-info-modal")).toBeInTheDocument();
	});

	it("renders MissingInfoModal when hasCse is null", () => {
		const { container } = renderPage({ company: { ...company, hasCse: null } });
		expect(container.querySelector("#missing-info-modal")).toBeInTheDocument();
	});

	it("forwards the lock alert when the declaration is locked by another user", () => {
		const { container } = renderPage({
			lockedByOther: true,
			lockHolder: {
				firstName: "Alice",
				lastName: "Martin",
				email: "alice.martin@example.fr",
			},
		});
		const alert = container.querySelector('[role="alert"]');
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveTextContent("Déclaration en cours de modification");
		expect(alert).toHaveTextContent("Alice Martin");
	});
});
