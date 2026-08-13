import { render } from "@testing-library/react";
import { vi } from "vitest";

import {
	COMPUTABLE_EXECUTIVES,
	COMPUTABLE_MEMBERS,
	NO_EXECUTIVES,
	NO_MANAGEMENT_BODY,
	NON_COMPLIANT_MEMBERS,
	REPRESENTATION_YEAR,
	VALID_REFERENCE_PERIOD,
	WEBSITE_PUBLICATION,
} from "~/modules/declaration-representation/__tests__/fixtures";
import type { RepresentationDraftContextValue } from "~/modules/declaration-representation/shared/draft/DraftContext";
import { RepresentationDraftProvider } from "~/modules/declaration-representation/shared/draft/DraftContext";
import type { RepresentationDraft } from "~/modules/declaration-representation/types";
import { TOTAL_REPRESENTATION_STEPS } from "~/modules/declaration-representation/types";
import { Step5Review } from "../Step5Review";

export const PREVIOUS_HREF = "/declaration-representation/etape/4";

export const BOTH_COMPUTABLE = {
	...COMPUTABLE_EXECUTIVES,
	...COMPUTABLE_MEMBERS,
};
export const NOTHING_COMPUTABLE = { ...NO_EXECUTIVES, ...NO_MANAGEMENT_BODY };
export const FULLY_COMPLIANT = { ...BOTH_COMPUTABLE, ...WEBSITE_PUBLICATION };
export const SINGLE_GAP = {
	...COMPUTABLE_EXECUTIVES,
	...NON_COMPLIANT_MEMBERS,
	...WEBSITE_PUBLICATION,
};

export function renderReview({
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
