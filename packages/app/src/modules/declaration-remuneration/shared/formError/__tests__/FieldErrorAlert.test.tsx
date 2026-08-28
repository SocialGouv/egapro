import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FieldErrorAlert } from "../FieldErrorAlert";
import type { FieldError } from "../types";

const ALERT_ID = "test-error";

const EMPTY_WOMEN: FieldError = {
	fieldId: "row1-f",
	category: "empty",
	message: "Renseignez le montant Annuelle brute moyenne pour les femmes.",
};

const EMPTY_MEN: FieldError = {
	fieldId: "row1-h",
	category: "empty",
	message: "Renseignez le montant Annuelle brute moyenne pour les hommes.",
};

const INVALID: FieldError = {
	fieldId: "row2-f",
	category: "invalid",
	message: "Le nombre de bénéficiaires ne peut pas dépasser l'effectif.",
};

describe("FieldErrorAlert", () => {
	it("renders nothing without errors", () => {
		const { container } = render(<FieldErrorAlert errors={[]} id={ALERT_ID} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("titles the alert with the error category and names the field", () => {
		render(<FieldErrorAlert errors={[EMPTY_WOMEN]} id={ALERT_ID} />);

		const alert = screen.getByRole("alert");
		expect(within(alert).getByText("Champ vide")).toBeInTheDocument();
		expect(alert).toHaveTextContent(EMPTY_WOMEN.message);
	});

	it("exposes the message under the id inputs point at", () => {
		render(<FieldErrorAlert errors={[EMPTY_WOMEN]} id={ALERT_ID} />);

		expect(screen.getByText(EMPTY_WOMEN.message)).toHaveAttribute(
			"id",
			`${ALERT_ID}-empty`,
		);
	});

	it("lists several messages of the same category in one alert", () => {
		render(<FieldErrorAlert errors={[EMPTY_WOMEN, EMPTY_MEN]} id={ALERT_ID} />);

		const alert = screen.getByRole("alert");
		expect(within(alert).getAllByRole("listitem")).toHaveLength(2);
	});

	it("splits distinct categories into their own alert", () => {
		render(<FieldErrorAlert errors={[EMPTY_WOMEN, INVALID]} id={ALERT_ID} />);

		const alerts = screen.getAllByRole("alert");
		expect(alerts).toHaveLength(2);
		expect(alerts[0]).toHaveTextContent("Champ vide");
		expect(alerts[1]).toHaveTextContent("Valeur invalide");
	});

	it("renders anchored messages as links to the offending input", () => {
		render(
			<FieldErrorAlert
				errors={[{ ...EMPTY_WOMEN, anchor: true }]}
				id={ALERT_ID}
			/>,
		);

		expect(
			screen.getByRole("link", { name: EMPTY_WOMEN.message }),
		).toHaveAttribute("href", `#${EMPTY_WOMEN.fieldId}`);
	});

	it("can be dismissed", async () => {
		const user = userEvent.setup();
		render(<FieldErrorAlert errors={[EMPTY_WOMEN]} id={ALERT_ID} />);

		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(document.getElementById(`${ALERT_ID}-empty`)).toHaveTextContent(
			EMPTY_WOMEN.message,
		);
	});

	it("comes back and receives focus after an identical failed submission", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<FieldErrorAlert
				errors={[EMPTY_WOMEN]}
				id={ALERT_ID}
				validationAttempt={1}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);
		rerender(
			<FieldErrorAlert
				errors={[EMPTY_WOMEN]}
				id={ALERT_ID}
				validationAttempt={2}
			/>,
		);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(EMPTY_WOMEN.message);
		await waitFor(() => expect(alert).toHaveFocus());
	});

	it("comes back when a new error set arrives after a dismissal", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<FieldErrorAlert errors={[EMPTY_WOMEN]} id={ALERT_ID} />,
		);

		await user.click(
			screen.getByRole("button", { name: "Masquer le message" }),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();

		rerender(<FieldErrorAlert errors={[EMPTY_MEN]} id={ALERT_ID} />);

		expect(screen.getByRole("alert")).toHaveTextContent(EMPTY_MEN.message);
	});
});
