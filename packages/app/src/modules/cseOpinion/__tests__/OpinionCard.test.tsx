import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OpinionCard } from "../components/OpinionCard";

describe("OpinionCard", () => {
	const defaultProps = {
		id: "test-accuracy",
		title: "Exactitude des données",
		opinion: null as "favorable" | "unfavorable" | null,
		date: "",
		onOpinionChange: vi.fn(),
		onDateChange: vi.fn(),
		errorAlertId: "opinions-errors",
	};

	it("renders the title and radio options", () => {
		render(<OpinionCard {...defaultProps} />);

		expect(screen.getByText("Exactitude des données")).toBeInTheDocument();
		expect(screen.getByLabelText("Favorable")).toBeInTheDocument();
		expect(screen.getByLabelText("Défavorable")).toBeInTheDocument();
	});

	it("renders the date input with label", () => {
		render(<OpinionCard {...defaultProps} />);

		expect(
			screen.getByLabelText(/Date de l'avis rendu par le CSE/),
		).toBeInTheDocument();
	});

	it("checks the favorable radio when opinion is favorable", () => {
		render(<OpinionCard {...defaultProps} opinion="favorable" />);

		expect(screen.getByLabelText("Favorable")).toBeChecked();
		expect(screen.getByLabelText("Défavorable")).not.toBeChecked();
	});

	it("checks the unfavorable radio when opinion is unfavorable", () => {
		render(<OpinionCard {...defaultProps} opinion="unfavorable" />);

		expect(screen.getByLabelText("Favorable")).not.toBeChecked();
		expect(screen.getByLabelText("Défavorable")).toBeChecked();
	});

	it("calls onOpinionChange when selecting a radio", async () => {
		const onOpinionChange = vi.fn();
		const user = userEvent.setup();

		render(<OpinionCard {...defaultProps} onOpinionChange={onOpinionChange} />);

		await user.click(screen.getByLabelText("Favorable"));
		expect(onOpinionChange).toHaveBeenCalledWith("favorable");
	});

	it("calls onDateChange when typing a date", async () => {
		const onDateChange = vi.fn();
		const user = userEvent.setup();

		render(<OpinionCard {...defaultProps} onDateChange={onDateChange} />);

		const dateInput = screen.getByLabelText(/Date de l'avis rendu par le CSE/);
		await user.type(dateInput, "2026-01-15");
		expect(onDateChange).toHaveBeenCalled();
	});

	it("displays the date value when provided", () => {
		render(<OpinionCard {...defaultProps} date="2026-01-15" />);

		const dateInput = screen.getByLabelText(/Date de l'avis rendu par le CSE/);
		expect(dateInput).toHaveValue("2026-01-15");
	});

	it("leaves the fields valid and undescribed when there is no error", () => {
		render(<OpinionCard {...defaultProps} />);

		for (const field of [
			screen.getByLabelText("Favorable"),
			screen.getByLabelText("Défavorable"),
			screen.getByLabelText(/Date de l'avis rendu par le CSE/),
		]) {
			expect(field).not.toHaveAttribute("aria-invalid");
			expect(field).not.toHaveAttribute("aria-describedby");
		}
	});

	it("marks the opinion radios invalid and points them at the alert message", () => {
		render(
			<OpinionCard
				{...defaultProps}
				opinionError={{
					fieldId: "test-accuracy-favorable",
					category: "empty",
					message: "Indiquez si l'avis est favorable ou défavorable.",
				}}
			/>,
		);

		for (const radio of [
			screen.getByLabelText("Favorable"),
			screen.getByLabelText("Défavorable"),
		]) {
			expect(radio).toHaveAttribute("aria-invalid", "true");
			expect(radio).toHaveAttribute(
				"aria-describedby",
				"opinions-errors-empty",
			);
		}
		expect(
			screen.getByRole("group", { name: "Exactitude des données" }),
		).toHaveClass("fr-fieldset--error");
		expect(
			screen.getByLabelText(/Date de l'avis rendu par le CSE/),
		).not.toHaveAttribute("aria-invalid");
	});

	it("marks the date invalid and points it at the alert message", () => {
		render(
			<OpinionCard
				{...defaultProps}
				dateError={{
					fieldId: "test-accuracy-date",
					category: "empty",
					message: "Renseignez la date de l'avis.",
				}}
			/>,
		);

		const dateInput = screen.getByLabelText(/Date de l'avis rendu par le CSE/);
		expect(dateInput).toHaveAttribute("aria-invalid", "true");
		expect(dateInput).toHaveAttribute(
			"aria-describedby",
			"opinions-errors-empty",
		);
		expect(dateInput).toHaveClass("fr-input--error");
		expect(screen.getByLabelText("Favorable")).not.toHaveAttribute(
			"aria-invalid",
		);
	});

	it("has accessible fieldset with legend", () => {
		render(<OpinionCard {...defaultProps} />);

		expect(screen.getByText("Quel est l'avis du CSE ?")).toBeInTheDocument();
	});
});
