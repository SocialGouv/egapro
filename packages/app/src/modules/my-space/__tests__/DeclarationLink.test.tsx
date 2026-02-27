import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { DeclarationLink } from "../DeclarationLink";

describe("DeclarationLink", () => {
	it("renders as a link when userPhone is provided", () => {
		render(
			<DeclarationLink
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
			<DeclarationLink siren="532847196" type="remuneration" userPhone={null}>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toBeInTheDocument();
	});

	it("has aria-controls pointing to the missing info modal", () => {
		render(
			<DeclarationLink siren="532847196" type="remuneration" userPhone={null}>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toHaveAttribute("aria-controls", "missing-info-modal");
	});
});
