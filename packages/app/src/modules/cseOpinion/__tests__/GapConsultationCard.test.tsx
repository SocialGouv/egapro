import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GapConsultationCard } from "../components/GapConsultationCard";

describe("GapConsultationCard", () => {
	const defaultProps = {
		id: "test-gap",
		consulted: null as boolean | null,
		onConsultedChange: vi.fn(),
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
});
