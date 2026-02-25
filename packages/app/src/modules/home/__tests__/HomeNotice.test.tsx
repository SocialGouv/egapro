import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HomeNotice } from "../HomeNotice";

describe("HomeNotice", () => {
	it("renders the banner title", () => {
		render(<HomeNotice />);
		expect(screen.getByText(/egapro évolue/i)).toBeInTheDocument();
	});

	it("renders the description text", () => {
		render(<HomeNotice />);
		expect(
			screen.getByText(/nouvelles directives européennes/i),
		).toBeInTheDocument();
	});

	it("renders the 'En savoir plus' link", () => {
		render(<HomeNotice />);
		const link = screen.getByRole("link", { name: /en savoir plus/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/actualites");
	});

	it("renders the dismiss button", () => {
		render(<HomeNotice />);
		expect(
			screen.getByRole("button", { name: /masquer le message/i }),
		).toBeInTheDocument();
	});

	it("hides the banner when the dismiss button is clicked", async () => {
		const user = userEvent.setup();
		render(<HomeNotice />);

		await user.click(
			screen.getByRole("button", { name: /masquer le message/i }),
		);

		expect(screen.queryByText(/egapro évolue/i)).not.toBeInTheDocument();
	});

	it("has the fr-notice--info class", () => {
		const { container } = render(<HomeNotice />);
		expect(container.querySelector(".fr-notice--info")).toBeInTheDocument();
	});
});
