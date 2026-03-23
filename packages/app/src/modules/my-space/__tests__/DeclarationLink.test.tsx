import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeclarationLink } from "../DeclarationLink";

describe("DeclarationLink", () => {
	it("renders as a link when userPhone is provided and hasCse is set", () => {
		render(
			<DeclarationLink
				hasCse={true}
				siren="532847196"
				type="remuneration"
				userPhone="0122334455"
			>
				Rémunération
			</DeclarationLink>,
		);
		const link = screen.getByRole("link", { name: "Rémunération" });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"/declaration-remuneration?siren=532847196",
		);
	});

	it("renders as a button when userPhone is null", () => {
		render(
			<DeclarationLink hasCse={true} siren="532847196" type="remuneration" userPhone={null}>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toBeInTheDocument();
	});

	it("renders as a button when hasCse is null", () => {
		render(
			<DeclarationLink hasCse={null} siren="532847196" type="remuneration" userPhone="0122334455">
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toBeInTheDocument();
	});

	it("has aria-controls pointing to the missing info modal", () => {
		render(
			<DeclarationLink hasCse={true} siren="532847196" type="remuneration" userPhone={null}>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toHaveAttribute("aria-controls", "missing-info-modal");
	});
});
