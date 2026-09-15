import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetActiveLock } = vi.hoisted(() => ({
	mockGetActiveLock: vi
		.fn()
		.mockResolvedValue({ lockedByOther: false, holder: null }),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockReturnValue({
					mutate: vi.fn(),
					isPending: false,
				}),
			},
		},
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

vi.mock("~/server/db/getCampaignDeadlines", async () => {
	const { getDefaultCampaignDeadlines } = await import("~/modules/domain");
	return {
		getCampaignDeadlines: vi
			.fn()
			.mockResolvedValue(getDefaultCampaignDeadlines(2026)),
	};
});

vi.mock("~/server/db/getRepresentationCampaign", async () => {
	const { getDefaultRepresentationCampaign } = await import("~/modules/domain");
	return {
		getRepresentationCampaign: vi
			.fn()
			.mockResolvedValue(getDefaultRepresentationCampaign(2026)),
	};
});

vi.mock("~/trpc/server", () => ({
	api: {
		company: {
			getWithDeclarations: vi.fn().mockResolvedValue({
				company: {
					siren: "123456789",
					name: "Test Company",
					address: "1 rue de Test",
					nafCode: "6201Z",
					countryCode: null,
					countryLabel: "FRANCE",
					workforce: 150,
					hasCse: true,
				},
				declarations: [
					{
						type: "remuneration",
						siren: "123456789",
						year: 2026,
						status: "to_complete",
						fsmStatus: null,
						currentStep: 1,
						updatedAt: null,
						firstDeclarationPathChoice: null,
						secondDeclarationPathChoice: null,
						hasSubmittedSecondDeclaration: false,

						hasSubmittedCseOpinion: false,
						cseRequired: false,
						hasJointEvaluationFile: false,
						hasPrefillData: false,
					},
				],
			}),
		},
		declarationLock: {
			getActiveLockForCurrentDeclaration: mockGetActiveLock,
		},
	},
	HydrateClient: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

import { MonEspacePage } from "../MonEspacePage";

describe("MonEspacePage", () => {
	beforeEach(() => {
		mockGetActiveLock.mockResolvedValue({ lockedByOther: false, holder: null });
	});

	it("renders MissingSiret without redirecting when siret is null", async () => {
		const page = await MonEspacePage({ siret: null, userPhone: null });
		const { container } = render(page);
		expect(
			screen.getByRole("heading", { level: 1, name: "SIRET manquant" }),
		).toBeInTheDocument();
		expect(container.querySelectorAll('main[id="content"]')).toHaveLength(1);
	});

	it("renders MissingSiret without redirecting when siret is too short", async () => {
		const page = await MonEspacePage({ siret: "1234", userPhone: null });
		const { container } = render(page);
		expect(
			screen.getByRole("heading", { level: 1, name: "SIRET manquant" }),
		).toBeInTheDocument();
		expect(container.querySelectorAll('main[id="content"]')).toHaveLength(1);
	});

	it("renders company declarations for valid siret", async () => {
		const page = await MonEspacePage({
			siret: "12345678901234",
			userPhone: "0612345678",
		});
		render(page);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
		expect(
			screen.getByRole("heading", { level: 1, name: "Test Company" }),
		).toBeInTheDocument();
	});

	it("passes userPhone to CompanyDeclarationsPage", async () => {
		const page = await MonEspacePage({
			siret: "12345678901234",
			userPhone: null,
		});
		render(page);
		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
	});

	it("does not render the lock alert when the declaration is unlocked", async () => {
		const page = await MonEspacePage({
			siret: "12345678901234",
			userPhone: "0612345678",
		});
		const { container } = render(page);
		expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
	});

	it("forwards the lock state when another co-declarant holds the lock", async () => {
		mockGetActiveLock.mockResolvedValueOnce({
			lockedByOther: true,
			holder: {
				firstName: "Alice",
				lastName: "Martin",
				email: "alice.martin@example.fr",
			},
		});
		const page = await MonEspacePage({
			siret: "12345678901234",
			userPhone: "0612345678",
		});
		const { container } = render(page);
		const alert = container.querySelector('[role="alert"]');
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveTextContent("Déclaration en cours de modification");
		expect(alert).toHaveTextContent("Alice Martin");
	});
});
