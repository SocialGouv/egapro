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
		jointEvaluation: {
			getFile: vi.fn(),
		},
	},
}));

// JointEvaluationForm is a client component — render it as a stub in unit tests
vi.mock("../JointEvaluationForm", () => ({
	JointEvaluationForm: ({
		jointEvaluationDeadline,
		existingFile,
		jointEvaluationRound,
		writable,
	}: {
		jointEvaluationDeadline: Date;
		existingFile: { fileName: string } | null;
		jointEvaluationRound: 1 | 2;
		writable: boolean;
	}) => (
		<div>
			<span data-testid="joint-evaluation-deadline">
				{jointEvaluationDeadline.toLocaleDateString("fr-FR")}
			</span>
			<span data-testid="existing-file">
				{existingFile?.fileName ?? "none"}
			</span>
			<span data-testid="joint-evaluation-round">{jointEvaluationRound}</span>
			<span data-testid="joint-evaluation-writable">
				{writable ? "open" : "closed"}
			</span>
		</div>
	),
}));

import { redirect } from "next/navigation";
import {
	type DeclarationFsmStatus,
	getDefaultCampaignDeadlines,
	type LastTransmission,
} from "~/modules/domain";
import { api } from "~/trpc/server";
import { JointEvaluationPage } from "../JointEvaluationPage";

const DECLARATION_YEAR = 2025;
const DEFAULT_DEADLINES = getDefaultCampaignDeadlines(DECLARATION_YEAR);

function mockDeclaration(
	pathChoices: {
		firstDeclarationPathChoice?: string | null;
		secondDeclarationPathChoice?: string | null;
	},
	updatedAt: Date | null,
	transmission: {
		status?: DeclarationFsmStatus;
		lastTransmission?: LastTransmission | null;
	} = {},
) {
	vi.mocked(api.declaration.getOrCreate).mockResolvedValue({
		declaration: {
			firstDeclarationPathChoice:
				pathChoices.firstDeclarationPathChoice ?? null,
			secondDeclarationPathChoice:
				pathChoices.secondDeclarationPathChoice ?? null,
			status: transmission.status ?? "joint_evaluation_chosen",
			updatedAt,
			siren: "123456789",
			year: DECLARATION_YEAR,
		},
		lastTransmission: transmission.lastTransmission ?? null,
	} as never);
	vi.mocked(api.company.get).mockResolvedValue({ hasCse: null } as never);
	vi.mocked(api.jointEvaluation.getFile).mockResolvedValue(null as never);
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
			DEFAULT_DEADLINES.decl1JointEvaluationDeadline.toLocaleDateString(
				"fr-FR",
			),
		);
	});

	it("serves the round-2 deadline, never the round-1 one, on the revised round", async () => {
		mockDeclaration(
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			},
			new Date("2025-06-15"),
		);

		const page = await JointEvaluationPage();
		render(page);

		const deadline = screen.getByTestId("joint-evaluation-deadline");
		expect(deadline).toHaveTextContent(
			DEFAULT_DEADLINES.decl2JointEvaluationDeadline.toLocaleDateString(
				"fr-FR",
			),
		);
		expect(deadline).not.toHaveTextContent(
			DEFAULT_DEADLINES.decl1JointEvaluationDeadline.toLocaleDateString(
				"fr-FR",
			),
		);
	});

	it("tells the form which transmission round it is completing", async () => {
		mockDeclaration({ firstDeclarationPathChoice: "joint_evaluation" }, null);
		const first = render(await JointEvaluationPage());
		expect(screen.getByTestId("joint-evaluation-round")).toHaveTextContent("1");
		first.unmount();

		mockDeclaration(
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			},
			null,
		);
		render(await JointEvaluationPage());
		expect(screen.getByTestId("joint-evaluation-round")).toHaveTextContent("2");
	});

	it("never serves the CSE opinion deadline, which closes a later step", async () => {
		mockDeclaration(
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
			},
			new Date("2025-06-15"),
		);

		const page = await JointEvaluationPage();
		render(page);

		expect(
			screen.getByTestId("joint-evaluation-deadline"),
		).not.toHaveTextContent(
			DEFAULT_DEADLINES.decl2CseOpinionDeadline.toLocaleDateString("fr-FR"),
		);
	});

	it("passes the already-deposited report down to the form (#4222)", async () => {
		mockDeclaration({ firstDeclarationPathChoice: "joint_evaluation" }, null);
		vi.mocked(api.jointEvaluation.getFile).mockResolvedValue({
			id: "8f14e45f-ea4c-4f0b-9c1d-7a2b3c4d5e6f",
			fileName: "rapport-evaluation-conjointe.pdf",
			uploadedAt: new Date("2025-06-20"),
		} as never);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("existing-file")).toHaveTextContent(
			"rapport-evaluation-conjointe.pdf",
		);
	});

	it("passes no report down when none has been deposited yet", async () => {
		mockDeclaration({ firstDeclarationPathChoice: "joint_evaluation" }, null);

		const page = await JointEvaluationPage();
		render(page);

		expect(screen.getByTestId("existing-file")).toHaveTextContent("none");
	});

	it.each<{
		status: DeclarationFsmStatus;
		lastTransmission: LastTransmission | null;
		expected: string;
	}>([
		{
			status: "joint_evaluation_chosen",
			lastTransmission: "path_choice_round_1",
			expected: "open",
		},
		{
			status: "awaiting_cse_opinion",
			lastTransmission: "joint_evaluation",
			expected: "open",
		},
		{
			status: "awaiting_cse_opinion",
			lastTransmission: "path_choice_round_2",
			expected: "closed",
		},
		{
			status: "awaiting_cse_opinion",
			lastTransmission: "cse_opinion",
			expected: "closed",
		},
	])("tells the form whether the report is writable ($status / $lastTransmission)", async ({
		status,
		lastTransmission,
		expected,
	}) => {
		mockDeclaration({ firstDeclarationPathChoice: "joint_evaluation" }, null, {
			status,
			lastTransmission,
		});

		render(await JointEvaluationPage());

		expect(screen.getByTestId("joint-evaluation-writable")).toHaveTextContent(
			expected,
		);
	});
});
