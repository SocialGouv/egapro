import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	DECLARATION_REMUNERATION_RECAP,
	DECLARATION_REMUNERATION_RECAP_CORRECTION,
	FIRST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";
import { DeadlineRow, TransmittedRow } from "../StepRows";

const FUTURE_DEADLINE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
const PAST_DEADLINE = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
const MODIFY_HREF = remunerationStepHref(FIRST_REMUNERATION_STEP);

describe("TransmittedRow", () => {
	it("renders the label and the check icon", () => {
		const { getByText, container } = render(
			<TransmittedRow label="Votre déclaration a été transmise" />,
		);
		expect(getByText("Votre déclaration a été transmise")).toBeInTheDocument();
		expect(container.querySelector(".fr-icon-check-line")).toBeInTheDocument();
	});

	it("with a modification window still open: shows the modify affordance and its date", () => {
		const { getByText, queryByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				modification={{ href: MODIFY_HREF, until: FUTURE_DEADLINE }}
			/>,
		);
		expect(getByText(/Modifiable jusqu'au/)).toBeInTheDocument();
		expect(queryByText(/Modification close depuis le/)).not.toBeInTheDocument();
		expect(getByText("Modifier")).toHaveAttribute("href", MODIFY_HREF);
	});

	it("with a modification window already closed: shows the closed wording and hides the modify button", () => {
		const { getByText, queryByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				modification={{ href: MODIFY_HREF, until: PAST_DEADLINE }}
			/>,
		);
		expect(getByText(/Modification close depuis le/)).toBeInTheDocument();
		expect(queryByText("Modifier")).not.toBeInTheDocument();
	});

	it("without a modification: renders neither the deadline wording nor a modify button (Repeq — immutable once transmitted)", () => {
		const { queryByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				viewHref={DECLARATION_REMUNERATION_RECAP}
			/>,
		);
		expect(queryByText(/Modifiable jusqu'au/)).not.toBeInTheDocument();
		expect(queryByText(/Modification close depuis le/)).not.toBeInTheDocument();
		expect(queryByText("Modifier")).not.toBeInTheDocument();
	});

	it("without a viewHref: renders no view button", () => {
		const { container } = render(
			<TransmittedRow label="Votre déclaration a été transmise" />,
		);
		expect(
			container.querySelector(".fr-icon-eye-line"),
		).not.toBeInTheDocument();
	});

	it("with a viewHref: renders a view button using the default label", () => {
		const { getByTitle } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				viewHref={DECLARATION_REMUNERATION_RECAP}
			/>,
		);
		const viewButton = getByTitle("Voir le récapitulatif de la déclaration");
		expect(viewButton).toHaveAttribute("href", DECLARATION_REMUNERATION_RECAP);
	});

	it("with a custom viewLabel: overrides the default view button label", () => {
		const { getByTitle } = render(
			<TransmittedRow
				label="Votre seconde déclaration a été transmise"
				viewHref={DECLARATION_REMUNERATION_RECAP_CORRECTION}
				viewLabel="Voir le récapitulatif de la seconde déclaration"
			/>,
		);
		expect(
			getByTitle("Voir le récapitulatif de la seconde déclaration"),
		).toBeInTheDocument();
	});
});

describe("DeadlineRow", () => {
	it("renders the deadline with the calendar icon", () => {
		const { container, getByText } = render(
			<DeadlineRow date={new Date(2026, 2, 1)} />,
		);
		expect(
			container.querySelector(".fr-icon-calendar-line"),
		).toBeInTheDocument();
		expect(getByText(/Échéance :/)).toBeInTheDocument();
	});
});
