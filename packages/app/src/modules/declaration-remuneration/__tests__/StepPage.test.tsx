import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
	redirect: vi.fn(() => {
		throw new Error("NEXT_REDIRECT");
	}),
}));

vi.mock("~/server/db/getCampaignDeadlines", () => ({
	getCampaignDeadlines: vi.fn(),
}));

vi.mock("~/trpc/server", () => ({
	api: {
		company: { get: vi.fn() },
		declaration: { getOrCreate: vi.fn() },
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
}));

// The barrel pulls client components this suite never renders.
vi.mock("~/modules/declaration-remuneration", async () => {
	const { getEffectiveGipPrefillData } = await vi.importActual<
		typeof import("~/modules/declaration-remuneration/shared/gipToStepData")
	>("~/modules/declaration-remuneration/shared/gipToStepData");
	return {
		getEffectiveGipPrefillData,
		INDICATOR_G_STEP: 6,
		STEP_TITLES: { 1: "Effectifs" },
		StepPageClient: () => null,
		TOTAL_STEPS: 7,
	};
});

import StepPage from "~/app/declaration-remuneration/(with-banner)/etape/[step]/page";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { api } from "~/trpc/server";

const YEAR = 2026;
const SIREN = "123456789";

type PageProps = { modificationClosed: boolean; modificationDeadline?: Date };

function mockPage({
	isFirstDeclarationLocked,
	decl1ModificationDeadline,
}: {
	isFirstDeclarationLocked: boolean;
	decl1ModificationDeadline: Date;
}) {
	vi.mocked(getCampaignDeadlines).mockResolvedValue({
		...getDefaultCampaignDeadlines(YEAR),
		decl1ModificationDeadline,
	});
	vi.mocked(api.company.get).mockResolvedValue({
		gipWorkforce: 200,
		hasCse: true,
	} as never);
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: { siren: SIREN, year: YEAR, status: "submitted" },
		gipPrefillData: null,
		jobCategories: [],
		employeeCategories: [],
		previousYearCategories: null,
		isFirstDeclarationLocked,
	} as never);
}

async function renderStep(step = 2) {
	const element = (await StepPage({
		params: Promise.resolve({ step: String(step) }),
	})) as unknown as { props: { children: { props: PageProps } } };
	return element.props.children.props;
}

describe("StepPage read-only rule", () => {
	beforeEach(() => {
		vi.mocked(getCampaignDeadlines).mockReset();
	});

	it("opens a superseded first declaration read-only with the banner, whatever the deadlines", async () => {
		const farFuture = new Date("2999-01-01T00:00:00Z");
		mockPage({
			isFirstDeclarationLocked: true,
			decl1ModificationDeadline: farFuture,
		});

		const props = await renderStep();

		expect(props.modificationClosed).toBe(true);
		expect(props.modificationDeadline).toEqual(farFuture);
	});

	it("opens a non-superseded first declaration writable without banner, even with every deadline past", async () => {
		mockPage({
			isFirstDeclarationLocked: false,
			decl1ModificationDeadline: new Date("2020-01-01T00:00:00Z"),
		});

		const props = await renderStep();

		expect(props.modificationClosed).toBe(false);
		expect(props.modificationDeadline).toBeUndefined();
		expect(getCampaignDeadlines).not.toHaveBeenCalled();
	});
});
