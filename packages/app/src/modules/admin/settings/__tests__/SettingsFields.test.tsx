import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsReadOnlyField } from "../SettingsFields";

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
