import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminHomePage } from "../AdminHomePage";

describe("AdminHomePage", () => {
	it("displays the admin welcome message with the user name and email", () => {
		render(<AdminHomePage userEmail="alice@example.com" userName="Alice" />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Backoffice" }),
		).toBeInTheDocument();
		expect(screen.getByText("Bienvenue, Alice.")).toBeInTheDocument();
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
	});
});
