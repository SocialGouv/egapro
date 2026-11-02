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
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import {
	draftRef,
	mockMutate,
	mockPush,
	mockSetField,
	mutationErrorRef,
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
	submitForm,
} from "./compliancePathChoiceTestUtils";

beforeEach(resetCompliancePathChoiceMocks);

// The save mutation had no error surface at all, so a server rejection (a
// CONFLICT 409 from the lock) left the button inert with zero feedback.
describe("CompliancePathChoice — mutation error surface", () => {
	it("renders the rejection as an error alert", () => {
		mutationErrorRef.current = {
			message: "Déclaration verrouillée par un autre utilisateur.",
		};
		const { container } = render(compliancePathChoice());

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(
			"Déclaration verrouillée par un autre utilisateur.",
		);
		expect(container.querySelector(".fr-alert--error")).toBeInTheDocument();
	});

	it("renders no error alert while the mutation has not failed", () => {
		const { container } = render(compliancePathChoice());

		expect(container.querySelector(".fr-alert--error")).not.toBeInTheDocument();
	});
});

describe("CompliancePathChoice", () => {
	it("renders the page title and success banner after a declaration transmission", () => {
		markDeclarationTransmissionSuccess();
		render(compliancePathChoice());
		expect(
			screen.getByText(/Déclaration des indicateurs de rémunération/),
		).toBeInTheDocument();
		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("hides the success banner when the page is reached without a transmission", () => {
		render(compliancePathChoice());
		expect(
			screen.queryByText("Votre déclaration a été transmise"),
		).not.toBeInTheDocument();
	});

	it("shows the success banner only once per transmission", () => {
		markDeclarationTransmissionSuccess();
		const { unmount } = render(compliancePathChoice());
		unmount();
		render(compliancePathChoice());
		expect(
			screen.queryByText("Votre déclaration a été transmise"),
		).not.toBeInTheDocument();
	});

	it("names the read-only fieldset with a screen-reader-only legend (RGAA 11.6/11.7)", () => {
		render(compliancePathChoice());
		expect(
			screen.getByRole("group", { name: "Choix du parcours de conformité" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("group", {
				name: "Justification des écarts de rémunération ≥ 5 %",
			}),
		).toBeInTheDocument();
	});

	it("tells a modifiable declaration it stays modifiable until a later transmission, with no date", () => {
		markDeclarationTransmissionSuccess();
		render(compliancePathChoice());
		expect(
			screen.getByText(/Vous pouvez modifier votre déclaration jusqu'à ce que/),
		).toBeInTheDocument();
	});

	it("drops the modification sentence when the declaration is no longer modifiable", () => {
		markDeclarationTransmissionSuccess();
		render(compliancePathChoice({ declarationModifiable: false }));
		expect(screen.queryByText(/Vous pouvez modifier/)).not.toBeInTheDocument();
		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("renders the email in the success banner", () => {
		markDeclarationTransmissionSuccess();
		render(compliancePathChoice({ email: "john@company.fr" }));
		expect(screen.getByText("john@company.fr")).toBeInTheDocument();
	});

	it("neutralises the top margin of the form actions (issue #4141)", () => {
		render(compliancePathChoice());
		expect(
			screen.getByRole("button", { name: /suivant/i }).parentElement
				?.parentElement,
		).toHaveClass("fr-mt-0");
	});

	it.each([
		false,
		true,
	])("renders no previous control on the qualification screen (isSecondRound: %s)", (isSecondRound) => {
		render(compliancePathChoice({ isSecondRound }));
		expect(
			screen.queryByRole("link", { name: /précédent/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /précédent/i }),
		).not.toBeInTheDocument();
	});
});

describe("CompliancePathChoice — round 1, qualification screen", () => {
	it("nests the compliance section under the declaration title", () => {
		render(compliancePathChoice());
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Déclaration des indicateurs de rémunération 2026",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 2, name: COMPLIANCE_TITLE }),
		).toBeInTheDocument();
		expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
	});

	it("asks whether the gaps can be justified, with the choice deadline and the criteria link", () => {
		render(compliancePathChoice());
		expect(
			screen.getByText(
				"Des écarts ≥ 5 % ont été constatés, indiquez si ces écarts peuvent être justifiés par des critères objectifs et non fondés sur le sexe.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Date limite pour choisir l'un des parcours ci-dessous.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("1ᵉʳ juillet 2026")).toBeInTheDocument();
		expect(screen.queryByText("1ᵉʳ janvier 2027")).not.toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /Qu'entend-on par critères objectifs et non fondés sur le sexe \?/,
			}),
		).toHaveAttribute("target", "_blank");
		expect(screen.queryByText(/non sexistes/)).not.toBeInTheDocument();
	});

	it("offers the three qualifications and no path yet", () => {
		render(compliancePathChoice());
		expect(screen.getByLabelText(ALL_TITLE)).toBeInTheDocument();
		expect(screen.getByLabelText(PARTIAL_TITLE)).toBeInTheDocument();
		expect(screen.getByLabelText(NONE_TITLE)).toBeInTheDocument();
		expect(
			screen.queryByLabelText(CORRECTIVE_ACTION_TITLE),
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText(JOINT_EVALUATION_TITLE),
		).not.toBeInTheDocument();
	});

	it("keeps Suivant disabled until a qualification is picked", () => {
		render(compliancePathChoice());
		const next = screen.getByRole("button", { name: /suivant/i });
		expect(next).toBeDisabled();
		fireEvent.click(screen.getByLabelText(NONE_TITLE));
		expect(next).not.toBeDisabled();
	});

	it("does not submit when no qualification is picked", () => {
		render(compliancePathChoice());
		submitForm();
		expect(mockMutate).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("saves justify straight away when all gaps are justifiable", async () => {
		render(compliancePathChoice());
		fireEvent.click(screen.getByLabelText(ALL_TITLE));
		submitForm();

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "justify" });
		});
		expect(mockPush).toHaveBeenCalledWith("/avis-cse");
	});

	it("saves justify and lands on the confirmation page when no CSE opinion is due", async () => {
		render(compliancePathChoice({ cseOpinionRequired: false }));
		fireEvent.click(screen.getByLabelText(ALL_TITLE));
		submitForm();

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "justify" });
		});
		expect(mockPush).toHaveBeenCalledWith(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("shows no CSE step and keeps the closing sentence when no CSE opinion is due", () => {
		render(compliancePathChoice({ cseOpinionRequired: false }));
		expect(screen.queryByText(/votre CSE/)).not.toBeInTheDocument();
		expect(
			screen.getByText(/En l'absence de CSE, aucun avis n'est à transmettre/),
		).toBeInTheDocument();
	});

	it("pre-checks all justifiable when justify was already saved", () => {
		render(compliancePathChoice({ initialPath: "justify" }));
		expect(screen.getByLabelText(ALL_TITLE)).toBeChecked();
	});

	it.each([
		"corrective_action",
		"joint_evaluation",
	] as const)("pre-checks no qualification when %s was saved, the partial/none split being unknown", (initialPath) => {
		render(compliancePathChoice({ initialPath }));
		for (const title of [ALL_TITLE, PARTIAL_TITLE, NONE_TITLE]) {
			expect(screen.getByLabelText(title)).not.toBeChecked();
		}
	});
});

describe("CompliancePathChoice — round 2", () => {
	it("titles the single screen with the compliance title and asks again", () => {
		render(compliancePathChoice({ isSecondRound: true }));
		expect(
			screen.getByRole("heading", { level: 1, name: COMPLIANCE_TITLE }),
		).toBeInTheDocument();
		expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
		expect(
			screen.getByText(
				"Des écarts ≥ 5 % ont de nouveau été constatés, indiquez si ces écarts peuvent être justifiés par des critères objectifs et non fondés sur le sexe.",
			),
		).toBeInTheDocument();
		expect(screen.getByText("1ᵉʳ janvier 2027")).toBeInTheDocument();
		expect(screen.queryByText("1ᵉʳ juillet 2026")).not.toBeInTheDocument();
	});

	it("keeps the second declaration success banner", () => {
		markDeclarationTransmissionSuccess();
		render(compliancePathChoice({ isSecondRound: true }));
		expect(
			screen.getByText("Votre seconde déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it.each([
		NONE_TITLE,
		PARTIAL_TITLE,
	])("saves joint_evaluation straight away for %s", async (title) => {
		render(compliancePathChoice({ isSecondRound: true }));
		fireEvent.click(screen.getByLabelText(title));
		submitForm();

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "joint_evaluation" });
		});
		expect(mockPush).toHaveBeenCalledWith(JOINT_EVALUATION_HREF);
		expect(
			screen.queryByLabelText(CORRECTIVE_ACTION_TITLE),
		).not.toBeInTheDocument();
	});

	it("saves justify for all justifiable gaps", async () => {
		render(compliancePathChoice({ isSecondRound: true }));
		fireEvent.click(screen.getByLabelText(ALL_TITLE));
		submitForm();

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ path: "justify" });
		});
	});

	it("never offers corrective actions", () => {
		render(compliancePathChoice({ isSecondRound: true }));
		expect(
			screen.queryByText(/actions correctives et une seconde déclaration/),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/Soit /)).not.toBeInTheDocument();
	});
});

