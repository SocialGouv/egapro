import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { RepresentationDraft } from "~/modules/declaration-representation";
import { RepresentationDraftProvider } from "~/modules/declaration-representation";
import {
	COMPUTABLE_EXECUTIVES,
	MISMATCHED_EXECUTIVES,
	REPRESENTATION_YEAR,
	VALIDATION_MESSAGES,
} from "~/modules/declaration-representation/__tests__/fixtures";
import { Step2Executives } from "../Step2Executives";

const STEP = 2;
const RAISED_TARGET_REFERENCE_YEAR = 2028;

const OPTIONS = {
	none: /^Aucun cadre dirigeant/,
	one: /^Un cadre dirigeant/,
	twoOrMore: /^Deux cadres dirigeants ou plus/,
};

const REMINDER = {
	compliant: "Objectif de 30 % atteint",
	nonCompliant: "Objectif de 30 % non atteint",
};

const NOT_COMPUTABLE_HINT = /L'écart ne peut pas être calculé\./;

type HarnessProps = {
	initialDraft?: RepresentationDraft;
	isReadOnly?: boolean;
	onDraftChange?: (draft: RepresentationDraft) => void;
	onStepValidChange?: (valid: boolean) => void;
	year?: number;
};

function Harness({
	initialDraft = { currentStep: STEP },
	isReadOnly = false,
	onDraftChange,
	onStepValidChange = () => undefined,
	year = REPRESENTATION_YEAR,
}: HarnessProps) {
	const [draft, setDraft] = useState<RepresentationDraft>(initialDraft);

	function setDraftValues(values: Partial<RepresentationDraft>) {
		const next = { ...draft, ...values };
		onDraftChange?.(next);
		setDraft(next);
	}

	return (
		<RepresentationDraftProvider
			value={{
				draft,
				isPendingSave: false,
				isReadOnly,
				isSaving: false,
				setDraftValues,
				setStepValid: onStepValidChange,
				step: STEP,
				year,
			}}
		>
			<Step2Executives />
		</RepresentationDraftProvider>
	);
}

function renderStep(props: HarnessProps = {}) {
	const onDraftChange = vi.fn<(draft: RepresentationDraft) => void>();
	const onStepValidChange = vi.fn<(valid: boolean) => void>();
	render(
		<Harness
			{...props}
			onDraftChange={onDraftChange}
			onStepValidChange={onStepValidChange}
		/>,
	);
	return {
		lastDraft: () => onDraftChange.mock.lastCall?.[0],
		lastStepValid: () => onStepValidChange.mock.lastCall?.[0],
		onDraftChange,
		onStepValidChange,
	};
}

function option(matcher: RegExp) {
	return screen.getByRole("radio", { name: matcher });
}

function percentFields() {
	return {
		men: screen.getByLabelText(/Hommes/),
		women: screen.getByLabelText(/Femmes/),
	};
}

async function enterWomenPercent(value: string) {
	await userEvent.click(option(OPTIONS.twoOrMore));
	await userEvent.type(percentFields().women, value);
}

async function retypeMenPercent(value: string) {
	await userEvent.clear(percentFields().men);
	if (value !== "") await userEvent.type(percentFields().men, value);
}

describe("Step2Executives — nombre de cadres dirigeants", () => {
	it("offers the three options with no preselection and no percentage field", () => {
		renderStep();

		expect(option(OPTIONS.none)).not.toBeChecked();
		expect(option(OPTIONS.one)).not.toBeChecked();
		expect(option(OPTIONS.twoOrMore)).not.toBeChecked();
		expect(screen.queryByLabelText(/Femmes/)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Hommes/)).not.toBeInTheDocument();
		expect(screen.queryByText("Conforme")).not.toBeInTheDocument();
	});

	it("groups the options under the fieldset legend", () => {
		renderStep();

		expect(
			screen.getByRole("group", {
				name: /Indiquez le nombre de cadres dirigeants dans votre entreprise/,
			}),
		).toBeInTheDocument();
	});

	it.each([
		["none" as const, OPTIONS.none],
		["one" as const, OPTIONS.one],
	])("stores %s alone, without any percentage field nor derived reason (S7)", async (expected, matcher) => {
		const { lastDraft } = renderStep();

		await userEvent.click(option(matcher));

		expect(option(matcher)).toBeChecked();
		expect(option(matcher)).toHaveAccessibleName(NOT_COMPUTABLE_HINT);
		expect(screen.queryByLabelText(/Femmes/)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Hommes/)).not.toBeInTheDocument();
		expect(lastDraft()).toEqual({
			currentStep: STEP,
			executiveMenPercent: undefined,
			executivesCount: expected,
			executiveWomenPercent: undefined,
		});
	});

	it("keeps the entered percentages when the selected option is clicked again", async () => {
		const { lastDraft } = renderStep();

		await enterWomenPercent("60");
		await userEvent.click(option(OPTIONS.twoOrMore));

		expect(percentFields().women).toHaveValue("60");
		expect(percentFields().men).toHaveValue("40");
		expect(lastDraft()).toMatchObject({
			executiveMenPercent: 40,
			executiveWomenPercent: 60,
		});
	});
});

