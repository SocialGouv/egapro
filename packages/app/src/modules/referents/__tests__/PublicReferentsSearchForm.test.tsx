import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => mockSearchParams,
	usePathname: () => "/referents",
}));

import { PublicReferentsSearchForm } from "../PublicReferentsSearchForm";

describe("PublicReferentsSearchForm", () => {
	beforeEach(() => {
		mockPush.mockClear();
	});

	it("renders region, county and name inputs", () => {
		render(<PublicReferentsSearchForm />);
		expect(screen.getByLabelText(/région/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/département/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/nom du référent/i)).toBeInTheDocument();
	});

	it("disables the county select until a region is chosen", () => {
		render(<PublicReferentsSearchForm />);
		const county = screen.getByLabelText(/département/i);
		expect(county).toBeDisabled();
	});

	it("enables the county select when a region is chosen and filters options", () => {
		render(<PublicReferentsSearchForm />);
		const region = screen.getByLabelText(/région/i);
		fireEvent.change(region, { target: { value: "11" } });

		const county = screen.getByLabelText(/département/i);
		expect(county).not.toBeDisabled();
		// Île-de-France counties include 75 (Paris), should NOT include 29 (Finistère).
		expect(screen.getByRole("option", { name: /paris \(75\)/i })).toBeDefined();
		expect(
			screen.queryByRole("option", { name: /finistère/i }),
		).not.toBeInTheDocument();
	});

	it("pushes to /referents with URL params on submit", async () => {
		render(<PublicReferentsSearchForm />);
		fireEvent.change(screen.getByLabelText(/région/i), {
			target: { value: "11" },
		});
		fireEvent.input(screen.getByLabelText(/nom du référent/i), {
			target: { value: "durand" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^rechercher$/i }));

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringMatching(/\/referents\?.*region=11/),
			);
		});
		expect(mockPush).toHaveBeenCalledWith(
			expect.stringMatching(/query=durand/),
		);
		expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/page=1/));
	});

	it("resets form and navigates to /referents on reset", () => {
		render(<PublicReferentsSearchForm />);
		fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));

		expect(mockPush).toHaveBeenCalledWith("/referents");
	});
});
