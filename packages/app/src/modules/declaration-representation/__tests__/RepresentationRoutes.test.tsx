import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockNotFound } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
	mockNotFound: vi.fn<() => never>().mockImplementation(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
	notFound: mockNotFound,
	redirect: mockRedirect,
}));

vi.mock("~/trpc/server", () => ({
	api: { representationDeclaration: { get: vi.fn() } },
}));

// The client funnel itself is exercised by StepPageClient.test.tsx.
vi.mock("~/modules/declaration-representation", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("~/modules/declaration-representation")
	>()),
	StepPageClient: (props: Record<string, unknown>) => (
		<span data-testid="step-page">{JSON.stringify(props)}</span>
	),
}));

import RepresentationStepPage, {
	generateMetadata,
} from "~/app/declaration-representation/etape/[step]/page";
import RepresentationHomePage from "~/app/declaration-representation/page";
import type { RepresentationDraft } from "~/modules/declaration-representation";
import { getCurrentYear, getReferenceYearFor } from "~/modules/domain";
import { api } from "~/trpc/server";

const CAMPAIGN_YEAR = getCurrentYear();
const YEAR = getReferenceYearFor(CAMPAIGN_YEAR);
const STEP_5_HREF = "/declaration-representation/etape/5";

const getDeclaration = vi.mocked(api.representationDeclaration.get);

function mockFunnelState({
	campaignOpen = true,
	currentStep,
	draft,
}: {
	campaignOpen?: boolean;
	currentStep?: number;
	draft?: unknown;
} = {}) {
	getDeclaration.mockResolvedValue({
		campaignOpen,
		declaration:
			currentStep === undefined ? null : { currentStep, draft: draft ?? null },
	} as never);
}

function stepPageProps() {
	const payload = screen.getByTestId("step-page").textContent ?? "{}";
	return JSON.parse(payload) as {
		step: number;
		year: number;
		campaignYear: number;
		campaignOpen: boolean;
		initialDraft: RepresentationDraft;
	};
}

async function renderStepPage(step: string) {
	return render(
		await RepresentationStepPage({ params: Promise.resolve({ step }) }),
	);
}

beforeEach(() => {
	mockRedirect.mockClear();
	mockNotFound.mockClear();
	getDeclaration.mockReset();
});

describe("RepresentationHomePage", () => {
	it("reads the declaration of the reference year", async () => {
		mockFunnelState();

		render(await RepresentationHomePage());

		expect(getDeclaration).toHaveBeenCalledWith({ year: YEAR });
	});

	it("serves the entry screen when no draft has been started", async () => {
		mockFunnelState();

		render(await RepresentationHomePage());

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("link", { name: "Commencer la démarche" }),
		).toHaveAttribute("href", "/declaration-representation/etape/1");
	});

	it("keeps serving the entry screen when the draft has not reached a step yet", async () => {
		mockFunnelState({ currentStep: 0 });

		render(await RepresentationHomePage());

		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it("resumes an existing draft at its current step (S21)", async () => {
		mockFunnelState({ currentStep: 3 });

		await expect(RepresentationHomePage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(
			"/declaration-representation/etape/3",
		);
	});

	it("sends the user to the recap when the campaign is closed (S23)", async () => {
		mockFunnelState({ campaignOpen: false, currentStep: 2 });

		await expect(RepresentationHomePage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(STEP_5_HREF);
	});
});

describe("RepresentationStepPage — step guard", () => {
	it.each([
		"0",
		"6",
		"-1",
		"+1",
		"1.5",
		"1abc",
		"abc",
	])("404s on the step %s", async (step) => {
		mockFunnelState({ currentStep: 5 });

		await expect(renderStepPage(step)).rejects.toThrow("NEXT_NOT_FOUND");
		expect(getDeclaration).not.toHaveBeenCalled();
	});

	it("normalises a zero-padded step number", async () => {
		mockFunnelState({ currentStep: 1 });

		await renderStepPage("01");

		expect(mockNotFound).not.toHaveBeenCalled();
		expect(stepPageProps().step).toBe(1);
	});
});

describe("RepresentationStepPage — resume guard (S21)", () => {
	it("redirects a step ahead of the draft progress back to the current step", async () => {
		mockFunnelState({ currentStep: 2 });

		await expect(renderStepPage("4")).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(
			"/declaration-representation/etape/2",
		);
	});

	it("opens the first step when the draft has no progress yet", async () => {
		mockFunnelState({ currentStep: 0 });

		await renderStepPage("1");

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(stepPageProps().step).toBe(1);
	});

	it("opens the first step when no draft exists at all", async () => {
		mockFunnelState();

		await renderStepPage("1");

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(stepPageProps().step).toBe(1);
	});

	it("redirects to the first step when a later step is requested without a draft", async () => {
		mockFunnelState();

		await expect(renderStepPage("2")).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(
			"/declaration-representation/etape/1",
		);
	});

	it("lets the user go back to an already completed step", async () => {
		mockFunnelState({ currentStep: 4 });

		await renderStepPage("2");

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(stepPageProps().step).toBe(2);
	});
});

describe("RepresentationStepPage — closed campaign (S23)", () => {
	it("redirects every step of the funnel to the recap", async () => {
		mockFunnelState({ campaignOpen: false, currentStep: 4 });

		await expect(renderStepPage("3")).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(STEP_5_HREF);
	});

	it("serves the recap read-only without applying the resume guard", async () => {
		mockFunnelState({ campaignOpen: false, currentStep: 1 });

		await renderStepPage("5");

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(stepPageProps()).toMatchObject({ step: 5, campaignOpen: false });
	});
});

describe("RepresentationStepPage — draft hydration", () => {
	it("hands the stored draft to the client funnel", async () => {
		const draft = { currentStep: 3, executiveWomenPercent: 60 };
		mockFunnelState({ currentStep: 3, draft });

		await renderStepPage("3");

		expect(stepPageProps()).toMatchObject({
			campaignOpen: true,
			campaignYear: CAMPAIGN_YEAR,
			initialDraft: draft,
			year: YEAR,
		});
	});

	it("falls back to the requested step when the stored draft is unusable", async () => {
		mockFunnelState({ currentStep: 3, draft: { currentStep: 99 } });

		await renderStepPage("3");

		expect(stepPageProps().initialDraft).toEqual({ currentStep: 3 });
	});

	it("falls back to the requested step when no draft is stored", async () => {
		mockFunnelState({ currentStep: 2 });

		await renderStepPage("2");

		expect(stepPageProps().initialDraft).toEqual({ currentStep: 2 });
	});
});

describe("generateMetadata", () => {
	it("titles the page with the step position and name", async () => {
		await expect(
			generateMetadata({ params: Promise.resolve({ step: "2" }) }),
		).resolves.toEqual({
			title: "Étape 2 sur 5 — Écarts de représentation - Cadres dirigeants",
		});
	});

	it("normalises a zero-padded step number in the title", async () => {
		await expect(
			generateMetadata({ params: Promise.resolve({ step: "01" }) }),
		).resolves.toEqual({
			title: "Étape 1 sur 5 — Période de référence",
		});
	});

	it.each([
		"9",
		"0",
		"1.5",
		"+1",
		"abc",
	])("falls back to the funnel title on the step %s", async (step) => {
		await expect(
			generateMetadata({ params: Promise.resolve({ step }) }),
		).resolves.toEqual({
			title: "Démarche des indicateurs de représentation équilibrée",
		});
	});
});
