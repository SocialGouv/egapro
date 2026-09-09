import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR } from "~/modules/domain";
import { GapReminderCallout } from "../GapReminderCallout";

const RAISED_TARGET_YEAR = REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR;
const INITIAL_TARGET_YEAR = RAISED_TARGET_YEAR - 1;

describe("GapReminderCallout", () => {
	it("renders the compliant variant with the given population label", () => {
		render(
			<GapReminderCallout
				campaignYear={INITIAL_TARGET_YEAR}
				populationLabel="des cadres dirigeants"
				verdict="compliant"
			/>,
		);

		expect(screen.getByText("Objectif de 30 % atteint")).toBeInTheDocument();
		expect(
			screen.getByText(/au moins 30 % des cadres dirigeants/),
		).toBeInTheDocument();
	});

	it("renders the non-compliant variant with the given population label", () => {
		render(
			<GapReminderCallout
				campaignYear={INITIAL_TARGET_YEAR}
				populationLabel="des membres des instances dirigeantes"
				verdict="non_compliant"
			/>,
		);

		expect(
			screen.getByText("Objectif de 30 % non atteint"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/au moins 30 % des membres des instances dirigeantes/),
		).toBeInTheDocument();
	});

	it("reflects the raised threshold once the campaign reaches it", () => {
		render(
			<GapReminderCallout
				campaignYear={RAISED_TARGET_YEAR}
				populationLabel="des membres des instances dirigeantes"
				verdict="non_compliant"
			/>,
		);

		expect(
			screen.getByText("Objectif de 40 % non atteint"),
		).toBeInTheDocument();
	});

	it("always mentions the raised threshold and the campaign it takes effect from", () => {
		render(
			<GapReminderCallout
				campaignYear={INITIAL_TARGET_YEAR}
				populationLabel="des cadres dirigeants"
				verdict="compliant"
			/>,
		);

		expect(
			screen.getByText(
				new RegExp(`${RAISED_TARGET_YEAR}.*ce seuil passera à 40 %`, "s"),
			),
		).toBeInTheDocument();
	});
});
