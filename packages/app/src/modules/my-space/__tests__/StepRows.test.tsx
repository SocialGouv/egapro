import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	DECLARATION_REMUNERATION_RECAP,
	DECLARATION_REMUNERATION_RECAP_CORRECTION,
	FIRST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";
import {
	BulletList,
	BulletRow,
	DeadlineRow,
	TransmittedRow,
} from "../StepRows";

const MODIFY_HREF = remunerationStepHref(FIRST_REMUNERATION_STEP);

describe("TransmittedRow", () => {
	it("renders the label and the check icon", () => {
		const { getByText, container } = render(
			<TransmittedRow label="Votre déclaration a été transmise" />,
		);
		expect(getByText("Votre déclaration a été transmise")).toBeInTheDocument();
		expect(container.querySelector(".fr-icon-check-line")).toBeInTheDocument();
	});

	it("with a modification: shows the modify affordance", () => {
		const { getByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				modification={{ href: MODIFY_HREF }}
			/>,
		);
		expect(getByText("Modifier")).toHaveAttribute("href", MODIFY_HREF);
	});

	it("renders the mention it is given under the label", () => {
		const { getByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				mention="Modifiable jusqu'à votre prochaine transmission"
				modification={{ href: MODIFY_HREF }}
			/>,
		);
		expect(
			getByText("Modifiable jusqu'à votre prochaine transmission"),
		).toBeInTheDocument();
	});

	it("without a mention: renders no mention, even with a modification", () => {
		const { container, getByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				modification={{ href: MODIFY_HREF }}
			/>,
		);
		expect(getByText("Modifier")).toBeInTheDocument();
		expect(container.textContent).not.toMatch(/Modifiable jusqu'/);
		expect(container.textContent).not.toMatch(/Modification close/);
	});

	it("without a modification: renders no modify button (immutable once transmitted)", () => {
		const { queryByText } = render(
			<TransmittedRow
				label="Votre déclaration a été transmise"
				viewHref={DECLARATION_REMUNERATION_RECAP}
			/>,
		);
		expect(queryByText(/Modifiable jusqu'/)).not.toBeInTheDocument();
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

describe("BulletList", () => {
	it("keeps its list semantics with an explicit role despite list-style: none", () => {
		const { container, getAllByRole } = render(
			<BulletList>
				<BulletRow>Premier</BulletRow>
				<BulletRow>Second</BulletRow>
			</BulletList>,
		);
		expect(container.querySelector("ul")).toHaveAttribute("role", "list");
		expect(getAllByRole("listitem")).toHaveLength(2);
	});

	it("hides the decorative bullet from assistive technologies", () => {
		const { container } = render(
			<BulletList>
				<BulletRow>Premier</BulletRow>
			</BulletList>,
		);
		expect(container.querySelector("li > span")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
	});
});
