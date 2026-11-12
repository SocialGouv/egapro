import { render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockAuth } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
	mockAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
	redirect: mockRedirect,
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

vi.mock("~/server/db/getCampaignDeadlines", async () => {
	const { getDefaultCampaignDeadlines } = await import("~/modules/domain");
	return {
		getCampaignDeadlines: vi
			.fn()
			.mockResolvedValue(getDefaultCampaignDeadlines(2026)),
	};
});

vi.mock("~/trpc/server", () => ({
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
	api: {
		company: { get: vi.fn() },
		declaration: { getOrCreate: vi.fn() },
	},
}));

vi.mock("../CompliancePathChoice", () => ({
	CompliancePathChoice: vi.fn(() => <div data-testid="path-choice" />),
}));

import { COMPANY_SIZE_ANNUAL_MIN } from "~/modules/domain";
import { api } from "~/trpc/server";
import { CompliancePathChoice } from "../CompliancePathChoice";
import { CompliancePathPage } from "../CompliancePathPage";

const SIREN = "123456789";
const CSE_OPINION_PATH = "/avis-cse";
const CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";

const HIGH_GAP_CATEGORY = {
	declarationType: "initial",
	annualBaseWomen: "25000",
	annualBaseMen: "35000",
};

const HIGH_GAP_CORRECTION = {
	declarationType: "correction",
	annualBaseWomen: "25000",
	annualBaseMen: "35000",
};

function mockPage({
	gipWorkforce,
	hasCse,
	status = "awaiting_compliance_path_choice",
	employeeCategories = [],
	firstDeclarationPathChoice = null,
	secondDeclarationPathChoice = null,
	hasSubmittedSecondDeclaration = false,
	isFirstDeclarationLocked = false,
	lastTransmission = null,
}: {
	gipWorkforce: number | null;
	hasCse: boolean | null;
	status?: string;
	employeeCategories?: Array<Record<string, unknown>>;
	firstDeclarationPathChoice?: string | null;
	secondDeclarationPathChoice?: string | null;
	hasSubmittedSecondDeclaration?: boolean;
	isFirstDeclarationLocked?: boolean;
	lastTransmission?: string | null;
}) {
	mockAuth.mockResolvedValue({ user: { email: "user@example.fr" } });
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: {
			siren: SIREN,
			year: 2026,
			status,
			firstDeclarationPathChoice,
			secondDeclarationPathChoice,
		},
		employeeCategories,
		hasSubmittedSecondDeclaration,
		hasSubmittedCseOpinion: false,
		hasSubmittedJointEvaluation: false,
		isFirstDeclarationLocked,
		lastTransmission,
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({
		gipWorkforce,
		hasCse,
	} as never);
}

describe("CompliancePathPage — skipping the choice page", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
		vi.mocked(CompliancePathChoice).mockClear();
	});

	it("sends a still-draft declaration back to the last declaration step", async () => {
		mockPage({ gipWorkforce: 250, hasCse: true, status: "draft" });

		await expect(CompliancePathPage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(
			"/declaration-remuneration/etape/6",
		);
	});

	it("skips to the CSE funnel when nothing is left to choose and an opinion is due", async () => {
		mockPage({ gipWorkforce: COMPANY_SIZE_ANNUAL_MIN, hasCse: true });

		await expect(CompliancePathPage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CSE_OPINION_PATH);
	});

	// Same latent loop as the /avis-cse layout: this page also skips straight to
	// the CSE funnel, whose own layout bounces a sub-threshold company back here.
	it("skips to the confirmation page for a company with a CSE under the threshold", async () => {
		mockPage({ gipWorkforce: COMPANY_SIZE_ANNUAL_MIN - 25, hasCse: true });

		await expect(CompliancePathPage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CONFIRMATION_PATH);
		expect(mockRedirect).not.toHaveBeenCalledWith(CSE_OPINION_PATH);
	});

	it.each([
		false,
		null,
	])("skips to the confirmation page when the company owes no opinion (hasCse: %s)", async (hasCse) => {
		mockPage({ gipWorkforce: 250, hasCse });

		await expect(CompliancePathPage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith(CONFIRMATION_PATH);
	});

	it("renders the choice page and forwards the CSE decision when a gap remains", async () => {
		mockPage({
			gipWorkforce: 250,
			hasCse: true,
			employeeCategories: [HIGH_GAP_CATEGORY],
		});

		render(await CompliancePathPage());

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(screen.getByTestId("path-choice")).toBeInTheDocument();
		expect(vi.mocked(CompliancePathChoice).mock.calls[0]?.[0]).toMatchObject({
			cseOpinionRequired: true,
		});
	});

	it("keeps the choice page reviewable once a path has been picked", async () => {
		mockPage({
			gipWorkforce: 250,
			hasCse: true,
			status: "demarche_completed",
			firstDeclarationPathChoice: "justify",
		});

		render(await CompliancePathPage());

		expect(mockRedirect).not.toHaveBeenCalled();
		expect(screen.getByTestId("path-choice")).toBeInTheDocument();
	});
});

