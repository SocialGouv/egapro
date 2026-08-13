import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	OFFLINE_PUBLICATION,
	REPRESENTATION_YEAR,
	VALID_REFERENCE_PERIOD,
	VALIDATION_MESSAGES,
	WEBSITE_PUBLICATION,
	ZOD_UNTRANSLATED_MESSAGE,
} from "~/modules/declaration-representation/__tests__/fixtures";
import type {
	RepresentationDraftContextValue,
	StepValidator,
} from "~/modules/declaration-representation/shared/draft/DraftContext";
import { RepresentationDraftProvider } from "~/modules/declaration-representation/shared/draft/DraftContext";
import { PUBLICATION_STEP_NUMBER } from "~/modules/declaration-representation/steps";
import type { RepresentationDraft } from "~/modules/declaration-representation/types";
import { Step4Publication } from "../Step4Publication";

const ACCORDION_TITLE = "Obligation de transparence";

const LEARN_MORE_HREF =
	"https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle";

const setDraftValues = vi.fn();

let latestValidator: StepValidator | null = null;

const registerStepValidator = vi.fn((validator: StepValidator | null) => {
	latestValidator = validator;
});

function renderStep({
	draft = {},
	isReadOnly = false,
}: {
	draft?: Partial<RepresentationDraft>;
	isReadOnly?: boolean;
} = {}) {
	const value: RepresentationDraftContextValue = {
		year: REPRESENTATION_YEAR,
		step: PUBLICATION_STEP_NUMBER,
		draft: {
			currentStep: PUBLICATION_STEP_NUMBER,
			...VALID_REFERENCE_PERIOD,
			...draft,
		},
		setDraftValues,
		isSaving: false,
		isPendingSave: false,
		isReadOnly,
		registerStepValidator,
	};

	return render(
		<RepresentationDraftProvider value={value}>
			<Step4Publication />
		</RepresentationDraftProvider>,
	);
}

function dateField() {
	return screen.getByLabelText(/Date de publication des écarts calculables/);
}

function websiteFieldset() {
	return screen.getByRole("group", { name: /site Internet/ });
}

function urlField() {
	return screen.queryByLabelText(/adresse de la page Internet/);
}

function modalitiesField() {
	return screen.queryByLabelText(/modalités de communication/);
}

function accordionTrigger() {
	return screen.getByRole("button", { name: ACCORDION_TITLE });
}

async function runStepValidator(): Promise<boolean> {
	const validator = latestValidator;
	if (validator === null) throw new Error("No step validator was registered.");

	let result = false;
	await act(async () => {
		result = await validator();
	});
	return result;
}

beforeEach(() => {
	setDraftValues.mockReset();
	registerStepValidator.mockClear();
	latestValidator = null;
});