describe("Step2Executives — saisie des pourcentages (S5)", () => {
	it("auto-fills the men percentage with 100 − x and stores both values", async () => {
		const { lastDraft } = renderStep();

		await enterWomenPercent("35");

		expect(percentFields().men).toHaveValue("65");
		expect(lastDraft()).toEqual({
			currentStep: STEP,
			executiveMenPercent: 65,
			executivesCount: "two_or_more",
			executiveWomenPercent: 35,
		});
	});

	it("keeps the auto-filled field editable", async () => {
		const { lastDraft } = renderStep();

		await enterWomenPercent("35");
		await retypeMenPercent("45");

		expect(percentFields().women).toHaveValue("35");
		expect(percentFields().men).toHaveValue("45");
		expect(lastDraft()).toMatchObject({
			executiveMenPercent: 45,
			executiveWomenPercent: 35,
		});
	});

	it("stores a decimal typed with a comma", async () => {
		const { lastDraft } = renderStep();

		await enterWomenPercent("35,5");

		expect(percentFields().men).toHaveValue("64.5");
		expect(lastDraft()).toMatchObject({
			executiveMenPercent: 64.5,
			executiveWomenPercent: 35.5,
		});
		expect(screen.getByText("Conforme")).toBeInTheDocument();
	});

	it("restores the saved percentages and their verdict when the draft is reloaded", () => {
		renderStep({
			initialDraft: { currentStep: STEP, ...COMPUTABLE_EXECUTIVES },
		});

		expect(option(OPTIONS.twoOrMore)).toBeChecked();
		expect(percentFields().women).toHaveValue("60");
		expect(percentFields().men).toHaveValue("40");
		expect(screen.getByText("Conforme")).toBeInTheDocument();
	});
});

describe("Step2Executives — somme des pourcentages (S6)", () => {
	it("blocks the entry with an error when the sum differs from 100", async () => {
		renderStep();

		await enterWomenPercent("35");
		await retypeMenPercent("45");

		expect(screen.getByText(VALIDATION_MESSAGES.sum)).toBeInTheDocument();
		expect(percentFields().women).toHaveAttribute("aria-invalid", "true");
		expect(percentFields().men).toHaveAttribute("aria-invalid", "true");
		expect(screen.queryByText("Conforme")).not.toBeInTheDocument();
		expect(screen.queryByText("Non conforme")).not.toBeInTheDocument();
	});

	it("clears the error as soon as the sum is back to 100", async () => {
		renderStep();

		await enterWomenPercent("35");
		await retypeMenPercent("45");
		await retypeMenPercent("65");

		expect(screen.queryByText(VALIDATION_MESSAGES.sum)).not.toBeInTheDocument();
		expect(percentFields().women).not.toHaveAttribute("aria-invalid");
		expect(screen.getByText("Conforme")).toBeInTheDocument();
	});

	it("stays silent while a single percentage is filled", async () => {
		const { lastDraft } = renderStep();

		await enterWomenPercent("35");
		await retypeMenPercent("");

		expect(screen.queryByText(VALIDATION_MESSAGES.sum)).not.toBeInTheDocument();
		expect(screen.queryByText("Conforme")).not.toBeInTheDocument();
		expect(screen.queryByText("Non conforme")).not.toBeInTheDocument();
		expect(lastDraft()).toMatchObject({
			executiveMenPercent: undefined,
			executiveWomenPercent: 35,
		});
	});

	it.each([
		".",
		",",
	])("hides the verdict while the decimal separator %s is being typed", async (separator) => {
		renderStep();

		await enterWomenPercent("60");
		expect(screen.getByText("Conforme")).toBeInTheDocument();

		await userEvent.type(percentFields().women, separator);

		expect(screen.queryByText("Conforme")).not.toBeInTheDocument();
		expect(screen.queryByText(VALIDATION_MESSAGES.sum)).not.toBeInTheDocument();
	});
});

