import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockNotFound, mockRedirect, mockResolveAuthorizedSiren } =
	vi.hoisted(() => ({
		mockAuth: vi.fn(),
		mockNotFound: vi.fn<() => never>().mockImplementation(() => {
			throw new Error("NEXT_NOT_FOUND");
		}),
		mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
			throw new Error("NEXT_REDIRECT");
		}),
		mockResolveAuthorizedSiren: vi.fn(),
	}));

vi.mock("next/navigation", () => ({
	notFound: mockNotFound,
	redirect: mockRedirect,
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/server/auth/companyAccess", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/server/auth/companyAccess")>()),
	resolveAuthorizedSiren: mockResolveAuthorizedSiren,
}));

vi.mock("~/trpc/server", () => ({
	api: {
		representationDeclaration: {
			get: vi.fn(),
			getWorkforceHistory: vi.fn(),
		},
		company: { get: vi.fn() },
		profile: { get: vi.fn() },
	},
}));

import RepresentationConsultationPage, {
	generateMetadata,
} from "~/app/mon-espace/representation/[year]/page";
import { api } from "~/trpc/server";

const SIREN = "123456789";
const CAMPAIGN_YEAR = 2027;
const REFERENCE_YEAR = 2026;

const COMPANY = {
	name: "Société Démo",
	siren: SIREN,
	nafCode: "6201Z",
	nafLabel: "Programmation informatique",
	address: "1 rue Test, 75001 Paris",
	countryCode: null,
	countryLabel: null,
	departmentLabel: "Paris",
	gipWorkforce: 1200,
	hasCse: true,
};

const DECLARANT = {
	firstName: "Jeanne",
	lastName: "Dupont",
	email: "jeanne.dupont@example.fr",
	phone: "0601020304",
};

const getDeclaration = vi.mocked(api.representationDeclaration.get);
const getCompany = vi.mocked(api.company.get);
const getProfile = vi.mocked(api.profile.get);
const getWorkforceHistory = vi.mocked(
	api.representationDeclaration.getWorkforceHistory,
);

function mockDeclaration(
	overrides: Record<string, unknown> | null = { status: "submitted" },
) {
	getDeclaration.mockResolvedValue({
		declaration: overrides === null ? null : { currentStep: 5, ...overrides },
		campaignOpen: true,
		declarationDeadline: new Date("2027-03-01T00:00:00.000Z"),
	} as never);
}

async function renderPage(year: string) {
	return render(
		await RepresentationConsultationPage({ params: Promise.resolve({ year }) }),
	);
}

beforeEach(() => {
	mockAuth.mockReset().mockResolvedValue({ user: { id: "u1" } });
	mockResolveAuthorizedSiren.mockReset().mockResolvedValue(SIREN);
	mockNotFound.mockClear();
	mockRedirect.mockClear();
	getDeclaration.mockReset();
	getCompany.mockReset().mockResolvedValue(COMPANY as never);
	getProfile.mockReset().mockResolvedValue(DECLARANT as never);
	getWorkforceHistory.mockReset().mockResolvedValue([]);
	mockDeclaration();
});

describe("RepresentationConsultationPage — S5 accès refusé", () => {
	it("redirects to /login without a session", async () => {
		mockAuth.mockResolvedValue(null);

		await expect(renderPage(String(CAMPAIGN_YEAR))).rejects.toThrow(
			"NEXT_REDIRECT",
		);
		expect(mockRedirect).toHaveBeenCalledWith("/login");
	});

	it("404s when the session has no authorized SIREN", async () => {
		mockResolveAuthorizedSiren.mockResolvedValue(null);

		await expect(renderPage(String(CAMPAIGN_YEAR))).rejects.toThrow(
			"NEXT_NOT_FOUND",
		);
	});

	it.each([
		"abc",
		"2027abc",
		"-2027",
		"2027.5",
	])("404s on a non-numeric year segment %s", async (year) => {
		await expect(renderPage(year)).rejects.toThrow("NEXT_NOT_FOUND");
		expect(getDeclaration).not.toHaveBeenCalled();
	});

	it("404s when the reference year falls outside the accepted bounds", async () => {
		await expect(renderPage("2000")).rejects.toThrow("NEXT_NOT_FOUND");
		expect(getDeclaration).not.toHaveBeenCalled();
	});

	it("404s when no declaration exists for the reference year", async () => {
		mockDeclaration(null);

		await expect(renderPage(String(CAMPAIGN_YEAR))).rejects.toThrow(
			"NEXT_NOT_FOUND",
		);
	});

	it("404s on a draft declaration", async () => {
		mockDeclaration({ status: "draft" });

		await expect(renderPage(String(CAMPAIGN_YEAR))).rejects.toThrow(
			"NEXT_NOT_FOUND",
		);
	});

	it("404s on a not-subject declaration", async () => {
		mockDeclaration({ status: "not_subject" });

		await expect(renderPage(String(CAMPAIGN_YEAR))).rejects.toThrow(
			"NEXT_NOT_FOUND",
		);
	});
});

describe("RepresentationConsultationPage — S6 le SIREN vient de la session", () => {
	it("reads the declaration of the reference year for the session's SIREN alone", async () => {
		await renderPage(String(CAMPAIGN_YEAR));

		expect(getDeclaration).toHaveBeenCalledWith({ year: REFERENCE_YEAR });
		expect(getCompany).toHaveBeenCalledWith({ siren: SIREN });
		expect(getWorkforceHistory).toHaveBeenCalledWith({
			campaignYear: CAMPAIGN_YEAR,
		});
	});

	it("renders the consultation page for a submitted declaration", async () => {
		await renderPage(String(CAMPAIGN_YEAR));

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: `Démarche des indicateurs de représentation ${CAMPAIGN_YEAR}`,
			}),
		).toBeInTheDocument();
	});

	it("picks the workforce history entry matching the campaign year", async () => {
		getWorkforceHistory.mockResolvedValue([
			{ year: CAMPAIGN_YEAR - 1, workforceEma: 999 },
			{ year: CAMPAIGN_YEAR, workforceEma: 1500 },
		]);

		await renderPage(String(CAMPAIGN_YEAR));

		expect(
			screen.getByText(`Effectif annuel moyen en ${REFERENCE_YEAR}`)
				.nextElementSibling,
		).toHaveTextContent("1 500");
	});
});

describe("generateMetadata", () => {
	it("titles the page with the campaign year", async () => {
		await expect(
			generateMetadata({ params: Promise.resolve({ year: "2027" }) }),
		).resolves.toEqual({
			title: "Démarche des indicateurs de représentation 2027",
		});
	});

	it("falls back to a generic title on an invalid year segment", async () => {
		await expect(
			generateMetadata({ params: Promise.resolve({ year: "abc" }) }),
		).resolves.toEqual({
			title: "Démarche des indicateurs de représentation",
		});
	});
});
