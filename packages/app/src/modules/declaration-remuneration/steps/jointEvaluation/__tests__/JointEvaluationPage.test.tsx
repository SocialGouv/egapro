import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/navigation")>();
	return { ...actual, redirect: vi.fn() };
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
		declaration: {
			getOrCreate: vi.fn(),
		},
		company: {
			get: vi.fn(),
		},
	},
}));

// JointEvaluationForm is a client component — render it as a stub in unit tests
vi.mock("../JointEvaluationForm", () => ({
	JointEvaluationForm: ({
		jointEvaluationDeadline,
		declarationDate,
	}: {
		jointEvaluationDeadline: string;
		declarationDate: string;
	}) => (
		<div>
			<span data-testid="joint-evaluation-deadline">
				{jointEvaluationDeadline}
			</span>
			<span data-testid="declaration-date">{declarationDate}</span>
		</div>
	),
}));

import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { JointEvaluationPage } from "../JointEvaluationPage";

const DECLARATION_YEAR = 2025;

function mockDeclaration(compliancePath: string, updatedAt: Date | null) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: {
			compliancePath,
			updatedAt,
			siren: "123456789",
			year: DECLARATION_YEAR,
		},
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({ hasCse: null } as never);
}

describe("JointEvaluationPage", () => {
	it("redirects when compliancePath is not joint_evaluation", async () => {
		mockDeclaration("action_plan", null);

		await JointEvaluationPage();

		expect(redirect).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("renders the form with deadline when compliancePath is joint_evaluation", async () => {
		mockDeclaration("joint_evaluation", new Date("2025-06-15"));

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("joint-evaluation-deadline")).toHaveTextContent(
			"2025-08-01",
		);
	});

	it("formats declarationDate from updatedAt when available", async () => {
		mockDeclaration("joint_evaluation", new Date("2025-06-15"));

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("declaration-date")).toHaveTextContent(
			new Date("2025-06-15").toLocaleDateString("fr-FR"),
		);
	});

	it("falls back to today's date when updatedAt is null", async () => {
		mockDeclaration("joint_evaluation", null);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("declaration-date")).toHaveTextContent(
			new Date().toLocaleDateString("fr-FR"),
		);
	});
});
