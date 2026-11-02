import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
	"next/navigation",
	async () => await import("./compliancePathChoiceMocks"),
);
vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	async () => await import("./compliancePathChoiceMocks"),
);
vi.mock(
	"~/trpc/react",
	async () => await import("./compliancePathChoiceMocks"),
);

import { markDeclarationTransmissionSuccess } from "~/modules/declaration-remuneration/shared/declarationSuccessFlash";
import {
	draftRef,
	location,
	mockBack,
	mockMutate,
	mockPush,
	mockReplace,
	PAGE_PATH,
	resetCompliancePathChoiceMocks,
} from "./compliancePathChoiceMocks";
import {
	ALL_TITLE,
	COMPLIANCE_TITLE,
	CORRECTIVE_ACTION_HREF,
	CORRECTIVE_ACTION_TITLE,
	compliancePathChoice,
	JOINT_EVALUATION_HREF,
	JOINT_EVALUATION_TITLE,
	NONE_TITLE,
	PARTIAL_TITLE,
	PATH_SCREEN_HREF,
	submitForm,
} from "./compliancePathChoiceTestUtils";

beforeEach(resetCompliancePathChoiceMocks);

describe("CompliancePathChoice — round 1, path screen", () => {
	it("opens the path screen for partially justifiable gaps, focused on its title", async () => {
		markDeclarationTransmissionSuccess();
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(PARTIAL_TITLE));
		submitForm();

		const title = await screen.findByRole("heading", {
			level: 1,
			name: COMPLIANCE_TITLE,
		});
		await waitFor(() => expect(title).toHaveFocus());
		expect(
			screen.getByRole("heading", { level: 2, name: PARTIAL_TITLE }),
		).toBeInTheDocument();
		expect(screen.getByLabelText(CORRECTIVE_ACTION_TITLE)).toHaveAttribute(
			"id",
			"path-corrective",
		);
		expect(screen.getByLabelText(JOINT_EVALUATION_TITLE)).toHaveAttribute(
			"id",
			"path-joint",
		);
		expect(
			screen.getByRole("group", {
				name: "Choix du parcours de mise en conformité",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Votre déclaration a été transmise"),
		).not.toBeInTheDocument();
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("subtitles the path screen with the none qualification", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(NONE_TITLE));
		submitForm();

		expect(
			await screen.findByRole("heading", { level: 2, name: NONE_TITLE }),
		).toBeInTheDocument();
	});

	it("goes back to the qualification screen with the choice kept and the focus on its title", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(PARTIAL_TITLE));
		submitForm();
		fireEvent.click(await screen.findByRole("button", { name: /précédent/i }));

		expect(await screen.findByLabelText(PARTIAL_TITLE)).toBeChecked();
		const title = screen.getByRole("heading", {
			level: 1,
			name: "Déclaration des indicateurs de rémunération 2026",
		});
		await waitFor(() => expect(title).toHaveFocus());
	});

	it("adds the path screen to the browser history", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(PARTIAL_TITLE));
		submitForm();

		await screen.findByLabelText(JOINT_EVALUATION_TITLE);
		expect(mockPush).toHaveBeenCalledWith(PATH_SCREEN_HREF, { scroll: false });
	});

	it("returns to the qualification screen on browser back, with the choice kept and the focus on its title", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(NONE_TITLE));
		submitForm();
		await screen.findByLabelText(JOINT_EVALUATION_TITLE);

		act(() => location.setSearch(""));

		expect(await screen.findByLabelText(NONE_TITLE)).toBeChecked();
		const title = screen.getByRole("heading", {
			level: 1,
			name: "Déclaration des indicateurs de rémunération 2026",
		});
		await waitFor(() => expect(title).toHaveFocus());
	});

	it("steps back through the browser history when Précédent follows Suivant", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(PARTIAL_TITLE));
		submitForm();
		fireEvent.click(await screen.findByRole("button", { name: /précédent/i }));

		expect(mockBack).toHaveBeenCalledTimes(1);
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it("reopens the path screen from its URL with the drafted qualification", async () => {
		location.setSearch("ecran=parcours");
		draftRef.current = {
			gapJustification: "partial",
			path: "joint_evaluation",
		};
		render(compliancePathChoice());

		expect(await screen.findByLabelText(JOINT_EVALUATION_TITLE)).toBeChecked();
		fireEvent.click(screen.getByRole("button", { name: /précédent/i }));

		expect(mockReplace).toHaveBeenCalledWith(PAGE_PATH, { scroll: false });
		expect(mockBack).not.toHaveBeenCalled();
		expect(await screen.findByLabelText(PARTIAL_TITLE)).toBeChecked();
	});

	it.each([
		["no qualification", {}],
		["all gaps justifiable", { gapJustification: "all" }],
	])("falls back to the qualification screen from the path screen URL with %s", (_, draft) => {
		location.setSearch("ecran=parcours");
		draftRef.current = draft;
		render(compliancePathChoice());

		expect(screen.getByLabelText(ALL_TITLE)).toBeInTheDocument();
		expect(
			screen.queryByLabelText(JOINT_EVALUATION_TITLE),
		).not.toBeInTheDocument();
	});

	it("keeps Suivant disabled until a path is picked", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(NONE_TITLE));
		submitForm();

		await screen.findByLabelText(JOINT_EVALUATION_TITLE);
		const next = screen.getByRole("button", { name: /suivant/i });
		expect(next).toBeDisabled();
		fireEvent.click(screen.getByLabelText(JOINT_EVALUATION_TITLE));
		expect(next).not.toBeDisabled();
	});

	it.each([
		["joint_evaluation", JOINT_EVALUATION_TITLE, JOINT_EVALUATION_HREF],
		["corrective_action", CORRECTIVE_ACTION_TITLE, CORRECTIVE_ACTION_HREF],
	] as const)("saves %s and navigates to its first step", async (path, title, href) => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(PARTIAL_TITLE));
		submitForm();
		fireEvent.click(await screen.findByLabelText(title));
		submitForm();

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({
				gapJustification: "partial",
				path,
			});
		});
		expect(mockPush).toHaveBeenCalledWith(href);
	});

	it("pre-checks the saved path on the path screen", async () => {
		render(compliancePathChoice({ initialPath: "corrective_action" }));
		fireEvent.click(screen.getByLabelText(NONE_TITLE));
		submitForm();

		expect(await screen.findByLabelText(CORRECTIVE_ACTION_TITLE)).toBeChecked();
	});

	it("refuses to save a path the qualification does not offer", async () => {
		draftRef.current = { gapJustification: "partial", path: "justify" };
		render(compliancePathChoice());
		submitForm();
		await screen.findByLabelText(JOINT_EVALUATION_TITLE);

		expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
		submitForm();
		expect(mockMutate).not.toHaveBeenCalled();
	});
});
