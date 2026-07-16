import { render, screen } from "@testing-library/react";
import type { FieldErrors } from "react-hook-form";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { ReferentFormFields } from "../ReferentFormFields";
import type { ReferentFormValues } from "../schemas";

function Harness({ errors }: { errors: FieldErrors<ReferentFormValues> }) {
	const { register, watch } = useForm<ReferentFormValues>({
		defaultValues: {
			principal: false,
			name: "",
			county: "",
			type: "email",
			value: "",
			substituteName: "",
			substituteEmail: "",
		},
	});
	return (
		<ReferentFormFields
			errors={errors}
			modalId="referent-modal"
			register={register}
			watch={watch}
		/>
	);
}

describe("ReferentFormFields", () => {
	it("renders fields without error attributes when there is no error", () => {
		render(<Harness errors={{}} />);
		// Anchored on the field's own label ("Nom"), decoupled from the hint
		// wording; the negative lookahead avoids matching "Nom du suppléant".
		const nameInput = screen.getByRole("textbox", { name: /^Nom(?! du)/ });
		expect(nameInput).not.toHaveAttribute("aria-invalid");
		expect(nameInput).not.toHaveAttribute("aria-describedby");
		const regionSelect = screen.getByLabelText("Région");
		expect(regionSelect).not.toHaveAttribute("aria-invalid");
		expect(regionSelect).not.toHaveAttribute("aria-describedby");
	});

	it("associates the name error with its input (RGAA 11.10)", () => {
		render(
			<Harness
				errors={{
					name: { type: "required", message: "Le nom est obligatoire" },
				}}
			/>,
		);
		// Anchored on the field's own label ("Nom"), decoupled from the hint
		// wording; the negative lookahead avoids matching "Nom du suppléant".
		const nameInput = screen.getByRole("textbox", { name: /^Nom(?! du)/ });
		expect(nameInput).toHaveAttribute("aria-invalid", "true");
		expect(nameInput).toHaveAttribute(
			"aria-describedby",
			"referent-modal-name-error",
		);
		expect(screen.getByText("Le nom est obligatoire")).toHaveAttribute(
			"id",
			"referent-modal-name-error",
		);
	});

	it("associates the region error with its select (RGAA 11.10)", () => {
		render(
			<Harness
				errors={{
					region: {
						type: "invalid_type",
						message: "La région est obligatoire",
					},
				}}
			/>,
		);
		const regionSelect = screen.getByLabelText("Région");
		expect(regionSelect).toHaveAttribute("aria-invalid", "true");
		expect(regionSelect).toHaveAttribute(
			"aria-describedby",
			"referent-modal-region-error",
		);
		expect(screen.getByText("La région est obligatoire")).toHaveAttribute(
			"id",
			"referent-modal-region-error",
		);
	});

	it("associates the value error with its input (RGAA 11.10)", () => {
		render(
			<Harness
				errors={{
					value: { type: "invalid_string", message: "L'email est invalide" },
				}}
			/>,
		);
		const valueInput = screen.getByRole("textbox", { name: /^Valeur/ });
		expect(valueInput).toHaveAttribute("aria-invalid", "true");
		expect(valueInput).toHaveAttribute(
			"aria-describedby",
			"referent-modal-value-error",
		);
		expect(screen.getByText("L'email est invalide")).toHaveAttribute(
			"id",
			"referent-modal-value-error",
		);
	});

	it("associates the substitute email error with its input (RGAA 11.10)", () => {
		render(
			<Harness
				errors={{
					substituteEmail: {
						type: "invalid_string",
						message: "L'email du suppléant est invalide",
					},
				}}
			/>,
		);
		const substituteEmailInput = screen.getByRole("textbox", {
			name: "Email du suppléant",
		});
		expect(substituteEmailInput).toHaveAttribute("aria-invalid", "true");
		expect(substituteEmailInput).toHaveAttribute(
			"aria-describedby",
			"referent-modal-sub-email-error",
		);
		expect(
			screen.getByText("L'email du suppléant est invalide"),
		).toHaveAttribute("id", "referent-modal-sub-email-error");
	});
});
