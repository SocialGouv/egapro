import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsDateField, SettingsReadOnlyField } from "../SettingsFields";

describe("SettingsReadOnlyField", () => {
	it("follows its value prop while staying read-only", () => {
		const props = {
			hint: "Calculée",
			id: "readonly-field",
			label: "Échéance calculée",
			type: "date",
		} as const;
		const { rerender } = render(
			<SettingsReadOnlyField {...props} value="2027-01-01" />,
		);
		const input = screen.getByLabelText(/échéance calculée/i);
		expect(input).toHaveValue("2027-01-01");
		expect(input).toHaveAttribute("readonly");

		rerender(<SettingsReadOnlyField {...props} value="2027-02-02" />);
		expect(screen.getByLabelText(/échéance calculée/i)).toHaveValue(
			"2027-02-02",
		);
	});
});

describe("SettingsDateField", () => {
	const registration = {
		name: "deadline",
		onBlur: async () => undefined,
		onChange: async () => undefined,
		ref: () => undefined,
	};

	function renderWithNote(error: string | undefined) {
		return render(
			<>
				<p id="required-note">Tous les champs sont obligatoires.</p>
				<SettingsDateField
					error={error}
					id="deadline"
					label="Échéance"
					registration={registration}
					required
					requiredNoteId="required-note"
				/>
			</>,
		);
	}

	it("cites the required-fields mention when the field is required", () => {
		renderWithNote(undefined);
		const input = screen.getByLabelText("Échéance");
		expect(input).toBeRequired();
		expect(input).toHaveAttribute("aria-describedby", "required-note");
		expect(input).toHaveAccessibleDescription(
			"Tous les champs sont obligatoires.",
		);
	});

	it("cites the mention first, then the error message", () => {
		renderWithNote("Date invalide.");
		const input = screen.getByLabelText("Échéance");
		expect(input).toHaveAttribute(
			"aria-describedby",
			"required-note deadline-error",
		);
		expect(input).toHaveAccessibleDescription(
			"Tous les champs sont obligatoires. Date invalide.",
		);
		expect(input).toHaveAttribute("aria-invalid", "true");
	});

	it("has no description when optional and valid", () => {
		render(
			<SettingsDateField
				error={undefined}
				id="optional"
				label="Facultative"
				registration={registration}
				required={false}
			/>,
		);
		const input = screen.getByLabelText("Facultative");
		expect(input).not.toBeRequired();
		expect(input).not.toHaveAttribute("aria-describedby");
	});

	it("is described by its error alone when optional and invalid", () => {
		render(
			<SettingsDateField
				error="Date invalide."
				id="optional"
				label="Facultative"
				registration={registration}
				required={false}
			/>,
		);
		expect(screen.getByLabelText("Facultative")).toHaveAccessibleDescription(
			"Date invalide.",
		);
	});
});