describe("CompliancePathChoice — draft autosave", () => {
	it("hydrates the qualification and the path from a persisted draft", async () => {
		draftRef.current = {
			gapJustification: "partial",
			path: "joint_evaluation",
		};
		render(compliancePathChoice());

		expect(screen.getByLabelText(PARTIAL_TITLE)).toBeChecked();
		submitForm();
		expect(await screen.findByLabelText(JOINT_EVALUATION_TITLE)).toBeChecked();
	});

	it("always reopens on the qualification screen", () => {
		draftRef.current = {
			gapJustification: "none",
			path: "corrective_action",
		};
		render(compliancePathChoice());

		expect(screen.getByLabelText(NONE_TITLE)).toBeChecked();
		expect(
			screen.queryByLabelText(CORRECTIVE_ACTION_TITLE),
		).not.toBeInTheDocument();
	});

	it("saves the qualification and the path while the lock is inactive", async () => {
		render(compliancePathChoice());

		fireEvent.click(screen.getByLabelText(NONE_TITLE));
		await waitFor(() => {
			expect(mockSetField).toHaveBeenCalledWith({
				gapJustification: "none",
				path: undefined,
			});
		});

		submitForm();
		fireEvent.click(await screen.findByLabelText(CORRECTIVE_ACTION_TITLE));
		await waitFor(() => {
			expect(mockSetField).toHaveBeenCalledWith({
				gapJustification: "none",
				path: "corrective_action",
			});
		});
	});

	it("does not save a draft when the declaration is locked read-only", () => {
		render(<LockProvider isReadOnly>{compliancePathChoice()}</LockProvider>);

		const radio = screen.getByLabelText(NONE_TITLE);
		fireEvent.click(radio);
		fireEvent.change(radio, { target: { checked: true } });

		expect(mockSetField).not.toHaveBeenCalled();
	});

	it("disables each control while keeping the fieldset enabled when the declaration is locked read-only", () => {
		const { container } = render(
			<LockProvider isReadOnly>{compliancePathChoice()}</LockProvider>,
		);

		expect(container.querySelector("fieldset")).not.toBeDisabled();
		expect(screen.getByLabelText(NONE_TITLE)).toBeDisabled();
		expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
	});
});

