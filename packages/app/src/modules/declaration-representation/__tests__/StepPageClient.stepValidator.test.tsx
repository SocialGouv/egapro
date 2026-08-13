import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, mutateAsync, step } = vi.hoisted(() => ({
	push: vi.fn(),
	mutateAsync: vi.fn(),
	step: { validate: null as null | (() => boolean | Promise<boolean>) },
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
				useMutation: () => ({ mutate: vi.fn(), mutateAsync, isPending: false }),
			},
		},
	},
}));

// Stands in for any funnel step wired to the shared validator extension point.
vi.mock("../steps/StepPlaceholder", async () => {
	const { useEffect } = await import("react");
	const { useRepresentationDraftContext } = await import(
		"../shared/draft/DraftContext"
	);
	return {
		StepPlaceholder: function ValidatedStep() {
			const { registerStepValidator } = useRepresentationDraftContext();
			useEffect(() => {
				registerStepValidator(
					step.validate === null ? null : () => step.validate?.() ?? true,
				);
				return () => registerStepValidator(null);
			}, [registerStepValidator]);
			return <p>Étape validée par le composant</p>;
		},
	};
});

import { StepPageClient } from "~/modules/declaration-representation";

const CAMPAIGN_YEAR = 2026;
const YEAR = 2025;
// Step still backed by StepPlaceholder, so the mock below drives the whole step.
const PLACEHOLDER_STEP = 4;
const NEXT_STEP_HREF = "/declaration-representation/etape/5";

function renderStep() {
	return render(
		<StepPageClient
			campaignOpen
			campaignYear={CAMPAIGN_YEAR}
			initialDraft={{ currentStep: PLACEHOLDER_STEP }}
			step={PLACEHOLDER_STEP}
			year={YEAR}
		/>,
	);
}

function clickNext() {
	return userEvent.click(screen.getByRole("button", { name: "Suivant" }));
}

beforeEach(() => {
	push.mockReset();
	mutateAsync.mockReset().mockResolvedValue(undefined);
	step.validate = null;
});

describe("StepPageClient — step validator", () => {
	it("advances when the step registers no validator", async () => {
		renderStep();

		await clickNext();

		expect(mutateAsync).toHaveBeenCalledOnce();
		expect(push).toHaveBeenCalledWith(NEXT_STEP_HREF);
	});

	it("advances when the registered validator accepts the step", async () => {
		const validate = vi.fn(() => true);
		step.validate = validate;
		renderStep();

		await clickNext();

		expect(validate).toHaveBeenCalledOnce();
		expect(mutateAsync).toHaveBeenCalledOnce();
		expect(push).toHaveBeenCalledWith(NEXT_STEP_HREF);
	});

	it("saves nothing and stays on the step when the validator rejects it", async () => {
		step.validate = () => false;
		renderStep();

		await clickNext();

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Suivant" })).toBeEnabled();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("waits for an asynchronous validator before deciding", async () => {
		step.validate = () => Promise.resolve(false);
		renderStep();

		await clickNext();

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(push).not.toHaveBeenCalled();
	});

	it("advances on a later attempt once the validator accepts the step", async () => {
		const validate = vi.fn(() => false);
		step.validate = validate;
		renderStep();
		await clickNext();

		validate.mockReturnValue(true);
		await clickNext();

		expect(validate).toHaveBeenCalledTimes(2);
		expect(push).toHaveBeenCalledWith(NEXT_STEP_HREF);
	});
});