// Epic #5128 — a démarche closed on its path choice keeps that choice editable
// until the next campaign; the read-only alert is reserved for a choice a later
// step actually superseded.
describe("CompliancePathPage — re-picking the terminal path choice (#5166)", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
		vi.mocked(CompliancePathChoice).mockClear();
	});

	it("opens the round-1 choice with no read-only alert when it closed the démarche", async () => {
		mockPage({
			gipWorkforce: 250,
			hasCse: false,
			status: "demarche_completed",
			employeeCategories: [HIGH_GAP_CATEGORY],
			firstDeclarationPathChoice: "justify",
			lastTransmission: "path_choice_round_1",
		});

		render(await CompliancePathPage());

		const props = vi.mocked(CompliancePathChoice).mock.calls[0]?.[0];
		expect(props?.readOnlyReason).toBeUndefined();
		expect(props?.declarationModifiable).toBe(true);
	});

	it("opens the round-2 choice, still without the corrective-action option", async () => {
		mockPage({
			gipWorkforce: 250,
			hasCse: false,
			status: "demarche_completed",
			employeeCategories: [HIGH_GAP_CATEGORY, HIGH_GAP_CORRECTION],
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "justify",
			hasSubmittedSecondDeclaration: true,
			lastTransmission: "path_choice_round_2",
		});

		render(await CompliancePathPage());

		const props = vi.mocked(CompliancePathChoice).mock.calls[0]?.[0];
		expect(props?.isSecondRound).toBe(true);
		expect(props?.readOnlyReason).toBeUndefined();
		// The round-2 choice is editable, but the banner about the second
		// declaration is not: that one is closed.
		expect(props?.declarationModifiable).toBe(false);
	});

	it("keeps the page read-only when the second declaration superseded the choice", async () => {
		mockPage({
			gipWorkforce: 250,
			hasCse: false,
			status: "demarche_completed",
			employeeCategories: [HIGH_GAP_CATEGORY],
			firstDeclarationPathChoice: "corrective_action",
			hasSubmittedSecondDeclaration: true,
			isFirstDeclarationLocked: true,
			lastTransmission: "second_declaration",
		});

		render(await CompliancePathPage());

		const props = vi.mocked(CompliancePathChoice).mock.calls[0]?.[0];
		expect(props?.readOnlyReason).toBe("demarche_completed");
		expect(props?.declarationModifiable).toBe(false);
	});
});

// #4282 removed the calendar gate outright, which turns the older invariant
// («close on 1 January N+1, never on 1 July N») into the strictly stronger one
// pinned below: NO date closes the choice, however late. Reintroducing any clock
// read — `selectPathChoiceDeadline`, `campaignDeadlines.pathChoiceDeadline` or a
// bare `new Date()` — would leave typecheck green. These tests are that safety
// net, kept at page level because the page is what reads the clock.
describe("CompliancePathPage — the path-choice deadline never closes the choice", () => {
	beforeEach(() => {
		mockRedirect.mockClear();
		mockAuth.mockReset();
		vi.mocked(CompliancePathChoice).mockClear();
		vi.useFakeTimers({ toFake: ["Date"] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function renderRound1ChoiceAt(now: Date) {
		vi.setSystemTime(now);
		mockPage({
			gipWorkforce: 250,
			hasCse: true,
			employeeCategories: [HIGH_GAP_CATEGORY],
		});

		render(await CompliancePathPage());

		return vi.mocked(CompliancePathChoice).mock.calls[0]?.[0];
	}

	it("leaves the round-1 choice open past 1 July: the deadline nudges, it never closes the action", async () => {
		const props = await renderRound1ChoiceAt(new Date(2026, 8, 15));

		expect(
			props?.readOnlyReason,
			"the round-1 path choice must stay open past 1 July — the displayed deadline is a milestone, not a lock",
		).toBeUndefined();
	});

	it("leaves the choice open past 1 January N+1 too: no date closes it", async () => {
		const props = await renderRound1ChoiceAt(new Date(2027, 0, 15));

		expect(
			props?.readOnlyReason,
			"no calendar date may make the path choice read-only (#4282) — only a business reason can: démarche finalised, or a downstream step already submitted",
		).toBeUndefined();
	});

	it("leaves the choice open years after every campaign deadline", async () => {
		const props = await renderRound1ChoiceAt(new Date(2031, 5, 30));

		expect(props?.readOnlyReason).toBeUndefined();
	});
});
