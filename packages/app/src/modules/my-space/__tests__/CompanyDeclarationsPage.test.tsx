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
	gipWorkforce: null,
	hasCse: null,
};

const currentYear = getCurrentYear();
const campaignDeadlines = getDefaultCampaignDeadlines(currentYear);

function makeDeclaration(
	type: DeclarationItem["type"],
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return {
		type,
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
		...overrides,
	};
}

const declarations: DeclarationItem[] = [
	makeDeclaration("remuneration"),
	makeDeclaration("representation"),
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
			screen.getByRole("heading", { level: 1, name: "Alpha Solutions" }),
		).toBeInTheDocument();
	});

	it("renders the 'Démarche en cours' heading", () => {
		renderPage();
		expect(
			screen.getByRole("heading", { level: 2, name: "Démarche en cours" }),
		).toBeInTheDocument();
	});

	it("does not render the 'Archives' section", () => {
		renderPage();
		expect(screen.queryByText("Archives")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Demander une déclaration archivée",
			}),
		).not.toBeInTheDocument();
	});

	it("renders the last action date of the current year remuneration declaration", () => {
		renderPage({
			declarations: [
				makeDeclaration("remuneration", { updatedAt: new Date(2026, 2, 12) }),
				makeDeclaration("representation"),
			],
		});
		expect(
			screen.getByText("Dernière action le 12 mars 2026"),
		).toBeInTheDocument();
	});

	it("renders without a last action date when there is no declaration", () => {
		renderPage({ declarations: [] });
		expect(
			screen.getByRole("heading", { level: 1, name: "Alpha Solutions" }),
		).toBeInTheDocument();
		expect(screen.queryByText(/Dernière action le/)).not.toBeInTheDocument();
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
