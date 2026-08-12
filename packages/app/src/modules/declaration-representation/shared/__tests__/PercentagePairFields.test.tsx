import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { PercentagePairValues } from "../PercentagePairFields";
import {
	complementPercentage,
	isPercentageInput,
	PercentagePairFields,
} from "../PercentagePairFields";

const LEGEND = "Écarts de représentation parmi les cadres dirigeants";

type HarnessProps = {
	error?: string;
	disabled?: boolean;
	hint?: string;
	womenLabel?: string;
	menLabel?: string;
};

function Harness(props: HarnessProps = {}) {
	const [values, setValues] = useState<PercentagePairValues>({
		womenPercent: "",
		menPercent: "",
	});

	return (
		<PercentagePairFields
			{...props}
			legend={LEGEND}
			onChange={setValues}
			values={values}
		/>
	);
}

function fields() {
	return {
		women: screen.getByLabelText(/Femmes/) as HTMLInputElement,
		men: screen.getByLabelText(/Hommes/) as HTMLInputElement,
	};
}

describe("PercentagePairFields — auto-complement (S5)", () => {
	it("fills the men field with 100 − x when the women percentage is typed", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "35");

		expect(women).toHaveValue("35");
		expect(men).toHaveValue("65");
	});

	it("fills the women field when the men percentage is typed first", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(men, "40");

		expect(men).toHaveValue("40");
		expect(women).toHaveValue("60");
	});

	it("complements a one-decimal percentage typed with a comma", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "35,5");

		expect(women).toHaveValue("35,5");
		expect(men).toHaveValue("64.5");
	});
});

describe("PercentagePairFields — manual override (S6)", () => {
	it("keeps the auto-filled field editable and stops recomputing the other one", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "35");
		await userEvent.clear(men);
		await userEvent.type(men, "70");

		expect(men).toHaveValue("70");
		expect(women).toHaveValue("35");
	});

	it("no longer complements the men field once it has been edited by hand", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(men, "70");
		await userEvent.clear(women);
		await userEvent.type(women, "10");

		expect(women).toHaveValue("10");
		expect(men).toHaveValue("70");
	});
});

describe("PercentagePairFields — input filtering", () => {
	it("refuses a second decimal digit", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "12.34");

		expect(women).toHaveValue("12.3");
		expect(men).toHaveValue("87.7");
	});

	it("refuses a fourth integer digit", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "1000");

		expect(women).toHaveValue("100");
		expect(men).toHaveValue("0");
	});

	it("leaves the other field untouched while the entry is out of the 0–100 range", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "150");

		expect(women).toHaveValue("150");
		expect(men).toHaveValue("85");
	});

	it("refuses an invalid entry in the men field too", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(men, "40");
		await userEvent.type(men, "abc");

		expect(men).toHaveValue("40");
		expect(women).toHaveValue("60");
	});

	it("leaves the other field untouched on an incomplete or empty entry", async () => {
		render(<Harness />);
		const { women, men } = fields();

		await userEvent.type(women, "20");
		await userEvent.type(women, ".");
		expect(men).toHaveValue("80");

		await userEvent.clear(women);
		expect(women).toHaveValue("");
		expect(men).toHaveValue("80");
	});
});

describe("PercentagePairFields — accessibility and states", () => {
	it("associates each label with its input and exposes the hint", () => {
		render(<Harness />);
		const { women, men } = fields();

		expect(women.id).not.toBe("");
		expect(men.id).not.toBe("");
		expect(women.id).not.toBe(men.id);
		expect(screen.getByText(LEGEND).tagName).toBe("LEGEND");

		const hint = screen.getByText(
			"La saisie d'un pourcentage calcule automatiquement l'autre.",
		);
		expect(women).toHaveAttribute("aria-describedby", hint.id);
		expect(men).toHaveAttribute("aria-describedby", hint.id);
	});

	it("supports custom labels and hint", () => {
		render(
			<Harness
				hint="Le total doit atteindre 100 %."
				menLabel="Hommes cadres"
				womenLabel="Femmes cadres"
			/>,
		);

		const hint = screen.getByText("Le total doit atteindre 100 %.");
		expect(screen.getByLabelText(/Femmes cadres/)).toHaveAttribute(
			"aria-describedby",
			hint.id,
		);
		expect(screen.getByLabelText(/Hommes cadres/)).toBeInTheDocument();
	});

	it("describes nothing when there is neither hint nor error", () => {
		render(<Harness hint="" />);
		const { women, men } = fields();

		expect(women).not.toHaveAttribute("aria-describedby");
		expect(men).not.toHaveAttribute("aria-describedby");
		expect(women).not.toHaveAttribute("aria-invalid");
	});

	it("wires the error message to both inputs", () => {
		render(
			<Harness error="La somme des pourcentages doit être égale à 100 %." />,
		);
		const { women, men } = fields();

		const message = screen.getByText(
			"La somme des pourcentages doit être égale à 100 %.",
		);
		expect(women).toHaveAttribute("aria-invalid", "true");
		expect(men).toHaveAttribute("aria-invalid", "true");
		expect(women.getAttribute("aria-describedby")).toContain(
			message.parentElement?.id,
		);
	});

	it("disables both inputs through the fieldset when read-only", () => {
		render(<Harness disabled />);
		const { women, men } = fields();

		expect(women).toBeDisabled();
		expect(men).toBeDisabled();
	});
});

describe("complementPercentage", () => {
	it.each([
		["35", "65"],
		["35,5", "64.5"],
		["33.3", "66.7"],
		["0", "100"],
		["100", "0"],
	])("complements %s to %s", (raw, expected) => {
		expect(complementPercentage(raw)).toBe(expected);
	});

	it.each([
		"",
		"35.",
		"35,",
		"150",
		"-5",
		"abc",
	])("returns undefined for %s", (raw) => {
		expect(complementPercentage(raw)).toBeUndefined();
	});
});

describe("isPercentageInput", () => {
	it.each([
		"",
		"3",
		"35",
		"100",
		"35.",
		"35,5",
		"35.5",
	])("accepts %s", (raw) => {
		expect(isPercentageInput(raw)).toBe(true);
	});

	it.each(["35.55", "1000", "-5", "abc", "3 5"])("rejects %s", (raw) => {
		expect(isPercentageInput(raw)).toBe(false);
	});
});
