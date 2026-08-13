import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, submitMutate, openModal, closeModal, submitState } = vi.hoisted(
	() => ({
		push: vi.fn(),
		submitMutate: vi.fn(),
		openModal: vi.fn(),
		closeModal: vi.fn(),
		submitState: {
			error: null as { message: string } | null,
			isPending: false,
			onSuccess: undefined as (() => void) | undefined,
		},
	}),
);

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("~/modules/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/shared")>()),
	useDsfrModal: () => ({
		modalRef: { current: null },
		open: openModal,
		close: closeModal,
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			submit: {
				useMutation: ({ onSuccess }: { onSuccess: () => void }) => {
					submitState.onSuccess = onSuccess;
					return {
						error: submitState.error,
						isPending: submitState.isPending,
						mutate: submitMutate,
					};
				},
			},
		},
	},
}));

import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	NON_COMPLIANT_EXECUTIVES,
	NON_COMPLIANT_MEMBERS,
	OFFLINE_PUBLICATION,
	REPRESENTATION_YEAR,
	SINGLE_EXECUTIVE,
	VALID_REFERENCE_PERIOD,
	WEBSITE_PUBLICATION,
} from "~/modules/declaration-representation/__tests__/fixtures";
import type { RepresentationDraftContextValue } from "~/modules/declaration-representation/shared/draft/DraftContext";
import { RepresentationDraftProvider } from "~/modules/declaration-representation/shared/draft/DraftContext";
import {
	EXECUTIVES_TITLE,
	MEMBERS_TITLE,
} from "~/modules/declaration-representation/shared/reviewSummary";
import type { RepresentationDraft } from "~/modules/declaration-representation/types";
import { TOTAL_REPRESENTATION_STEPS } from "~/modules/declaration-representation/types";
import { Step5Review } from "../Step5Review";

const PREVIOUS_HREF = "/declaration-representation/etape/4";
const CONFIRMATION_HREF = "/declaration-representation/confirmation";
const TELEACCORDS_URL = "https://www.teleaccords.travail.gouv.fr";

const BOTH_COMPUTABLE = { ...COMPUTABLE_EXECUTIVES, ...COMPUTABLE_MEMBERS };
const NOTHING_COMPUTABLE = { ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY };
const FULLY_COMPLIANT = { ...BOTH_COMPUTABLE, ...WEBSITE_PUBLICATION };
const SINGLE_GAP = {
	...COMPUTABLE_EXECUTIVES,
	...NON_COMPLIANT_MEMBERS,
	...WEBSITE_PUBLICATION,
};

function renderReview({
	draft = {},
	isReadOnly = false,
}: {
	draft?: Partial<RepresentationDraft>;
	isReadOnly?: boolean;
} = {}) {
	const value: RepresentationDraftContextValue = {
		year: REPRESENTATION_YEAR,
		step: TOTAL_REPRESENTATION_STEPS,
		draft: {
			currentStep: TOTAL_REPRESENTATION_STEPS,
			...VALID_REFERENCE_PERIOD,
			...draft,
		},
		setDraftValues: vi.fn(),
		isSaving: false,
		isPendingSave: false,
		isReadOnly,
		previousHref: PREVIOUS_HREF,
		registerStepValidator: vi.fn(),
	};

	return render(
		<RepresentationDraftProvider value={value}>
			<Step5Review />
		</RepresentationDraftProvider>,
	);
}

function definitionValue(term: string): string {
	const value = screen.getByText(term, { selector: "dt" }).nextElementSibling;
	return value?.textContent ?? "";
}

function indicatorCard(title: string): HTMLElement {
	const heading = screen.getByRole("heading", { level: 3, name: title });
	const card = heading.parentElement;
	if (card === null) throw new Error(`Missing card for "${title}".`);
	return card;
}

function nextStepsSection(): HTMLElement {
	const heading = screen.getByRole("heading", {
		level: 2,
		name: "Prochaines étapes",
	});
	const section = heading.closest("section");
	if (section === null) throw new Error("Missing next-steps section.");
	return section;
}

function complianceBadges() {
	return screen.queryAllByText(/^(Conforme|Non conforme|Non applicable)$/, {
		selector: "p.fr-badge",
	});
}

function submitButton() {
	return screen.queryByRole("button", { name: "Soumettre" });
}

// The DSFR modal is driven by the DSFR runtime, absent in jsdom: its <dialog>
// stays closed, so its content has to be queried outside the a11y tree.
function modalCheckbox() {
	return screen.queryByRole("checkbox", { hidden: true });
}

function modalButton(name: string) {
	return screen.getByRole("button", { hidden: true, name });
}

async function certify() {
	const checkbox = modalCheckbox();
	if (checkbox === null) throw new Error("Missing certification checkbox.");
	await userEvent.click(checkbox);
}

async function openSubmitModal() {
	const button = submitButton();
	if (button === null) throw new Error("Missing submit button.");
	await userEvent.click(button);
}

beforeEach(() => {
	push.mockReset();
	submitMutate.mockReset();
	openModal.mockReset();
	closeModal.mockReset();
	submitState.error = null;
	submitState.isPending = false;
	submitState.onSuccess = undefined;
});

