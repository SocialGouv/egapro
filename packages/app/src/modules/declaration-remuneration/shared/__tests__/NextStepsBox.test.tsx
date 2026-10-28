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

	it("keeps the first declaration headings and aligns its wording on objective criteria not based on sex", () => {
		render(
			<NextStepsBox
				cseApplicable
				cseOpinionRequired
				hasGapsAboveThreshold
				siren="123456789"
			/>,
		);

		expect(
			screen.getByRole("heading", { level: 3, name: "Prochaines étapes" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				level: 4,
				name: "Informer et consulter le CSE",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 4, name: "Actions à engager" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Justifier les écarts par des critères objectifs et non fondés sur le sexe.",
			),
		).toBeInTheDocument();
		expect(screen.getByText(/vous pouvez :/)).toBeInTheDocument();
		expect(screen.queryByText(/non sexistes/)).not.toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /Qu'entend-on par critères objectifs et non fondés sur le sexe \?/,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur actions correctives et seconde déclaration/,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
			}),
		).toBeInTheDocument();
	});

	it("keeps the joint evaluation link at the first declaration even without gaps", () => {
		render(
			<NextStepsBox
				cseApplicable={false}
				cseOpinionRequired={false}
				hasGapsAboveThreshold={false}
				siren="123456789"
			/>,
		);

		expect(
			screen.getByRole("link", {
				name: /En savoir plus sur l'évaluation conjointe des rémunérations/,
			}),
		).toBeInTheDocument();
	});

	it("titles the second declaration sections at a single level, without a box heading", () => {
		render(
			<NextStepsBox
				cseApplicable
				cseOpinionRequired
				hasGapsAboveThreshold
				isSecondDeclaration
				siren="123456789"
			/>,
		);

		expect(
			screen
				.getAllByRole("heading")
				.map((heading) => [heading.tagName, heading.textContent]),
		).toEqual([
			["H3", "Rappel : informer et consulter le CSE"],
			["H3", "Prochaines étapes"],
			["H3", "Pour vous aider"],
		]);
	});
});
