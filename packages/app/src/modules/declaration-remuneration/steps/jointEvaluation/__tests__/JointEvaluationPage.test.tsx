import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
	const actual = await importOriginal<typeof import("next/navigation")>();
	return { ...actual, redirect: vi.fn() };
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

vi.mock("~/server/getCampaignDeadlines", () => ({
	getCampaignDeadlines: () => ({
		decl1ModificationDeadline: new Date(2025, 5, 1),
		decl1JustificationDeadline: new Date(2025, 5, 1),
		decl1JointEvaluationDeadline: new Date(2025, 7, 1),
		decl2ModificationDeadline: new Date(2025, 11, 1),
		decl2JustificationDeadline: new Date(2025, 11, 1),
		decl2JointEvaluationDeadline: new Date(2026, 1, 1),
	}),
}));

// JointEvaluationForm is a client component — render it as a stub in unit tests
vi.mock("../JointEvaluationForm", () => ({
	JointEvaluationForm: ({
		jointEvaluationDeadline,
		declarationDate,
	}: {
		jointEvaluationDeadline: Date;
		declarationDate: string;
	}) => (
		<div>
			<span data-testid="joint-evaluation-deadline">
				{jointEvaluationDeadline.toISOString()}
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

	it("renders the form with the joint evaluation deadline", async () => {
		mockDeclaration("joint_evaluation", new Date("2025-06-15"));

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("joint-evaluation-deadline")).toBeInTheDocument();
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