describe("Step5Review — restitution du brouillon (S18)", () => {
	it("restitutes the reference year and period", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(definitionValue("Année de référence")).toBe(
			String(REPRESENTATION_YEAR),
		);
		expect(definitionValue("Période de référence")).toBe(
			"01/01/2025 - 31/12/2025",
		);
	});

	it("marks an unknown reference period with a dash", () => {
		renderReview({
			draft: {
				...FULLY_COMPLIANT,
				referencePeriodStart: undefined,
				referencePeriodEnd: undefined,
			},
		});

		expect(definitionValue("Période de référence")).toBe("— - —");
	});

	it("restitutes both computable gaps", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		const executives = within(indicatorCard(EXECUTIVES_TITLE));
		expect(executives.getByText("Femmes").nextElementSibling).toHaveTextContent(
			"60 %",
		);
		expect(executives.getByText("Hommes").nextElementSibling).toHaveTextContent(
			"40 %",
		);

		const members = within(indicatorCard(MEMBERS_TITLE));
		expect(members.getByText("Femmes").nextElementSibling).toHaveTextContent(
			"55 %",
		);
		expect(members.getByText("Hommes").nextElementSibling).toHaveTextContent(
			"45 %",
		);
	});

	it("restitutes a website publication", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(definitionValue("Date de publication")).toBe("01/03/2026");
		expect(definitionValue("Site Internet de publication")).toBe("Oui");
		expect(definitionValue("Adresse de la page (URL)")).toBe(
			WEBSITE_PUBLICATION.publishUrl,
		);
		expect(
			screen.queryByText("Modalités de communication", { selector: "dt" }),
		).not.toBeInTheDocument();
	});

	it("restitutes an offline publication", () => {
		renderReview({ draft: { ...BOTH_COMPUTABLE, ...OFFLINE_PUBLICATION } });

		expect(definitionValue("Site Internet de publication")).toBe("Non");
		expect(definitionValue("Modalités de communication")).toBe(
			OFFLINE_PUBLICATION.publishModalities,
		);
		expect(
			screen.queryByText("Adresse de la page (URL)", { selector: "dt" }),
		).not.toBeInTheDocument();
	});

	it("marks the publication details left blank with a dash", () => {
		renderReview({ draft: { ...BOTH_COMPUTABLE, hasWebsite: true } });

		expect(definitionValue("Date de publication")).toBe("—");
		expect(definitionValue("Adresse de la page (URL)")).toBe("—");
	});

	it("marks blank communication modalities with a dash", () => {
		renderReview({ draft: { ...BOTH_COMPUTABLE, hasWebsite: false } });

		expect(definitionValue("Modalités de communication")).toBe("—");
	});
});

describe("Step5Review — verdicts par indicateur (S16)", () => {
	it("badges each indicator on its own, with no global verdict", () => {
		renderReview({ draft: SINGLE_GAP });

		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent("Conforme");
		expect(indicatorCard(EXECUTIVES_TITLE)).not.toHaveTextContent(
			"Non conforme",
		);
		expect(indicatorCard(MEMBERS_TITLE)).toHaveTextContent("Non conforme");
		expect(complianceBadges()).toHaveLength(2);
	});

	it("badges a computable gap left unfilled as not applicable", () => {
		renderReview({
			draft: { executivesCount: "two_or_more", ...COMPUTABLE_MEMBERS },
		});

		const executives = within(indicatorCard(EXECUTIVES_TITLE));
		expect(executives.getByText("Femmes").nextElementSibling).toHaveTextContent(
			"—",
		);
		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent("Non applicable");
	});
});

