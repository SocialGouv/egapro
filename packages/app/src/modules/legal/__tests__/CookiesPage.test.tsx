import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({ env: { NEXT_PUBLIC_MATOMO_URL: undefined } }));

import { CookiesPage } from "../CookiesPage";

describe("CookiesPage", () => {
	it("marks the « Do Not Track » setting as English", () => {
		render(<CookiesPage />);

		const term = screen.getByText("Do Not Track");
		expect(term.tagName).toBe("SPAN");
		expect(term).toHaveAttribute("lang", "en");
	});

	it("keeps the French gloss and quotes around the English term", () => {
		render(<CookiesPage />);

		const paragraph = screen.getByText("Do Not Track").closest("p");
		expect(paragraph?.textContent).toContain(
			"le signal «\u00a0Do Not Track\u00a0» (Ne pas me pister), il est automatiquement respecté",
		);
	});
});
