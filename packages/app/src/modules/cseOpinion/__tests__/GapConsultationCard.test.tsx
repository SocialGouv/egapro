import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GapConsultationCard } from "../components/GapConsultationCard";
import type { OpinionType } from "../types";

describe("GapConsultationCard", () => {
	const defaultProps = {
		id: "test-gap",
		consulted: null as boolean | null,
		opinion: null as OpinionType | null,
		date: "",
		onConsultedChange: vi.fn(),
		onOpinionChange: vi.fn(),
		onDateChange: vi.fn(),
	};

	it("renders the title and radio options", () => {
		render(<GapConsultationCard {...defaultProps} />);

		expect(screen.getByLabelText("Oui")).toBeInTheDocument();
		expect(screen.getByLabelText("Non")).toBeInTheDocument();
	});

	it("renders the question legend", () => {
		render(<GapConsultationCard {...defaultProps} />);

		expect(
			screen.getByText(
				/Avez-vous informé et consulté le CSE sur la justification des écarts/,
			),
		).toBeInTheDocument();
	});

	it("checks Oui radio when consulted is true", () => {
		render(<GapConsultationCard {...defaultProps} consulted={true} />);

		expect(screen.getByLabelText("Oui")).toBeChecked();
		expect(screen.getByLabelText("Non")).not.toBeChecked();
	});

	it("checks Non radio when consulted is false", () => {
		render(<GapConsultationCard {...defaultProps} consulted={false} />);

		expect(screen.getByLabelText("Oui")).not.toBeChecked();
		expect(screen.getByLabelText("Non")).toBeChecked();
	});

	it("has no radio checked when consulted is null", () => {
		render(<GapConsultationCard {...defaultProps} />);

		expect(screen.getByLabelText("Oui")).not.toBeChecked();
		expect(screen.getByLabelText("Non")).not.toBeChecked();
	});

	it("calls onConsultedChange with true when clicking Oui", async () => {
		const onConsultedChange = vi.fn();
		const user = userEvent.setup();

		render(
			<GapConsultationCard
				{...defaultProps}
				onConsultedChange={onConsultedChange}
			/>,
		);

		await user.click(screen.getByLabelText("Oui"));
		expect(onConsultedChange).toHaveBeenCalledWith(true);
	});

	it("calls onConsultedChange with false when clicking Non", async () => {
		const onConsultedChange = vi.fn();
		const user = userEvent.setup();

		render(
			<GapConsultationCard
				{...defaultProps}
				onConsultedChange={onConsultedChange}
			/>,
		);

		await user.click(screen.getByLabelText("Non"));
		expect(onConsultedChange).toHaveBeenCalledWith(false);
	});

	it("does not show opinion/date fields when consulted is null", () => {
		render(<GapConsultationCard {...defaultProps} />);

		expect(
			screen.queryByText("Quel est l'avis du CSE ?"),
		).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Date de l'avis/)).not.toBeInTheDocument();
	});

	it("does not show opinion/date fields when consulted is false", () => {
		render(<GapConsultationCard {...defaultProps} consulted={false} />);

		expect(
			screen.queryByText("Quel est l'avis du CSE ?"),
		).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Date de l'avis/)).not.toBeInTheDocument();
	});

	it("shows opinion radios and date field when consulted is true", () => {
		render(<GapConsultationCard {...defaultProps} consulted={true} />);

		expect(screen.getByText("Quel est l'avis du CSE ?")).toBeInTheDocument();
		expect(screen.getByLabelText("Favorable")).toBeInTheDocument();
		expect(screen.getByLabelText("Défavorable")).toBeInTheDocument();
		expect(screen.getByLabelText(/Date de l'avis/)).toBeInTheDocument();
	});

	it("calls onOpinionChange when selecting Favorable", async () => {
		const onOpinionChange = vi.fn();
		const user = userEvent.setup();

		render(
			<GapConsultationCard
				{...defaultProps}
				consulted={true}
				onOpinionChange={onOpinionChange}
			/>,
		);

		await user.click(screen.getByLabelText("Favorable"));
		expect(onOpinionChange).toHaveBeenCalledWith("favorable");
	});

	it("calls onDateChange when entering a date", async () => {
		const onDateChange = vi.fn();
		const user = userEvent.setup();

		render(
			<GapConsultationCard
				{...defaultProps}
				consulted={true}
				onDateChange={onDateChange}
			/>,
		);

		const dateInput = screen.getByLabelText(/Date de l'avis/);
		await user.clear(dateInput);
		await user.type(dateInput, "2027-01-15");
		expect(onDateChange).toHaveBeenCalled();
	});
});
