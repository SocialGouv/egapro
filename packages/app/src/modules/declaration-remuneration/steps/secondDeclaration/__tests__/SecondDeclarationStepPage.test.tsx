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
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";
import { SecondDeclarationStepPage } from "../SecondDeclarationStepPage";

const COMPLIANCE_PATH_URL = "/declaration-remuneration/parcours-conformite";

function mockPathChoice(
	firstDeclarationPathChoice: string | null,
	hasSubmittedSecondDeclaration = false,
	lastTransmission: string | null = null,
) {
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
		hasSubmittedSecondDeclaration,
		lastTransmission,
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({ hasCse: null } as never);
}

// The page only assembles elements: HydrateClient is mocked as a passthrough,
// so the form it wraps is a plain element whose props we can read without
// booting the client funnel.
function findProp(node: unknown, prop: string): unknown {
	if (Array.isArray(node)) {
		for (const child of node) {
			const found = findProp(child, prop);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	if (node === null || typeof node !== "object") return undefined;
	const element = node as { props?: Record<string, unknown> };
	if (element.props && prop in element.props) return element.props[prop];
	return findProp(element.props?.children, prop);
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

	it.each([
		1, 2,
	])("renders step %s of a submitted second declaration past its deadline, without redirecting", async (step) => {
		mockPathChoice("corrective_action", true);
		vi.mocked(getCampaignDeadlines).mockResolvedValue({
			...getDefaultCampaignDeadlines(2025),
			decl2ModificationDeadline: new Date("2020-01-01T00:00:00Z"),
		});

		await expect(SecondDeclarationStepPage({ step })).resolves.toBeDefined();

		expect(redirect).not.toHaveBeenCalled();
	});

	it.each([
		2, 3,
	])("forwards the step %s the démarche's last transmission (#5167)", async (step) => {
		mockPathChoice("corrective_action", true, "second_declaration");

		const element = await SecondDeclarationStepPage({ step });

		expect(findProp(element, "lastTransmission")).toBe("second_declaration");
	});
});
