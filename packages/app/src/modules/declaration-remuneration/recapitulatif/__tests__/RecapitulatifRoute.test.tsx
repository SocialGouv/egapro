import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockResolveAuthorizedSiren } = vi.hoisted(() => ({
	mockAuth: vi.fn(),
	mockResolveAuthorizedSiren: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

vi.mock("~/server/auth/companyAccess", () => ({
	resolveAuthorizedSiren: mockResolveAuthorizedSiren,
}));

// The route reads the transmission date and the declarant through two
// `select … limit` chains; neither row matters to the back link.
vi.mock("~/server/db", () => {
	const query = {
		from: () => query,
		where: () => query,
		orderBy: () => query,
		limit: () => Promise.resolve([]),
	};
	return { db: { select: () => query } };
});

vi.mock("~/server/api/routers/declarationStepMapping", () => ({
	mapToStepData: () => ({}),
}));

// The recap body has its own suite; this one covers the route's chrome.
vi.mock("~/modules/declaration-remuneration/recapitulatif", () => ({
	RecapitulatifPage: () => null,
}));

vi.mock("~/trpc/server", () => ({
	api: {
		company: { get: vi.fn() },
		declaration: { getOrCreate: vi.fn() },
	},
}));

import RecapitulatifRoute from "~/app/declaration-remuneration/recapitulatif/page";
import { api } from "~/trpc/server";

const SIREN = "123456789";

async function renderRoute() {
	render(await RecapitulatifRoute({ searchParams: Promise.resolve({}) }));
}

describe("RecapitulatifRoute", () => {
	beforeEach(() => {
		mockAuth.mockResolvedValue({ user: { id: "user-1" } });
		mockResolveAuthorizedSiren.mockResolvedValue(SIREN);
		vi.mocked(api.company.get).mockResolvedValue({
			name: "Société Démo",
			siren: SIREN,
		} as never);
		vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
			declaration: {
				id: "declaration-1",
				declarantId: "user-1",
				siren: SIREN,
				status: "submitted",
				year: 2027,
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
			},
			hasSubmittedSecondDeclaration: false,
			jobCategories: [],
			employeeCategories: [],
		} as never);
	});

	it("names Mon espace as the destination of the back link, visible text first", async () => {
		await renderRoute();

		const backLink = screen.getByRole("link", { name: "Retour à Mon espace" });
		expect(backLink).toHaveTextContent(/^Retour$/);
		expect(backLink).toHaveAttribute("href", "/mon-espace");
	});
});
