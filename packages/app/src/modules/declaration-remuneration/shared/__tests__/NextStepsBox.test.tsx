import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { NextStepsBox } from "../NextStepsBox";

vi.mock("~/modules/analytics", () => ({
	TrackedLink: ({
		children,
		href,
		...props
	}: {
		children: ReactNode;
		href: string;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("../UpdateCseModal", () => ({
	UpdateCseModal: () => null,
}));

describe("NextStepsBox", () => {
	it("explains that CSE templates are unavailable without linking to the CSE workflow", () => {
		render(
			<NextStepsBox
				cseApplicable
				cseOpinionRequired
				hasGapsAboveThreshold={false}
				siren="123456789"
			/>,
		);

		expect(
			screen.getByText(
				"Les modèles d'avis du CSE ne sont pas encore disponibles.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /modèles d'avis CSE/i }),
		).toBeNull();
		expect(
			screen.getByRole("button", {
				name: "Mettre à jour l'existence d'un CSE",
			}),
		).toBeInTheDocument();
	});
});
