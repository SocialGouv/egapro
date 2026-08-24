import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockNotFound, mockAuth } = vi.hoisted(() => ({
	mockAuth: vi.fn(),
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

vi.mock("~/trpc/react", () => ({
	api: {
		mail: {
			resendReceipt: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

// The client funnel itself is exercised by StepPageClient.test.tsx.
vi.mock("~/modules/declaration-representation", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("~/modules/declaration-representation")
	>()),
	StepPageClient: (props: Record<string, unknown>) => (
		<span data-testid="step-page">{JSON.stringify(props)}</span>
	),
}));

import RepresentationConfirmationPage from "~/app/declaration-representation/confirmation/page";
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
const DECLARANT_EMAIL = "declarant@example.fr";

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
		isSubmitted: boolean;
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
	mockAuth.mockReset().mockResolvedValue(null);
	getDeclaration.mockReset();
});

describe("RepresentationHomePage", () => {
	it("reads the declaration of the reference year", async () => {
		mockFunnelState();

		render(await RepresentationHomePage());

		expect(getDeclaration).toHaveBeenCalledWith({ year: YEAR });
	});

	it("serves the subjection screen when no draft has been started", async () => {
		mockFunnelState();

		render(await RepresentationHomePage());

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "L'entreprise est-elle concernée ?",
			}),
		).toBeInTheDocument();
		expect(screen.getAllByRole("radio")).toHaveLength(2);
		expect(screen.getByRole("button", { name: "Suivant" })).toBeInTheDocument();
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

	it("rebuilds the recap from submitted columns when the JSON draft was cleared", async () => {
		getDeclaration.mockResolvedValue({
			campaignOpen: true,
			declaration: {
				status: "submitted",
				currentStep: 5,
				draft: null,
				referencePeriodStart: "2025-01-01",
				referencePeriodEnd: "2025-12-31",
				executiveWomenPercent: "60",
				executiveMenPercent: "40",
				notComputableReasonExecutives: null,
				memberWomenPercent: "55",
				memberMenPercent: "45",
				notComputableReasonMembers: null,
				publishDate: "2026-03-01",
				publishUrl: "https://exemple.fr/egalite-professionnelle",
				publishModalities: null,
			},
		} as never);

		await renderStepPage("5");

		expect(stepPageProps()).toMatchObject({
			isSubmitted: true,
			initialDraft: {
				currentStep: 5,
				referencePeriodStart: "2025-01-01",
				referencePeriodEnd: "2025-12-31",
				executivesCount: "two_or_more",
				executiveWomenPercent: 60,
				executiveMenPercent: 40,
				hasManagementBody: true,
				memberWomenPercent: 55,
				memberMenPercent: 45,
				hasWebsite: true,
				publishDate: "2026-03-01",
				publishUrl: "https://exemple.fr/egalite-professionnelle",
			},
		});
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

describe("RepresentationConfirmationPage", () => {
	function mockSubmittedState(status: "draft" | "submitted") {
		getDeclaration.mockResolvedValue({
			campaignOpen: true,
			declaration: { currentStep: 5, draft: null, status },
		} as never);
	}

	it("congratulates the declarant on a submitted declaration (S19)", async () => {
		mockSubmittedState("submitted");
		mockAuth.mockResolvedValue({ user: { email: DECLARANT_EMAIL } });

		render(await RepresentationConfirmationPage());

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(
			screen.getByText(/Votre parcours .* est désormais terminé/),
		).toBeInTheDocument();
		expect(screen.getByText(DECLARANT_EMAIL)).toBeInTheDocument();
	});

	it("falls back on the account address without a session e-mail", async () => {
		mockSubmittedState("submitted");

		render(await RepresentationConfirmationPage());

		expect(screen.getByText("renseignée sur votre compte")).toBeInTheDocument();
	});

	it("hands the reference year to the recap download and the resend button (S20)", async () => {
		mockSubmittedState("submitted");

		render(await RepresentationConfirmationPage());

		expect(
			screen.getByRole("link", {
				name: "Télécharger le récapitulatif de la déclaration",
			}),
		).toHaveAttribute("href", `/api/representation-pdf?year=${YEAR}`);
		expect(
			screen.getByRole("button", { name: "Renvoyer l'accusé de réception" }),
		).toBeEnabled();
	});

	it("sends a declaration still in draft back to the summary", async () => {
		mockSubmittedState("draft");

		await expect(RepresentationConfirmationPage()).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith(STEP_5_HREF);
	});

	it("sends a declarant with no declaration back to the summary", async () => {
		mockFunnelState();

		await expect(RepresentationConfirmationPage()).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith(STEP_5_HREF);
	});
});
