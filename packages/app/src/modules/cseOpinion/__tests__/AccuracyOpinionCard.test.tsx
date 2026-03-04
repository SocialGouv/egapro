import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccuracyOpinionCard } from "../components/AccuracyOpinionCard";

describe("AccuracyOpinionCard", () => {
	const defaultProps = {
		id: "test-accuracy",
		title: "Exactitude des données",
		opinion: null as "favorable" | "unfavorable" | null,
		date: "",
		onOpinionChange: vi.fn(),
		onDateChange: vi.fn(),
	};

	it("renders the title and radio options", () => {
		render(<AccuracyOpinionCard {...defaultProps} />);

		expect(screen.getByText("Exactitude des données")).toBeInTheDocument();
		expect(screen.getByLabelText("Favorable")).toBeInTheDocument();
		expect(screen.getByLabelText("Défavorable")).toBeInTheDocument();
	});

	it("renders the date input with label", () => {
		render(<AccuracyOpinionCard {...defaultProps} />);

		expect(
			screen.getByLabelText(/Date de l'avis rendu par le CSE/),
		).toBeInTheDocument();
	});

	it("checks the favorable radio when opinion is favorable", () => {
		render(<AccuracyOpinionCard {...defaultProps} opinion="favorable" />);

		expect(screen.getByLabelText("Favorable")).toBeChecked();
		expect(screen.getByLabelText("Défavorable")).not.toBeChecked();
	});

	it("checks the unfavorable radio when opinion is unfavorable", () => {
		render(<AccuracyOpinionCard {...defaultProps} opinion="unfavorable" />);

		expect(screen.getByLabelText("Favorable")).not.toBeChecked();
		expect(screen.getByLabelText("Défavorable")).toBeChecked();
	});

	it("calls onOpinionChange when selecting a radio", async () => {
		const onOpinionChange = vi.fn();
		const user = userEvent.setup();

		render(
			<AccuracyOpinionCard
				{...defaultProps}
				onOpinionChange={onOpinionChange}
			/>,
		);

		await user.click(screen.getByLabelText("Favorable"));
		expect(onOpinionChange).toHaveBeenCalledWith("favorable");
	});

	it("calls onDateChange when typing a date", async () => {
		const onDateChange = vi.fn();
		const user = userEvent.setup();

		render(
			<AccuracyOpinionCard {...defaultProps} onDateChange={onDateChange} />,
		);

		const dateInput = screen.getByLabelText(/Date de l'avis rendu par le CSE/);
		await user.type(dateInput, "2026-01-15");
		expect(onDateChange).toHaveBeenCalled();
	});

	it("displays the date value when provided", () => {
		render(<AccuracyOpinionCard {...defaultProps} date="2026-01-15" />);

		const dateInput = screen.getByLabelText(/Date de l'avis rendu par le CSE/);
		expect(dateInput).toHaveValue("2026-01-15");
	});

	it("has accessible fieldset with legend", () => {
		render(<AccuracyOpinionCard {...defaultProps} />);

		expect(screen.getByText("Quel est l'avis du CSE ?")).toBeInTheDocument();
	});
});