describe("Step4Publication — fields", () => {
	it("asks for the publication date and the website question", () => {
		renderStep();

		expect(dateField()).toHaveAttribute("type", "date");
		expect(screen.getByLabelText("Oui")).toBeInTheDocument();
		expect(screen.getByLabelText("Non")).toBeInTheDocument();
		expect(urlField()).not.toBeInTheDocument();
		expect(modalitiesField()).not.toBeInTheDocument();
	});

	it("exposes the date and the website answer as required", () => {
		renderStep();

		expect(dateField()).toBeRequired();
		expect(screen.getByLabelText("Oui")).toBeRequired();
		expect(screen.getByLabelText("Non")).toBeRequired();
	});

	it("prefills the fields from the draft", () => {
		renderStep({ draft: WEBSITE_PUBLICATION });

		expect(dateField()).toHaveValue(WEBSITE_PUBLICATION.publishDate);
		expect(screen.getByLabelText("Oui")).toBeChecked();
		expect(urlField()).toHaveValue(WEBSITE_PUBLICATION.publishUrl);
	});

	it("reveals the page address when the company has a website (S9)", async () => {
		renderStep();

		await userEvent.click(screen.getByLabelText("Oui"));

		expect(urlField()).toBeInTheDocument();
		expect(urlField()).toHaveAttribute("aria-required", "true");
		expect(modalitiesField()).not.toBeInTheDocument();
	});

	it("reveals the communication modalities when the company has no website (S10)", async () => {
		renderStep();

		await userEvent.click(screen.getByLabelText("Non"));

		expect(modalitiesField()).toBeInTheDocument();
		expect(modalitiesField()).toHaveAttribute("aria-required", "true");
		expect(urlField()).not.toBeInTheDocument();
	});

	it("syncs every entry into the shared draft", async () => {
		renderStep();

		await userEvent.click(screen.getByLabelText("Non"));

		expect(setDraftValues).toHaveBeenCalledWith(
			expect.objectContaining({ hasWebsite: false }),
		);
	});

	it("locks every field while the campaign is read-only", () => {
		renderStep({ draft: WEBSITE_PUBLICATION, isReadOnly: true });

		expect(dateField()).toHaveAttribute("readonly");
		expect(dateField()).not.toBeDisabled();
		expect(screen.getByLabelText("Oui")).toBeDisabled();
		expect(screen.getByLabelText("Non")).toBeDisabled();
		expect(urlField()).toHaveAttribute("readonly");
		expect(urlField()).not.toBeDisabled();
	});

	it("locks the communication modalities while the campaign is read-only", () => {
		renderStep({ draft: OFFLINE_PUBLICATION, isReadOnly: true });

		expect(modalitiesField()).toHaveAttribute("readonly");
		expect(modalitiesField()).not.toBeDisabled();
	});
});

describe("Step4Publication — step validator", () => {
	it("registers its validator with the step page and releases it on unmount", () => {
		const { unmount } = renderStep();

		expect(registerStepValidator).toHaveBeenCalledWith(expect.any(Function));

		unmount();

		expect(registerStepValidator).toHaveBeenLastCalledWith(null);
	});

	it("blocks the step and asks for the publication date in plain French", async () => {
		renderStep();

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.getByText(VALIDATION_MESSAGES.publishDateRequired),
		).toBeInTheDocument();
		expect(screen.queryByText(/ISO date/i)).not.toBeInTheDocument();
		expect(dateField()).toHaveAttribute("aria-invalid", "true");
	});

	it("clears the missing-date error once the date is filled in", async () => {
		renderStep({
			draft: { hasWebsite: true, publishUrl: WEBSITE_PUBLICATION.publishUrl },
		});

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.getByText(VALIDATION_MESSAGES.publishDateRequired),
		).toBeInTheDocument();

		fireEvent.change(dateField(), {
			target: { value: WEBSITE_PUBLICATION.publishDate },
		});

		expect(await runStepValidator()).toBe(true);
		expect(
			screen.queryByText(VALIDATION_MESSAGES.publishDateRequired),
		).not.toBeInTheDocument();
	});

	it("requires an answer to the website question in plain French once the date is filled", async () => {
		renderStep({ draft: { publishDate: WEBSITE_PUBLICATION.publishDate } });

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.queryByText(VALIDATION_MESSAGES.publishDateRequired),
		).not.toBeInTheDocument();
		expect(websiteFieldset()).toHaveClass("fr-fieldset--error");
		expect(
			screen.getByText(VALIDATION_MESSAGES.websiteAnswerRequired),
		).toBeInTheDocument();
		expect(
			screen.queryByText(ZOD_UNTRANSLATED_MESSAGE),
		).not.toBeInTheDocument();
	});

	it("stops at the website question before asking for the publication details", async () => {
		renderStep({ draft: { publishDate: WEBSITE_PUBLICATION.publishDate } });

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.queryByText(VALIDATION_MESSAGES.urlRequired),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(VALIDATION_MESSAGES.modalitiesRequired),
		).not.toBeInTheDocument();
	});

	it("requires the page address when the company has a website (S9)", async () => {
		renderStep({
			draft: { publishDate: WEBSITE_PUBLICATION.publishDate, hasWebsite: true },
		});

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.getByText(VALIDATION_MESSAGES.urlRequired),
		).toBeInTheDocument();
	});

	it("requires the communication modalities when there is no website (S10)", async () => {
		renderStep({
			draft: {
				publishDate: OFFLINE_PUBLICATION.publishDate,
				hasWebsite: false,
			},
		});

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.getByText(VALIDATION_MESSAGES.modalitiesRequired),
		).toBeInTheDocument();
	});

	it("lets the step proceed once the website publication is complete (S9)", async () => {
		renderStep({ draft: WEBSITE_PUBLICATION });

		expect(await runStepValidator()).toBe(true);
	});

	it("lets the step proceed with the offline communication modalities (S10)", async () => {
		renderStep({ draft: OFFLINE_PUBLICATION });

		expect(await runStepValidator()).toBe(true);
	});
});

