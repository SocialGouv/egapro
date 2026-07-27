import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/navigation")>();
	return { ...actual, notFound: vi.fn(), redirect: vi.fn() };
});

vi.mock("~/server/db/getCampaignDeadlines", async () => {
	const { getDefaultCampaignDeadlines } = await import("~/modules/domain");
	return {
		getCampaignDeadlines: vi
			.fn()
			.mockResolvedValue(getDefaultCampaignDeadlines(2025)),
	};
});

vi.mock("~/trpc/server", () => ({
	api: {
		declaration: { getOrCreate: vi.fn() },
		company: { get: vi.fn() },
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
}));

import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { SecondDeclarationStepPage } from "../SecondDeclarationStepPage";

const COMPLIANCE_PATH_URL = "/declaration-remuneration/parcours-conformite";

function mockPathChoice(firstDeclarationPathChoice: string | null) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: {
			firstDeclarationPathChoice,
			secondDeclarationPathChoice: null,
			siren: "123456789",
			year: 2025,
			updatedAt: new Date("2025-06-15"),
			secondDeclReferencePeriodStart: null,
			secondDeclReferencePeriodEnd: null,
		},
		jobCategories: [],
		employeeCategories: [],
		hasSubmittedSecondDeclaration: false,
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({ hasCse: null } as never);
}

describe("SecondDeclarationStepPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// The funnel writes `secondDeclarationStep`, which the deadline guard reads to
	// grant the later second-declaration deadline, so an unrelated company must
	// not be able to reach it by typing the URL.
	it.each([
		null,
		"justify",
		"joint_evaluation",
	])("redirects to the compliance path when the chosen path is %s", async (pathChoice) => {
		mockPathChoice(pathChoice);

		await SecondDeclarationStepPage({ step: 2 });

		expect(redirect).toHaveBeenCalledWith(COMPLIANCE_PATH_URL);
	});

	it("does not redirect when the corrective-action path was chosen", async () => {
		mockPathChoice("corrective_action");

		await SecondDeclarationStepPage({ step: 2 });

		expect(redirect).not.toHaveBeenCalledWith(COMPLIANCE_PATH_URL);
	});
});
