import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StagnationDaysFilter } from "../StagnationDaysFilter";

describe("StagnationDaysFilter", () => {
	it("renders the current value", () => {
		render(<StagnationDaysFilter onChange={vi.fn()} value={30} />);
		expect(screen.getByRole("spinbutton")).toHaveValue(30);
	});

	it("calls onChange with the parsed number when the user types a valid value", () => {
		const onChange = vi.fn();
		render(<StagnationDaysFilter onChange={onChange} value={30} />);

		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "45" },
		});
		expect(onChange).toHaveBeenCalledWith(45);
	});

	it("clamps a value above the max to 180", () => {
		const onChange = vi.fn();
		render(<StagnationDaysFilter onChange={onChange} value={30} />);

		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "500" },
		});
		expect(onChange).toHaveBeenCalledWith(180);
	});

	it("clamps a value below the min to 1", () => {
		const onChange = vi.fn();
		render(<StagnationDaysFilter onChange={onChange} value={30} />);

		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "0" },
		});
		expect(onChange).toHaveBeenCalledWith(1);
	});

	it("ignores non-numeric input", () => {
		const onChange = vi.fn();
		render(<StagnationDaysFilter onChange={onChange} value={30} />);

		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "" },
		});
		expect(onChange).not.toHaveBeenCalled();
	});

	it("links the label to the input via htmlFor / id", () => {
		render(<StagnationDaysFilter onChange={vi.fn()} value={30} />);
		const input = screen.getByLabelText(
			/Considérer une déclaration abandonnée après/i,
		);
		expect(input).toBeInstanceOf(HTMLInputElement);
	});
});