describe("Step4Publication — publication date after the reference period (S11)", () => {
	it("blocks a publication date equal to the end of the reference period", async () => {
		renderStep({
			draft: {
				...WEBSITE_PUBLICATION,
				publishDate: VALID_REFERENCE_PERIOD.referencePeriodEnd,
			},
		});

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.getByText(VALIDATION_MESSAGES.publishDateAfterPeriod),
		).toBeInTheDocument();
	});

	it("blocks a publication date before the end of the reference period", async () => {
		renderStep({
			draft: { ...WEBSITE_PUBLICATION, publishDate: "2025-06-30" },
		});

		expect(await runStepValidator()).toBe(false);
		expect(
			screen.getByText(VALIDATION_MESSAGES.publishDateAfterPeriod),
		).toBeInTheDocument();
	});

	it("accepts the day right after the end of the reference period", async () => {
		renderStep({
			draft: { ...WEBSITE_PUBLICATION, publishDate: "2026-01-01" },
		});

		expect(await runStepValidator()).toBe(true);
		expect(
			screen.queryByText(VALIDATION_MESSAGES.publishDateAfterPeriod),
		).not.toBeInTheDocument();
	});

	it("skips the comparison while the reference period is unknown", async () => {
		renderStep({
			draft: {
				...WEBSITE_PUBLICATION,
				publishDate: "2020-01-01",
				referencePeriodEnd: undefined,
			},
		});

		expect(await runStepValidator()).toBe(true);
	});
});

describe("Step4Publication — obligation de transparence", () => {
	it("offers the obligation in a collapsed accordion", () => {
		renderStep();

		expect(accordionTrigger()).toHaveAttribute("aria-expanded", "false");
	});

	it("wires the accordion button to the panel holding the obligation", () => {
		renderStep();

		const panelId = accordionTrigger().getAttribute("aria-controls");

		expect(document.getElementById(panelId ?? "")).toContainElement(
			screen.getByText(/par tout moyen/),
		);
	});

	it("recalls the yearly publication duty and the fallback without a website", () => {
		renderStep();

		expect(
			screen.getByText(
				/au plus tard le 1er mars.*visible et lisible sur leur site internet/,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/porter ces informations à la connaissance des salariés par tout moyen/,
			),
		).toBeInTheDocument();
	});

	it("points to the ministry page in a new tab", () => {
		renderStep();

		const link = screen.getByRole("link", {
			name: /En savoir plus.*nouvelle fenêtre/i,
		});

		expect(link).toHaveAttribute("href", LEARN_MORE_HREF);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("keeps the obligation available whichever publication channel is picked", async () => {
		renderStep();

		await userEvent.click(screen.getByLabelText("Non"));

		expect(modalitiesField()).toBeInTheDocument();
		expect(accordionTrigger()).toBeInTheDocument();
	});
});
