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
		jointEvaluationDeadline: Date;
		declarationDate: string;
	}) => (
		<div>
			<span data-testid="joint-evaluation-deadline">
				{jointEvaluationDeadline.toLocaleDateString("fr-FR")}
			</span>
			<span data-testid="declaration-date">{declarationDate}</span>
		</div>
	),
}));

import { redirect } from "next/navigation";
import { formatLongDate } from "~/modules/domain";
import { api } from "~/trpc/server";
import { JointEvaluationPage } from "../JointEvaluationPage";

const DECLARATION_YEAR = 2025;

function mockDeclaration(
	pathChoices: {
		firstDeclarationPathChoice?: string | null;
		secondDeclarationPathChoice?: string | null;
	},
	updatedAt: Date | null,
) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: {
			firstDeclarationPathChoice:
				pathChoices.firstDeclarationPathChoice ?? null,
			secondDeclarationPathChoice:
				pathChoices.secondDeclarationPathChoice ?? null,
			updatedAt,
			siren: "123456789",
			year: DECLARATION_YEAR,
		},
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({ hasCse: null } as never);
}

describe("JointEvaluationPage", () => {
	it("redirects when neither first nor second path choice is joint_evaluation", async () => {
		mockDeclaration({ firstDeclarationPathChoice: "corrective_action" }, null);

		await JointEvaluationPage();

		expect(redirect).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("renders the form when firstDeclarationPathChoice is joint_evaluation (initial round)", async () => {
		mockDeclaration(
			{ firstDeclarationPathChoice: "joint_evaluation" },
			new Date("2025-06-15"),
		);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("joint-evaluation-deadline")).toHaveTextContent(
			new Date("2025-08-01T00:00:00").toLocaleDateString("fr-FR"),
		);
	});

	it("renders the form when secondDeclarationPathChoice is joint_evaluation (revised round)", async () => {
		mockDeclaration(
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			},
			new Date("2025-06-15"),
		);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("joint-evaluation-deadline")).toHaveTextContent(
			new Date("2025-08-01T00:00:00").toLocaleDateString("fr-FR"),
		);
	});

	it("formats declarationDate from updatedAt when available", async () => {
		mockDeclaration(
			{ firstDeclarationPathChoice: "joint_evaluation" },
			new Date("2025-06-15"),
		);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("declaration-date")).toHaveTextContent(
			formatLongDate(new Date("2025-06-15")),
		);
	});

	it("falls back to today's date when updatedAt is null", async () => {
		mockDeclaration({ firstDeclarationPathChoice: "joint_evaluation" }, null);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("declaration-date")).toHaveTextContent(
			formatLongDate(new Date()),
		);
	});
});
