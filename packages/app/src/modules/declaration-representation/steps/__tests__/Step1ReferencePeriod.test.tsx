import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, mutate, mutateAsync } = vi.hoisted(() => ({
	push: vi.fn(),
	mutate: vi.fn(),
	mutateAsync: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push,
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		representationDeclaration: {
			saveDraft: {
				useMutation: () => ({ mutate, mutateAsync, isPending: false }),
			},
		},
	},
}));

import type { RepresentationDraft } from "~/modules/declaration-representation";
import { StepPageClient } from "~/modules/declaration-representation";

const CAMPAIGN_YEAR = 2026;
const YEAR = 2025;
const STEP_2_HREF = "/declaration-representation/etape/2";
const REQUIRED_MESSAGE = "Sélectionner une date de début ou une date de fin.";
const REFERENCE_YEAR_MESSAGE = `La date sélectionnée ne correspond pas à l'année de référence ${YEAR}.`;
const TWELVE_MONTHS_HINT = "La période couvre 12 mois consécutifs.";
const VALID_START = "2025-01-01";
const VALID_END = "2025-12-31";

function renderStep1({
	campaignOpen = true,
	initialDraft = { currentStep: 1 } as RepresentationDraft,
} = {}) {
	return render(
		<StepPageClient
			campaignOpen={campaignOpen}
			campaignYear={CAMPAIGN_YEAR}
			initialDraft={initialDraft}
			step={1}
			year={YEAR}
		/>,
	);
}

function startInput() {
	return screen.getByLabelText(/Date de début/);
}

function endInput() {
	return screen.getByLabelText(/Date de fin/);
}

function fillPeriod({ start, end }: { start?: string; end?: string }) {
	if (start !== undefined) {
		fireEvent.change(startInput(), { target: { value: start } });
	}
	if (end !== undefined) {
		fireEvent.change(endInput(), { target: { value: end } });
	}
}

function clickNext() {
	return userEvent.click(screen.getByRole("button", { name: "Suivant" }));
}

beforeEach(() => {
	push.mockReset();
	mutate.mockReset();
	mutateAsync.mockReset().mockResolvedValue(undefined);
});

describe("Step1ReferencePeriod — rendering", () => {
	it("announces the reference year and asks for both dates", () => {
		renderStep1();

		expect(screen.getByText("Période de référence")).toBeInTheDocument();
		expect(screen.getByText(String(YEAR))).toBeInTheDocument();
		expect(startInput()).toHaveValue("");
		expect(endInput()).toHaveValue("");
	});

	it("greys out dates that cannot satisfy the period rules", () => {
		renderStep1();

		expect(startInput()).toHaveAttribute("min", "2024-01-02");
		expect(startInput()).toHaveAttribute("max", "2025-01-01");
		expect(endInput()).toHaveAttribute("min", "2025-01-01");
		expect(endInput()).toHaveAttribute("max", "2025-12-31");
	});

	it("pre-fills both dates from the stored draft (S22)", () => {
		renderStep1({
			initialDraft: {
				currentStep: 2,
				referencePeriodEnd: VALID_END,
				referencePeriodStart: VALID_START,
			},
		});

		expect(startInput()).toHaveValue(VALID_START);
		expect(endInput()).toHaveValue(VALID_END);
	});

	it("locks the dates when the campaign is closed (S23)", () => {
		renderStep1({
			campaignOpen: false,
			initialDraft: {
				currentStep: 1,
				referencePeriodEnd: VALID_END,
				referencePeriodStart: VALID_START,
			},
		});

		expect(startInput()).toHaveAttribute("readonly");
		expect(endInput()).toHaveAttribute("readonly");
		expect(
			screen.queryByRole("button", { name: "Suivant" }),
		).not.toBeInTheDocument();
	});

	it("announces the date errors but leaves the twelve-month hint silent", async () => {
		renderStep1();

		expect(
			screen.getByText(TWELVE_MONTHS_HINT).closest("[aria-live]"),
		).toBeNull();

		await clickNext();

		expect(
			screen.getByText(REQUIRED_MESSAGE).closest("[aria-live='polite']"),
		).not.toBeNull();
		expect(
			screen.getByText(TWELVE_MONTHS_HINT).closest("[aria-live]"),
		).toBeNull();
	});
});

