import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { VariablePayIndicatorPanel } from "./VariablePayIndicatorPanel";

const props = {
	variableAnnualMeanGap: -0.025,
	variableAnnualMedianGap: 0,
	variableHourlyMeanGap: 0.207,
	variableHourlyMedianGap: 0.3127,
	variableProportionWomen: 0.667,
	variableProportionMen: 0.571,
};

describe("VariablePayIndicatorPanel", () => {
	it("renders the hourly Figma variant by default", () => {
		render(<VariablePayIndicatorPanel {...props} />);

		expect(screen.getByRole("radio", { name: "Horaire" })).toBeChecked();
		expect(screen.getByText("20,7 %")).toBeInTheDocument();
		expect(screen.getByText("31,27 %")).toBeInTheDocument();
		expect(screen.getAllByText("Écart en faveur des hommes")).toHaveLength(2);
		expect(screen.getByText("Femmes :")).toHaveTextContent("Femmes : 66,7 %");
		expect(screen.getByText("Homme :")).toHaveTextContent("Homme : 57,1 %");
	});

	it("switches to annual values and exposes the gap direction", async () => {
		const user = userEvent.setup();
		render(<VariablePayIndicatorPanel {...props} />);

		await user.click(screen.getByRole("radio", { name: "Annuelle" }));

		expect(screen.getByText("-2,5 %")).toBeInTheDocument();
		expect(screen.getByText("Écart en faveur des femmes")).toBeInTheDocument();
		expect(screen.getByText("Aucun écart constaté")).toBeInTheDocument();
	});

	it("opens the detail table by default and lets the user collapse it", async () => {
		const user = userEvent.setup();
		render(<VariablePayIndicatorPanel {...props} />);

		const button = screen.getByRole("button", { name: "Détails des données" });
		expect(button).toHaveAttribute("aria-expanded", "true");
		expect(
			screen.getByRole("table", {
				name: "Proportion de bénéficiaires par sexe",
			}),
		).toBeInTheDocument();

		await user.click(button);
		expect(button).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.queryByRole("table", {
				name: "Proportion de bénéficiaires par sexe",
			}),
		).not.toBeInTheDocument();
	});
});