describe("Step5Review — écarts non calculables (S12)", () => {
	it("shows both reasons, no publication block and no next steps", () => {
		renderReview({ draft: { ...NOTHING_COMPUTABLE, ...WEBSITE_PUBLICATION } });

		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent(
			"Aucun cadre dirigeant",
		);
		expect(indicatorCard(MEMBERS_TITLE)).toHaveTextContent(
			"Aucune instance dirigeante",
		);
		expect(complianceBadges()).toHaveLength(2);
		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent("Non applicable");
		expect(indicatorCard(MEMBERS_TITLE)).toHaveTextContent("Non applicable");
		expect(
			screen.queryByRole("heading", { name: "Publication" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Prochaines étapes" }),
		).not.toBeInTheDocument();
	});

	it("tells the modal that nothing is computable", async () => {
		renderReview({ draft: NOTHING_COMPUTABLE });

		expect(
			screen.getByText(/Vos écarts de représentation ne sont pas calculables/),
		).toBeInTheDocument();
	});

	it("shows the single-executive reason", () => {
		renderReview({ draft: { ...SINGLE_EXECUTIVE, ...COMPUTABLE_MEMBERS } });

		expect(indicatorCard(EXECUTIVES_TITLE)).toHaveTextContent(
			"Un cadre dirigeant",
		);
	});

	it("keeps the publication block as soon as one gap is computable", () => {
		renderReview({
			draft: {
				...NO_EXECUTIVES,
				...COMPUTABLE_MEMBERS,
				...WEBSITE_PUBLICATION,
			},
		});

		expect(
			screen.getByRole("heading", { name: "Publication" }),
		).toBeInTheDocument();
	});
});

describe("Step5Review — prochaines étapes (S17)", () => {
	it("names the failing indicator and both correction routes", () => {
		renderReview({ draft: SINGLE_GAP });

		const section = within(nextStepsSection());
		expect(
			section.getByText(
				/Vous n'êtes pas conforme concernant l'écart relatif aux membres des instances dirigeantes/,
			),
		).toBeInTheDocument();
		expect(
			section.getByText(
				"Par accord collectif, dans le cadre de la négociation obligatoire sur l'égalité professionnelle",
			),
		).toBeInTheDocument();
		expect(
			section.getByText(
				"Par décision unilatérale de l'employeur après information - consultation du CSE",
			),
		).toBeInTheDocument();
	});

	it("names both indicators when the two gaps fail", () => {
		renderReview({
			draft: {
				...NON_COMPLIANT_EXECUTIVES,
				...NON_COMPLIANT_MEMBERS,
				...WEBSITE_PUBLICATION,
			},
		});

		expect(
			within(nextStepsSection()).getByText(
				/les écarts relatifs aux cadres dirigeants et aux membres des instances dirigeantes/,
			),
		).toBeInTheDocument();
	});

	it("points the deposit at TéléAccords in a new tab", () => {
		renderReview({ draft: SINGLE_GAP });

		const link = within(nextStepsSection()).getByRole("link", {
			name: /TéléAccords.*nouvelle fenêtre/i,
		});

		expect(link).toHaveAttribute("href", TELEACCORDS_URL);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("stays a read-only notice, with no field and no upload", () => {
		renderReview({ draft: SINGLE_GAP });

		expect(
			nextStepsSection().querySelectorAll(
				"input, textarea, select, button, [contenteditable]",
			),
		).toHaveLength(0);
	});

	it("stays hidden while every computable gap is compliant", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(
			screen.queryByRole("heading", { name: "Prochaines étapes" }),
		).not.toBeInTheDocument();
	});
});

describe("Step5Review — soumission (S19)", () => {
	it("opens the confirmation modal from the CTA without submitting", async () => {
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();

		expect(openModal).toHaveBeenCalledTimes(1);
		expect(submitMutate).not.toHaveBeenCalled();
	});

	it("submits the draft payload once the declarant certifies", async () => {
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();
		await certify();
		await userEvent.click(modalButton("Valider"));

		expect(submitMutate).toHaveBeenCalledWith({
			payload: {
				...VALID_REFERENCE_PERIOD,
				...COMPUTABLE_EXECUTIVES,
				...COMPUTABLE_MEMBERS,
				...WEBSITE_PUBLICATION,
			},
			year: REPRESENTATION_YEAR,
		});
	});

	it("sends no publication key when no gap is computable (S12)", async () => {
		renderReview({ draft: { ...NOTHING_COMPUTABLE, ...WEBSITE_PUBLICATION } });

		await openSubmitModal();
		await certify();
		await userEvent.click(modalButton("Valider"));

		expect(submitMutate).toHaveBeenCalledWith({
			payload: { ...VALID_REFERENCE_PERIOD, ...NOTHING_COMPUTABLE },
			year: REPRESENTATION_YEAR,
		});
	});

	it("keeps the submission locked until the declarant certifies", async () => {
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();

		expect(modalButton("Valider")).toBeDisabled();
	});

	it("closes the modal and lands on the confirmation screen on success", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		act(() => submitState.onSuccess?.());

		expect(closeModal).toHaveBeenCalledTimes(1);
		expect(push).toHaveBeenCalledWith(CONFIRMATION_HREF);
	});

	it("holds the modal while the submission is in flight", async () => {
		submitState.isPending = true;
		renderReview({ draft: FULLY_COMPLIANT });

		await openSubmitModal();
		await certify();

		expect(modalButton("Envoi en cours…")).toBeDisabled();
		expect(submitMutate).not.toHaveBeenCalled();
	});

	it("surfaces the submission failure without leaving the screen", () => {
		submitState.error = { message: "La soumission a échoué." };
		renderReview({ draft: FULLY_COMPLIANT });

		expect(screen.getByRole("alert")).toHaveTextContent(
			"La soumission a échoué.",
		);
		expect(push).not.toHaveBeenCalled();
	});
});

describe("Step5Review — navigation", () => {
	it("links back to the step the funnel came from", () => {
		renderReview({ draft: FULLY_COMPLIANT });

		expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
			"href",
			PREVIOUS_HREF,
		);
	});

	it("offers no submission while the campaign is closed (S23)", () => {
		renderReview({ draft: FULLY_COMPLIANT, isReadOnly: true });

		expect(submitButton()).not.toBeInTheDocument();
		expect(modalCheckbox()).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Précédent" })).toBeInTheDocument();
	});
});