describe("CompliancePathChoice under a third-party lock", () => {
	it("disables the radios without showing a read-only alert", () => {
		const { container } = render(
			<LockProvider isReadOnly>
				{compliancePathChoice({ initialPath: "justify" })}
			</LockProvider>,
		);

		expect(screen.getByLabelText(ALL_TITLE)).toBeDisabled();
		expect(container.querySelector(".fr-alert--info")).not.toBeInTheDocument();
	});

	it("renders Suivant as a link to the rest of the path when justify is saved", () => {
		render(
			<LockProvider isReadOnly>
				{compliancePathChoice({ initialPath: "justify" })}
			</LockProvider>,
		);

		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/avis-cse",
		);
		expect(
			screen.queryByRole("button", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("keeps Suivant a disabled button when no choice was saved", () => {
		render(<LockProvider isReadOnly>{compliancePathChoice()}</LockProvider>);

		expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
		expect(
			screen.queryByRole("link", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("reaches a saved corrective-action path through the path screen", async () => {
		render(
			<LockProvider isReadOnly>
				{compliancePathChoice({ initialPath: "corrective_action" })}
			</LockProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

		const corrective = await screen.findByLabelText(CORRECTIVE_ACTION_TITLE);
		expect(corrective).toBeChecked();
		expect(corrective).toBeDisabled();
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			CORRECTIVE_ACTION_HREF,
		);
		expect(mockMutate).not.toHaveBeenCalled();
	});
});

describe("CompliancePathChoice read-only mode", () => {
	it("renders the read-only alert and disables the radios", () => {
		render(
			compliancePathChoice({
				initialPath: "justify",
				readOnlyReason: "cse_opinion_submitted",
			}),
		);
		expect(
			screen.getByText(/L'avis du CSE a déjà été transmis/),
		).toBeInTheDocument();
		expect(screen.getByLabelText(ALL_TITLE)).toBeDisabled();
	});

	it("renders Suivant as a navigation link instead of a submit button", () => {
		render(
			compliancePathChoice({
				initialPath: "justify",
				readOnlyReason: "cse_opinion_submitted",
			}),
		);
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/avis-cse",
		);
		expect(
			screen.queryByRole("button", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("does not call the save mutation when the read-only form is submitted", async () => {
		render(
			compliancePathChoice({
				initialPath: "justify",
				readOnlyReason: "cse_opinion_submitted",
			}),
		);
		const form = screen
			.getByRole("link", { name: /suivant/i })
			.closest("form") as HTMLFormElement;
		await act(async () => {
			fireEvent.submit(form);
		});
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("leads a saved corrective-action path to its first step through the path screen", async () => {
		render(
			compliancePathChoice({
				initialPath: "corrective_action",
				readOnlyReason: "second_declaration_submitted",
			}),
		);

		fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

		expect(await screen.findByLabelText(CORRECTIVE_ACTION_TITLE)).toBeChecked();
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			CORRECTIVE_ACTION_HREF,
		);
		fireEvent.click(screen.getByRole("button", { name: /précédent/i }));
		expect(await screen.findByLabelText(ALL_TITLE)).toBeDisabled();
	});

	it("links a saved round-2 joint evaluation directly, with no path screen", () => {
		render(
			compliancePathChoice({
				initialPath: "joint_evaluation",
				isSecondRound: true,
				readOnlyReason: "joint_evaluation_submitted",
			}),
		);

		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			JOINT_EVALUATION_HREF,
		);
	});
});