describe("Step1ReferencePeriod — auto-fill", () => {
	it("derives the end date from the start date and announces it", () => {
		renderStep1();

		fillPeriod({ start: VALID_START });

		expect(endInput()).toHaveValue(VALID_END);
		expect(
			screen.getByText("Date de fin : 31/12/2025 renseignée automatiquement."),
		).toBeInTheDocument();
	});

	it("derives the start date from the end date and announces it", () => {
		renderStep1();

		fillPeriod({ end: VALID_END });

		expect(startInput()).toHaveValue(VALID_START);
		expect(
			screen.getByText(
				"Date de début : 01/01/2025 renseignée automatiquement.",
			),
		).toBeInTheDocument();
	});

	it("derives the day before the anniversary for a leap-day start", () => {
		renderStep1();

		fillPeriod({ start: "2024-02-29" });

		expect(endInput()).toHaveValue("2025-02-28");
	});

	it("round-trips a leap-day period from the end date", () => {
		renderStep1();

		fillPeriod({ end: "2025-02-28" });

		expect(startInput()).toHaveValue("2024-02-29");
	});

	it("clears the other date when a date is emptied", () => {
		renderStep1();

		fillPeriod({ start: VALID_START });
		fillPeriod({ start: "" });

		expect(endInput()).toHaveValue("");
	});
});

describe("Step1ReferencePeriod — submit validation", () => {
	it("requires both dates before advancing", async () => {
		renderStep1();

		await clickNext();

		expect(screen.getByText(REQUIRED_MESSAGE)).toBeInTheDocument();
		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("rejects an end date outside the reference year", async () => {
		renderStep1();

		fillPeriod({ end: "2024-12-31" });
		await clickNext();

		expect(screen.getByText(REFERENCE_YEAR_MESSAGE)).toBeInTheDocument();
		expect(endInput()).toHaveAttribute("aria-invalid", "true");
		expect(push).not.toHaveBeenCalled();
	});

	it("rejects a start date whose year cannot open the reference period", async () => {
		renderStep1();

		fillPeriod({ start: "2027-04-03" });
		await clickNext();

		// The derived end date (2028-04-02) is out of range too, so the same
		// message shows under both fields.
		expect(screen.getAllByText(REFERENCE_YEAR_MESSAGE)).not.toHaveLength(0);
		expect(startInput()).toHaveAttribute("aria-invalid", "true");
		expect(push).not.toHaveBeenCalled();
	});

	it("advances once a rejected period has been corrected", async () => {
		renderStep1();
		fillPeriod({ start: "2027-04-03" });
		await clickNext();

		fillPeriod({ start: VALID_START });
		await clickNext();

		expect(screen.queryByText(REFERENCE_YEAR_MESSAGE)).not.toBeInTheDocument();
		expect(screen.queryByText(REQUIRED_MESSAGE)).not.toBeInTheDocument();
		expect(push).toHaveBeenCalledWith(STEP_2_HREF);
	});
});

describe("Step1ReferencePeriod — valid period", () => {
	it("saves the period with the progress and moves to the next step", async () => {
		renderStep1();

		fillPeriod({ end: VALID_END, start: VALID_START });
		await clickNext();

		expect(mutateAsync).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 2,
			draft: {
				currentStep: 2,
				referencePeriodEnd: VALID_END,
				referencePeriodStart: VALID_START,
			},
		});
		expect(push).toHaveBeenCalledWith(STEP_2_HREF);
	});

	it("hands the typed period to the autosave draft", async () => {
		const { unmount } = renderStep1();

		fillPeriod({ end: VALID_END, start: VALID_START });
		unmount();

		expect(mutate).toHaveBeenCalledWith({
			year: YEAR,
			currentStep: 1,
			draft: {
				currentStep: 1,
				referencePeriodEnd: VALID_END,
				referencePeriodStart: VALID_START,
			},
		});
	});
});