describe("Step2Executives — badge de conformité (S13, S14)", () => {
	it.each([
		"60",
		"30",
	])("grades a women share of %s as compliant and recalls the threshold (S13)", async (womenPercent) => {
		renderStep();

		await enterWomenPercent(womenPercent);

		expect(screen.getByText("Conforme")).toBeInTheDocument();
		expect(screen.getByText(REMINDER.compliant)).toBeInTheDocument();
		expect(screen.getByText(/ce seuil passera à 40/)).toBeInTheDocument();
	});

	it("grades an under-represented sex below the target as non compliant (S14)", async () => {
		renderStep();

		await enterWomenPercent("20");

		expect(screen.getByText("Non conforme")).toBeInTheDocument();
		expect(screen.getByText(REMINDER.nonCompliant)).toBeInTheDocument();
		expect(screen.getByText(/ce seuil passera à 40/)).toBeInTheDocument();
	});

	it.each([
		[REPRESENTATION_YEAR, "Conforme"],
		[RAISED_TARGET_REFERENCE_YEAR, "Non conforme"],
	])("grades a women share of 35 against the target of the campaign following %i", async (year, expectedBadge) => {
		renderStep({ year });

		await enterWomenPercent("35");

		expect(screen.getByText(expectedBadge)).toBeInTheDocument();
	});

	it("announces the verdict in a polite live region", async () => {
		renderStep();

		await enterWomenPercent("60");

		expect(
			screen.getByText("Conforme").closest("[aria-live='polite']"),
		).toHaveAttribute("aria-atomic", "true");
	});
});

describe("Step2Executives — bascule entre les choix", () => {
	it("clears the percentages when leaving two_or_more and coming back", async () => {
		const { lastDraft } = renderStep();

		await enterWomenPercent("60");
		await userEvent.click(option(OPTIONS.one));

		expect(screen.queryByLabelText(/Femmes/)).not.toBeInTheDocument();
		expect(lastDraft()).toEqual({
			currentStep: STEP,
			executiveMenPercent: undefined,
			executivesCount: "one",
			executiveWomenPercent: undefined,
		});

		await userEvent.click(option(OPTIONS.twoOrMore));

		expect(percentFields().women).toHaveValue("");
		expect(percentFields().men).toHaveValue("");
		expect(screen.queryByText("Conforme")).not.toBeInTheDocument();
		expect(lastDraft()).toEqual({
			currentStep: STEP,
			executiveMenPercent: undefined,
			executivesCount: "two_or_more",
			executiveWomenPercent: undefined,
		});
	});
});

describe("Step2Executives — validité de l'étape (S6)", () => {
	it("reports the step as valid when the gap is not computable", async () => {
		const { lastStepValid } = renderStep();

		await userEvent.click(option(OPTIONS.none));

		expect(lastStepValid()).toBe(true);
	});

	it("reports the step as invalid while the percentages are incomplete", async () => {
		const { lastStepValid } = renderStep();

		await userEvent.click(option(OPTIONS.twoOrMore));

		expect(lastStepValid()).toBe(false);
	});

	it("reports the step as invalid while the sum differs from 100", async () => {
		const { lastStepValid } = renderStep();

		await enterWomenPercent("35");
		await retypeMenPercent("45");

		expect(lastStepValid()).toBe(false);
	});

	it("reports the step as valid again once the sum is back to 100", async () => {
		const { lastStepValid } = renderStep();

		await enterWomenPercent("35");
		await retypeMenPercent("45");
		await retypeMenPercent("65");

		expect(lastStepValid()).toBe(true);
	});

	it("reports a restored invalid draft as soon as it is mounted", () => {
		const { lastStepValid } = renderStep({
			initialDraft: { currentStep: STEP, ...MISMATCHED_EXECUTIVES },
		});

		expect(lastStepValid()).toBe(false);
	});
});

describe("Step2Executives — lecture seule", () => {
	it("disables the choices and freezes the percentages", async () => {
		const { onDraftChange } = renderStep({
			initialDraft: { currentStep: STEP, ...COMPUTABLE_EXECUTIVES },
			isReadOnly: true,
		});

		expect(option(OPTIONS.none)).toBeDisabled();
		expect(option(OPTIONS.one)).toBeDisabled();
		expect(option(OPTIONS.twoOrMore)).toBeDisabled();
		expect(percentFields().women).toHaveAttribute("readonly");
		expect(percentFields().men).toHaveAttribute("readonly");

		await userEvent.click(option(OPTIONS.none));
		await userEvent.type(percentFields().women, "10");

		expect(percentFields().women).toHaveValue("60");
		expect(screen.getByText("Conforme")).toBeInTheDocument();
		expect(onDraftChange).not.toHaveBeenCalled();
	});
});
